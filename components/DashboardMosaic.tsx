import React, { useState, useMemo } from 'react';
import { ProjectManagementState, KanbanCard, KanbanCardStatus, Team } from '../types.ts';

interface DashboardMosaicProps {
    projectState: ProjectManagementState;
}

const MiniKanbanCard: React.FC<{ card: KanbanCard }> = ({ card }) => (
    <div className="p-2 bg-white rounded border border-gray-300 shadow-sm text-xs mb-2">
        <p className="font-semibold truncate text-gray-900">{card.title}</p>
        <p className="text-gray-500">{card.id}</p>
    </div>
);

const MiniKanban: React.FC<{ team: Team, filteredCards?: KanbanCard[] }> = ({ team, filteredCards }) => {
    const sprint = team.activeSprint;
    if (!sprint) return null;

    const cardsToDisplay = filteredCards || sprint.workItems;
    
    const getCardsForStatus = (status: KanbanCardStatus) => cardsToDisplay.filter(c => c.status === status);

    return (
        <div className="bg-slate-100 rounded-lg p-2 border flex flex-col h-full">
            <h4 className="font-bold text-sm text-center mb-2 truncate p-1 border-b">{team.name}</h4>
            <div className="flex-grow grid grid-cols-3 gap-2 overflow-y-auto">
                <div>
                    <h5 className="text-xs font-semibold text-center text-gray-500">Backlog</h5>
                    <div className="mt-1 space-y-1">
                        {getCardsForStatus('backlog').map(card => <MiniKanbanCard key={card.id} card={card} />)}
                    </div>
                </div>
                 <div>
                    <h5 className="text-xs font-semibold text-center text-gray-500">En Progreso</h5>
                    <div className="mt-1 space-y-1">
                        {getCardsForStatus('inProgress').map(card => <MiniKanbanCard key={card.id} card={card} />)}
                    </div>
                </div>
                 <div>
                    <h5 className="text-xs font-semibold text-center text-gray-500">Hecho</h5>
                    <div className="mt-1 space-y-1">
                        {getCardsForStatus('done').map(card => <MiniKanbanCard key={card.id} card={card} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DashboardMosaic: React.FC<DashboardMosaicProps> = ({ projectState }) => {
    const [selectedEpicId, setSelectedEpicId] = useState<string>('all');
    const { teams, epics } = projectState;

    const activeTeams = useMemo(() => teams.filter(t => t.activeSprint), [teams]);
    
    const filteredCardsByTeam = useMemo(() => {
        if (selectedEpicId === 'all') return null;

        const result = new Map<string, KanbanCard[]>();
        activeTeams.forEach(team => {
            const cards = team.activeSprint?.workItems.filter(item => item.epicId === selectedEpicId) || [];
            result.set(team.id, cards);
        });
        return result;

    }, [selectedEpicId, activeTeams]);


    return (
        <div className="p-4 h-full flex flex-col">
            <div className="mb-4 flex items-center gap-4 p-2 bg-slate-50 rounded-lg border">
                <label htmlFor="epic-filter" className="font-semibold text-sm text-gray-700">Filtrar por Epic:</label>
                <select
                    id="epic-filter"
                    value={selectedEpicId}
                    onChange={e => setSelectedEpicId(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                    <option value="all">Todos los Epics</option>
                    {epics.map(epic => (
                        <option key={epic.id} value={epic.id}>{epic.title}</option>
                    ))}
                </select>
            </div>
            {activeTeams.length > 0 ? (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                    {activeTeams.map(team => (
                        <MiniKanban 
                            key={team.id} 
                            team={team} 
                            filteredCards={filteredCardsByTeam ? filteredCardsByTeam.get(team.id) : undefined}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                    <p>No hay equipos con sprints activos para mostrar en el mosaico.</p>
                </div>
            )}
        </div>
    );
};