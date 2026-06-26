import React from 'react';
import { AgentStats, Achievement, AgentName } from '../types.ts';
import { agentProfiles } from '../agents/index.ts';

interface StatsAndAchievementsViewProps {
    stats?: Partial<Record<AgentName, AgentStats>>;
    achievements?: Achievement[];
}

const XP_PER_LEVEL = 100;

const AgentStatCard: React.FC<{ agentName: AgentName, agentStats: AgentStats }> = ({ agentName, agentStats }) => {
    const profile = agentProfiles[agentName];
    if (!profile || !profile.mission) return null; // Don't show meta-agents

    const progressPercentage = (agentStats.xp % XP_PER_LEVEL);

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
                {/* FIX: Corrected agent name comparison from a display name to the actual agent enum value and removed non-existent 'icon' property. */}
                <span className="text-3xl">{agentProfiles[agentName]?.interaction.input.includes('Pull Request') ? '🔍' : '🧑‍💻'}</span>
                <div>
                    <h3 className="font-bold text-lg">{profile.name}</h3>
                    <p className="text-xs text-gray-500">{profile.motto}</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-blue-600">Nivel {agentStats.level}</span>
                    <span className="text-xs text-gray-500">{agentStats.xp} XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 flex justify-between">
                <span>Tareas Completadas: {agentStats.tasksCompleted}</span>
                <span>Issues Encontrados: {agentStats.issuesFound}</span>
            </div>
        </div>
    );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 flex items-center gap-4">
        <div className="text-4xl">{achievement.icon}</div>
        <div>
            <h3 className="font-bold text-yellow-900">{achievement.name}</h3>
            <p className="text-sm text-yellow-800">{achievement.description}</p>
            <p className="text-xs text-yellow-600 mt-1">Desbloqueado por @{achievement.agent} el {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
        </div>
    </div>
);

export const StatsAndAchievementsView: React.FC<StatsAndAchievementsViewProps> = ({ stats, achievements }) => {
    const sortedAgents = React.useMemo(() => {
        if (!stats) return [];
        return Object.entries(stats)
            // FIX: Cast the unknown types from `Object.entries` to `AgentStats` to safely access the 'xp' property in the filter and sort methods. This resolves multiple type errors related to accessing properties on `unknown`.
            .filter(([_, agentStats]) => agentStats && (agentStats as AgentStats).xp > 0) // Only show agents who have gained XP
            .sort(([, a], [, b]) => ((b as AgentStats)?.xp || 0) - ((a as AgentStats)?.xp || 0));
    }, [stats]);

    return (
        <div className="p-4 h-full overflow-y-auto">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Logros del Proyecto</h3>
                {achievements && achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.map(ach => <AchievementCard key={ach.id} achievement={ach} />)}
                    </div>
                ) : (
                    <p className="text-gray-500">Aún no se han desbloqueado logros.</p>
                )}
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Estadísticas del Equipo de IA</h3>
                {sortedAgents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedAgents.map(([agentName, agentStats]) => (
                            <AgentStatCard key={agentName} agentName={agentName as AgentName} agentStats={agentStats!} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Los agentes aún no han ganado experiencia.</p>
                )}
            </div>
        </div>
    );
};
