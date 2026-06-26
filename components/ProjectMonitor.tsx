import React, { useState, useMemo, useEffect } from 'react';
import { ProjectManagementState, KanbanCard, KanbanCardStatus, ProductBacklogItem, Epic, WorkItem, Team, Sprint } from '../types.ts';
import { WorkItemDetailModal } from './WorkItemDetailModal.tsx';
import { ProgramBoard } from './ProgramBoard.tsx';
import { ApiContractsView } from './ApiContractsView.tsx';
import { DashboardMosaic } from './DashboardMosaic.tsx';

const formatSeconds = (seconds: number | undefined): string => {
    if (seconds === undefined) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
};


const CollaborationIcon: React.FC<{ workItem: WorkItem, teams: Team[] }> = ({ workItem, teams }) => {
    const { primaryTeamId, collaboratorTeamIds } = workItem;
    if (!collaboratorTeamIds || collaboratorTeamIds.length === 0) return null;
    
    const teamNameMap = new Map(teams.map(t => [t.id, t.name]));
    const primaryTeamName = primaryTeamId ? teamNameMap.get(primaryTeamId) : 'N/A';
    const collaboratorNames = collaboratorTeamIds.map(id => teamNameMap.get(id) || 'N/A');

    const tooltipText = `Colaboración:\n- Principal: ${primaryTeamName}\n- Colaboradores: ${collaboratorNames.join(', ')}`;

    return (
        <div className="relative inline-block" title={tooltipText}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
        </div>
    );
};

// --- Color Logic for Epics ---
const epicColorPalette: string[] = [
    'bg-sky-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100', 'bg-purple-100', 'bg-orange-100', 'bg-teal-100', 'bg-red-100'
];

const getColorForEpic = (epicId?: string): string => {
    if (!epicId) {
        return 'bg-white';
    }
    // Simple hash function to get a consistent color from the palette
    let hash = 0;
    for (let i = 0; i < epicId.length; i++) {
        hash = epicId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % epicColorPalette.length);
    return epicColorPalette[index];
};


// --- Kanban Column Component ---
const KanbanColumn: React.FC<{
    title: string;
    cards: KanbanCard[];
    onCardClick: (card: KanbanCard) => void;
    currentTeamId: string;
    teams: Team[];
}> = ({ title, cards, onCardClick, currentTeamId, teams }) => {
    const statusColorMap: Record<KanbanCardStatus, string> = {
        backlog: 'border-l-gray-400',
        inProgress: 'border-l-blue-500',
        inReview: 'border-l-orange-500',
        rework: 'border-l-red-500',
        inPipeline: 'border-l-purple-500',
        done: 'border-l-green-500'
    };

    return (
        <div
            className="bg-slate-100 rounded-lg p-3 flex-1 min-w-[280px] flex flex-col"
        >
            <h3 className="text-lg font-semibold text-gray-800 p-2 border-b-2 border-slate-300 mb-4">{title}</h3>
            <div className="space-y-3 overflow-y-auto flex-grow p-1">
                {cards.map(card => {
                    const isCollaborator = card.primaryTeamId !== currentTeamId;
                    const statusBorderClass = statusColorMap[card.status] || 'border-l-gray-400';
                    const epicColorClass = isCollaborator ? 'bg-white' : getColorForEpic(card.epicId);
                    
                    return (
                        <div
                            key={card.id}
                            onClick={() => onCardClick(card)}
                            className={`p-3 rounded-lg shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all ${statusBorderClass} ${epicColorClass} ${
                                isCollaborator 
                                ? 'border-dashed border-slate-400 opacity-80 hover:opacity-100' 
                                : 'border-slate-200 hover:border-blue-400'
                            }`}
                        >
                            <p className="font-semibold text-gray-900">{card.title}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500">SP: {card.storyPoints || 'N/A'}</p>
                                {card.status === 'done' && card.cycleTimeSeconds !== undefined && (
                                    <span className="text-xs font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                                        {formatSeconds(card.cycleTimeSeconds)}
                                    </span>
                                )}
                                <CollaborationIcon workItem={card} teams={teams} />
                            </div>
                        </div>
                    );
                })}
                 {cards.length === 0 && <div className="text-center text-gray-400 p-4"></div>}
            </div>
        </div>
    );
};

