import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ProjectManagementState, WorkItem, Team } from '../types.ts';

interface Line {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface ProgramBoardProps {
    projectState: ProjectManagementState;
    onWorkItemClick: (item: WorkItem) => void;
}

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

const ProgramBoardCard: React.FC<{ item: WorkItem; teams: Team[]; onClick: () => void }> = ({ item, teams, onClick }) => (
    <div
        id={`card-${item.id}`}
        onClick={onClick}
        className="p-3 rounded-md shadow-sm border bg-white cursor-pointer hover:bg-slate-50 mb-3"
    >
        <p className="font-semibold text-sm text-gray-900">{item.title}</p>
        <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">{item.id}</p>
            <CollaborationIcon workItem={item} teams={teams} />
        </div>
    </div>
);


export const ProgramBoard: React.FC<ProgramBoardProps> = ({ projectState, onWorkItemClick }) => {
    const [lines, setLines] = useState<Line[]>([]);
    const boardRef = useRef<HTMLDivElement>(null);

    const activeSprintItems = projectState.teams
        .flatMap(team => team.activeSprint?.workItems.map(item => ({ ...item, teamId: team.id })) ?? []);

    const teamForWorkItem = (itemId: string) => {
        return projectState.teams.find(team => team.activeSprint?.workItems.some(wi => wi.id === itemId));
    };

    const calculateLines = () => {
        if (!boardRef.current) return;
        const boardRect = boardRef.current.getBoundingClientRect();
        const newLines: Line[] = [];
        
        activeSprintItems.forEach(item => {
            if (item.dependencies && item.dependencies.length > 0) {
                const fromNode = document.getElementById(`card-${item.id}`);
                if (!fromNode) return;
                
                const fromRect = fromNode.getBoundingClientRect();
                
                item.dependencies.forEach(depId => {
                    const toNode = document.getElementById(`card-${depId}`);
                    if (!toNode) return;

                    const toRect = toNode.getBoundingClientRect();
                    
                    const fromTeam = teamForWorkItem(item.id);
                    const toTeam = teamForWorkItem(depId);

                    let x1 = toRect.right - boardRect.left;
                    let y1 = toRect.top - boardRect.top + toRect.height / 2;
                    let x2 = fromRect.left - boardRect.left;
                    let y2 = fromRect.top - boardRect.top + fromRect.height / 2;
                    
                    // If dependency is within the same team, draw line differently
                    if(fromTeam && toTeam && fromTeam.id === toTeam.id) {
                       x1 = fromRect.left - boardRect.left + fromRect.width / 2;
                       y1 = toRect.bottom - boardRect.top;
                       x2 = fromRect.left - boardRect.left + fromRect.width / 2;
                       y2 = fromRect.top - boardRect.top;
                    }


                    newLines.push({ id: `${item.id}-${depId}`, x1, y1, x2, y2 });
                });
            }
        });
        setLines(newLines);
    };

    useLayoutEffect(() => {
        // Debounce calculation to avoid excessive re-renders
        const handler = setTimeout(() => calculateLines(), 50);
        return () => clearTimeout(handler);
    }, [projectState]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => calculateLines());
        const boardEl = boardRef.current;
        if (boardEl) {
            resizeObserver.observe(boardEl);
        }
        return () => {
            if (boardEl) {
                resizeObserver.unobserve(boardEl);
            }
        };
    }, []);


    return (
        <div className="relative p-4 h-full overflow-auto" ref={boardRef}>
            <div className="flex gap-6 items-start">
                {projectState.teams.map(team => (
                    <div key={team.id} className="bg-slate-100 rounded-lg p-3 w-[320px] flex-shrink-0 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-800 p-2 border-b-2 border-slate-300 mb-4">{team.name}</h3>
                        <div className="overflow-y-auto">
                        {team.activeSprint ? (
                            team.activeSprint.workItems.length > 0 ? (
                                team.activeSprint.workItems.map(item => (
                                    <ProgramBoardCard key={item.id} item={item} teams={projectState.teams} onClick={() => onWorkItemClick(item)} />
                                ))
                             ) : (
                                <p className="text-sm text-gray-500 p-2 text-center">Sprint vacío.</p>
                             )
                        ) : <p className="text-sm text-gray-500 p-2 text-center">Sin sprint activo.</p>}
                        </div>
                    </div>
                ))}
            </div>

            <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ width: boardRef.current?.scrollWidth, height: boardRef.current?.scrollHeight }}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                    </marker>
                </defs>
                {lines.map(line => (
                    <line
                        key={line.id}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#ef4444"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                ))}
            </svg>
        </div>
    );
};