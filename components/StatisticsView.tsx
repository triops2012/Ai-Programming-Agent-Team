import React, { useMemo, useState } from 'react';
import { ProjectManagementState, AgentName, ApiUsageLog } from '../types.ts';
import { agentProfiles } from '../agents/index.ts';
import { BarChart } from './charts/BarChart.tsx';
import { DonutChart } from './charts/DonutChart.tsx';


interface StatisticsViewProps {
    projectState: ProjectManagementState;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

// Helper to find a "nice" upper bound for chart scales
const getNiceMaxValue = (value: number) => {
    if (value === 0) return 10;
    const exponent = Math.floor(Math.log10(value));
    const powerOf10 = Math.pow(10, exponent);
    const leadingDigit = Math.ceil(value / powerOf10);
    return leadingDigit * powerOf10;
};


export const StatisticsView: React.FC<StatisticsViewProps> = ({ projectState }) => {
    const { apiUsageLogs = [], teams, productBacklog } = projectState;
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');

    const sprintNameMap = useMemo(() => {
        const map = new Map<string, string>();
        teams.forEach(team => team.completedSprints.forEach(s => map.set(s.id, s.name)));
        teams.forEach(team => { if (team.activeSprint) map.set(team.activeSprint.id, team.activeSprint.name) });
        return map;
    }, [teams]);

    const filteredLogs = useMemo(() => {
        if (selectedSprintId === 'all') {
            return apiUsageLogs;
        }
        return apiUsageLogs.filter(log => log.sprintId === selectedSprintId);
    }, [apiUsageLogs, selectedSprintId]);

    const stats = useMemo(() => {
        const totalRequests = filteredLogs.length;
        const successfulRequests = filteredLogs.filter(log => log.status === 'success').length;
        const totalInputTokens = filteredLogs.reduce((acc, log) => acc + log.inputTokens, 0);
        const totalOutputTokens = filteredLogs.reduce((acc, log) => acc + log.outputTokens, 0);
        const totalTokens = totalInputTokens + totalOutputTokens;
        const inputCostPerMillion = 0.32; // EUR
        const outputCostPerMillion = 0.64; // EUR
        const estimatedCost = (totalInputTokens / 1_000_000 * inputCostPerMillion) + (totalOutputTokens / 1_000_000 * outputCostPerMillion);
        const now = Date.now();
        const requestsLastMinute = filteredLogs.filter(log => now - new Date(log.timestamp).getTime() < 60000).length;

        const tokensByAgent = filteredLogs.reduce((acc, log) => {
            acc[log.agentName] = (acc[log.agentName] || 0) + log.inputTokens + log.outputTokens;
            return acc;
        }, {} as Record<AgentName, number>);
        // FIX: Cast the values from `Object.entries` to `number` in `sort` and `map` functions. This resolves type errors where TypeScript inferred the values as `unknown`.
        const sortedAgents = Object.entries(tokensByAgent).sort(([, a], [, b]) => (b as number) - (a as number)).map(([agentName, tokens]) => ({ label: agentProfiles[agentName as AgentName]?.name || agentName, value: tokens as number }));
        const maxAgentTokens = sortedAgents.length > 0 ? getNiceMaxValue(sortedAgents[0].value) : 0;

        const tokensBySprint = apiUsageLogs.reduce((acc, log) => {
            const sprintId = log.sprintId || 'general';
            acc[sprintId] = (acc[sprintId] || 0) + log.inputTokens + log.outputTokens;
            return acc;
        }, {} as Record<string, number>);
        // FIX: Cast the values from `Object.entries` to `number` in `sort` and `map` functions. This resolves type errors where TypeScript inferred the values as `unknown`.
        const sortedSprints = Object.entries(tokensBySprint).sort(([, a], [, b]) => (b as number) - (a as number)).map(([sprintId, tokens]) => ({
            label: sprintNameMap.get(sprintId) || 'Planificación / General',
            subLabel: sprintId !== 'general' ? sprintId : '',
            value: tokens as number
        }));
        const maxSprintTokens = sortedSprints.length > 0 ? getNiceMaxValue(sortedSprints[0].value) : 0;

        const storyTitleMap = new Map<string, string>();
        const allWorkItems = [...productBacklog, ...teams.flatMap(t => [...(t.activeSprint?.workItems || []), ...t.completedSprints.flatMap(s => s.workItems)])];
        allWorkItems.forEach(item => storyTitleMap.set(item.id, item.title));

        const tokensByStory = filteredLogs.reduce((acc, log) => {
            const storyId = log.storyId || 'general';
            acc[storyId] = (acc[storyId] || 0) + log.inputTokens + log.outputTokens;
            return acc;
        }, {} as Record<string, number>);
        // FIX: Cast the values from `Object.entries` to `number` in `sort` and `map` functions. This resolves type errors where TypeScript inferred the values as `unknown`.
        const sortedStories = Object.entries(tokensByStory).sort(([, a], [, b]) => (b as number) - (a as number)).map(([storyId, tokens]) => ({
            label: storyTitleMap.get(storyId) || 'General / Sin Historia',
            subLabel: storyId !== 'general' ? storyId : '',
            value: tokens as number
        }));
        const maxStoryTokens = sortedStories.length > 0 ? getNiceMaxValue(sortedStories[0].value) : 0;
        
        const donutChartData = [
            { label: 'Entrada (Input)', value: totalInputTokens, color: '#3b82f6' }, // blue-500
            { label: 'Salida (Output)', value: totalOutputTokens, color: '#8b5cf6' } // violet-500
        ];

        return {
            totalRequests,
            successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : 'N/A',
            totalTokens: totalTokens.toLocaleString(),
            estimatedCost: `~€${estimatedCost.toFixed(4)}`,
            requestsLastMinute,
            sortedAgents, maxAgentTokens,
            sortedSprints, maxSprintTokens,
            sortedStories, maxStoryTokens,
            donutChartData,
        };
    }, [filteredLogs, apiUsageLogs, teams, productBacklog, sprintNameMap]);

    const allSprints = useMemo(() => {
        const sprints: {id: string, name: string}[] = [];
        teams.forEach(team => {
            if(team.activeSprint) sprints.push({ id: team.activeSprint.id, name: team.activeSprint.name });
            team.completedSprints.forEach(s => sprints.push({ id: s.id, name: s.name }));
        });
        return sprints;
    }, [teams]);

    const selectedSprintName = selectedSprintId === 'all' ? 'Todo el Proyecto' : sprintNameMap.get(selectedSprintId) || '';

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-full font-sans text-gray-800 h-full overflow-y-auto">
            <header className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Estadísticas de Uso de la API</h2>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-lg text-gray-600">Monitoriza el consumo de recursos.</p>
                    <select
                        id="sprint-filter"
                        value={selectedSprintId}
                        onChange={e => setSelectedSprintId(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    >
                        <option value="all">Filtrar por Sprint (Todos)</option>
                        {allSprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            <section className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Resumen de: <span className="text-blue-600">{selectedSprintName}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Peticiones Totales" value={stats.totalRequests} description={`Éxito del ${stats.successRate}%`} />
                    <StatCard title="Tokens Totales" value={stats.totalTokens} description="Entrada + Salida" />
                    <StatCard title="Coste Estimado" value={stats.estimatedCost} description="Basado en gemini-3-flash-preview" />
                    <StatCard title="RPM (Último Minuto)" value={stats.requestsLastMinute} description="Límite seguro: 55 RPM" />
                </div>
            </section>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <DonutChart key={`donut-${selectedSprintId}`} title="Desglose de Tokens (Entrada vs. Salida)" data={stats.donutChartData} />
                <BarChart key={`agent-${selectedSprintId}`} title="Consumo por Agente" data={stats.sortedAgents} maxValue={stats.maxAgentTokens} color="blue" />
                {selectedSprintId === 'all' && (
                    <BarChart key={`sprint-${selectedSprintId}`} title="Consumo por Sprint" data={stats.sortedSprints} maxValue={stats.maxSprintTokens} color="indigo" />
                )}
                <BarChart key={`story-${selectedSprintId}`} title="Consumo por Historia de Usuario" data={stats.sortedStories} maxValue={stats.maxStoryTokens} color="purple" />
            </div>
            
            <section>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Registro de Llamadas Recientes</h3>
                <div className="bg-white rounded-lg shadow border max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-2 text-gray-900">Agente</th>
                                <th className="p-2 text-gray-900">Contexto (Sprint/Historia)</th>
                                <th className="p-2 text-gray-900">Tokens (E/S)</th>
                                <th className="p-2 text-gray-900">Estado</th>
                                <th className="p-2 text-gray-900">Latencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredLogs.slice().reverse().slice(0, 100).map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-2 font-medium text-gray-900">{agentProfiles[log.agentName]?.name || log.agentName}</td>
                                    <td className="p-2 font-mono text-xs text-gray-500">{sprintNameMap.get(log.sprintId || '') || log.sprintId || 'N/A'} / {log.storyId || 'N/A'}</td>
                                    <td className="p-2 font-mono text-gray-500">{log.inputTokens}/{log.outputTokens}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-gray-500">{log.latencyMs}ms</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredLogs.length === 0 && <p className="text-center text-gray-500 p-8">No se han registrado llamadas a la API para esta selección.</p>}
                </div>
            </section>
        </div>
    );
};