// --- Team Sprint View ---
const TeamSprintView: React.FC<{
    team: Team;
    teams: Team[];
    onCardClick: (card: WorkItem) => void;
    onStartSprintPlanning: (teamId: string, teamName: string) => void;
    onCompleteSprint: (team: Team) => void;
    onViewTimeLapse: (sprint: Sprint) => void;
}> = ({ team, teams, onCardClick, onStartSprintPlanning, onCompleteSprint, onViewTimeLapse }) => {
    const { activeSprint, completedSprints } = team;

    // FIX: Simplified logic to directly use the team's active sprint work items.
    // This resolves the bug where the detailed view was inconsistent with the mosaic view.
    const teamSprintItems = useMemo(() => {
        return activeSprint?.workItems || [];
    }, [activeSprint]);

    const getCardsForStatus = (status: KanbanCardStatus | KanbanCardStatus[]) => {
        const statuses = Array.isArray(status) ? status : [status];
        return teamSprintItems.filter(c => statuses.includes(c.status)) || [];
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex justify-between items-center pb-4 border-b mb-4">
                <div>
                     <h3 className="text-2xl font-bold text-gray-800">{team.name}</h3>
                </div>
                {activeSprint
                    ? <button onClick={() => onCompleteSprint(team)} className="button bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 shadow">Completar Sprint</button>
                    : <button onClick={() => onStartSprintPlanning(team.id, team.name)} className="button bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 shadow">Planificar Nuevo Sprint</button>
                }
            </header>
            <div className="flex-grow flex flex-col overflow-hidden">
                {activeSprint ? (
                    <div className="flex flex-col h-full">
                         <div className="text-sm text-gray-500 mb-2">
                           <strong>Progreso:</strong> {activeSprint.transactionLog?.length || 0} acciones completadas
                        </div>
                        <div className="flex flex-col md:flex-row gap-6 h-full flex-grow overflow-auto">
                            <KanbanColumn title="📋 Backlog del Sprint" cards={getCardsForStatus('backlog')} onCardClick={onCardClick} currentTeamId={team.id} teams={teams} />
                            <KanbanColumn title="⏳ En Progreso / Rework" cards={getCardsForStatus(['inProgress', 'rework'])} onCardClick={onCardClick} currentTeamId={team.id} teams={teams} />
                            <KanbanColumn title="🔍 En Revisión / Pipeline" cards={getCardsForStatus(['inReview', 'inPipeline'])} onCardClick={onCardClick} currentTeamId={team.id} teams={teams} />
                            <KanbanColumn title="✅ Hecho" cards={getCardsForStatus('done')} onCardClick={onCardClick} currentTeamId={team.id} teams={teams} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center p-8 bg-slate-50 rounded-lg">
                        <p className="text-gray-600">Este equipo no tiene un sprint activo. ¡Planifica uno nuevo para empezar!</p>
                    </div>
                )}

                {completedSprints.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Sprints Completados</h4>
                        <div className="space-y-2">
                            {completedSprints.map(sprint => (
                                <div key={sprint.id} className="bg-white p-2 rounded-md border flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{sprint.name}</p>
                                        <p className="text-xs text-gray-500">Completado el {new Date(sprint.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => onViewTimeLapse(sprint)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg">
                                        Ver Time-lapse
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Project Monitor Component ---
interface ProjectMonitorProps {
    projectState: ProjectManagementState;
    onUpdate: (newState: ProjectManagementState) => void;
    onStartSprintPlanning: (teamId: string, teamName: string) => void;
    onCompleteSprint: (team: Team) => void;
    onViewTimeLapse: (sprint: Sprint) => void;
}

export const ProjectMonitor: React.FC<ProjectMonitorProps> = ({ projectState, onUpdate, onStartSprintPlanning, onCompleteSprint, onViewTimeLapse }) => {
    const [activeTab, setActiveTab] = useState<string>('mosaico');
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);

    const { teams, productBacklog, epics, contracts, stats, achievements } = projectState;
    
    useEffect(() => {
        const isKnownTab = ['mosaico', 'program-board', 'backlog', 'contracts'].includes(activeTab);
        const teamExists = teams.some(t => t.id === activeTab);

        if (teams.length > 0) {
            // If the activeTab is not a known tab and not an existing team, default to mosaic.
            if (!isKnownTab && !teamExists) {
                setActiveTab('mosaico');
            }
        } else {
            // If there are no teams, default to backlog.
            if (activeTab !== 'backlog') {
                setActiveTab('backlog');
            }
        }
    }, [teams, activeTab]);
    
    const allActiveSprintItems = useMemo(() => teams.flatMap(t => t.activeSprint?.workItems ?? []), [teams]);

    const handleWorkItemUpdate = (updatedItem: WorkItem) => {
        // Find which team's sprint the item is in, if any
        let itemUpdated = false;
        const updatedTeams = teams.map(team => {
            if (team.activeSprint?.workItems.some(wi => wi.id === updatedItem.id)) {
                itemUpdated = true;
                const newWorkItems = team.activeSprint.workItems.map(wi => wi.id === updatedItem.id ? { ...wi, ...updatedItem as KanbanCard } : wi);
                return { ...team, activeSprint: { ...team.activeSprint, workItems: newWorkItems } };
            }
            return team;
        });

        if (itemUpdated) {
            onUpdate({ ...projectState, teams: updatedTeams });
        } else {
            // If not in any sprint, update the main backlog
            const newBacklog = productBacklog.map(pbi => pbi.id === updatedItem.id ? { ...pbi, ...updatedItem } : pbi);
            onUpdate({ ...projectState, productBacklog: newBacklog });
        }
    };

    const backlogByEpic = useMemo(() => {
        const grouped: { [key: string]: ProductBacklogItem[] } = {};
        const unassigned: ProductBacklogItem[] = [];

        productBacklog.forEach(item => {
            if (item.epicId) {
                if (!grouped[item.epicId]) grouped[item.epicId] = [];
                grouped[item.epicId].push(item);
            } else {
                unassigned.push(item);
            }
        });
        return { grouped, unassigned };
    }, [productBacklog]);
    
     const teamNameMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const renderBacklogItem = (item: ProductBacklogItem) => {
        const primaryTeamName = item.primaryTeamId ? teamNameMap.get(item.primaryTeamId) : 'Sin asignar';
        return (
            <div key={item.id} onClick={() => setSelectedWorkItem(item)} className="p-3 rounded-md shadow-sm border flex justify-between items-center cursor-pointer hover:bg-slate-50 bg-white">
                <div>
                    <span className="text-gray-900 font-semibold">{item.title}</span>
                    {item.dependencies && item.dependencies.length > 0 &&
                        <span className="ml-2 text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full" title={`Depende de: ${item.dependencies.join(', ')}`}>
                            Dependencias
                        </span>
                    }
                    <span className="ml-2 text-xs font-semibold text-white bg-gray-500 px-2 py-0.5 rounded-full">{primaryTeamName}</span>
                    {item.collaboratorTeamIds && item.collaboratorTeamIds.length > 0 && <CollaborationIcon workItem={item} teams={teams} />}
                </div>
                <span className="text-sm font-bold text-gray-500 bg-slate-100 px-2 py-1 rounded-full">{item.storyPoints || '?'} SP</span>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4 flex-1 flex flex-col bg-white rounded-xl shadow-lg border">
            <header className="flex justify-between items-center p-2">
                <h2 className="text-3xl font-bold text-gray-800">Monitor de Proyecto Ágil</h2>
            </header>
            <div className="border-b border-gray-200">
                <nav className="flex space-x-4 px-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('mosaico')}
                        className={`py-2 px-4 font-semibold text-sm capitalize transition-colors ${activeTab === 'mosaico' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mosaico
                    </button>
                    <button
                        onClick={() => setActiveTab('program-board')}
                        className={`py-2 px-4 font-semibold text-sm capitalize transition-colors ${activeTab === 'program-board' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Program Board
                    </button>
                    <button
                        onClick={() => setActiveTab('backlog')}
                        className={`py-2 px-4 font-semibold text-sm capitalize transition-colors ${activeTab === 'backlog' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Product Backlog
                    </button>
                    <button
                        onClick={() => setActiveTab('contracts')}
                        className={`py-2 px-4 font-semibold text-sm capitalize transition-colors ${activeTab === 'contracts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        API Contracts
                    </button>
                    {teams.map((team) => (
                        <button
                            key={team.id}
                            onClick={() => setActiveTab(team.id)}
                            className={`py-2 px-4 font-semibold text-sm capitalize transition-colors whitespace-nowrap ${activeTab === team.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {team.name}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-grow overflow-auto bg-slate-50 rounded-lg min-h-0">
                {activeTab === 'mosaico' ? (
                     <DashboardMosaic projectState={projectState} />
                ) : activeTab === 'program-board' ? (
                    <ProgramBoard projectState={projectState} onWorkItemClick={setSelectedWorkItem} />
                ) : activeTab === 'backlog' ? (
                    <div className="p-4 space-y-6">
                        {epics.map(epic => (
                            <div key={epic.id}>
                                <h3 className="text-xl font-bold text-gray-700 bg-slate-200 p-2 rounded-t-md">{epic.title}</h3>
                                <div className="space-y-2 p-2 bg-white rounded-b-md border border-t-0">
                                    {(backlogByEpic.grouped[epic.id] || []).map(renderBacklogItem)}
                                </div>
                            </div>
                        ))}
                        {backlogByEpic.unassigned.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 bg-slate-200 p-2 rounded-t-md">Historias sin Epic</h3>
                                <div className="space-y-2 p-2 bg-white rounded-b-md border border-t-0">
                                     {backlogByEpic.unassigned.map(renderBacklogItem)}
                                </div>
                            </div>
                        )}
                         {productBacklog.length === 0 && (
                            <div className="text-center text-gray-500 p-8">El Product Backlog está vacío.</div>
                        )}
                    </div>
                ) : activeTab === 'contracts' ? (
                    <ApiContractsView contracts={contracts || []} teams={teams} />
                ) : (
                    teams.find(team => team.id === activeTab) &&
                    <TeamSprintView
                        team={teams.find(team => team.id === activeTab)!}
                        teams={teams}
                        onCardClick={setSelectedWorkItem}
                        onStartSprintPlanning={onStartSprintPlanning}
                        onCompleteSprint={onCompleteSprint}
                        onViewTimeLapse={onViewTimeLapse}
                    />
                )}
            </div>
            {selectedWorkItem && (
                <WorkItemDetailModal
                    isOpen={!!selectedWorkItem}
                    onClose={() => setSelectedWorkItem(null)}
                    workItem={selectedWorkItem}
                    onSave={handleWorkItemUpdate}
                    teams={teams}
                />
            )}
        </div>
    );
};