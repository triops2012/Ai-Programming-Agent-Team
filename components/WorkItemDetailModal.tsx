import React, { useState, useEffect } from 'react';
import { WorkItem, AcceptanceCriterion, Team, KanbanCard } from '../types.ts';

interface WorkItemDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workItem: WorkItem;
    onSave: (updatedItem: WorkItem) => void;
    teams: Team[];
}

const formatSeconds = (seconds: number | undefined): string => {
    if (seconds === undefined) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
};


export const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({ isOpen, onClose, workItem, onSave, teams }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [storyPoints, setStoryPoints] = useState<string>('');
    const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriterion[]>([]);
    const [newCriterion, setNewCriterion] = useState('');
    
    const teamNameMap = new Map(teams.map(t => [t.id, t.name]));
    const typedWorkItem = workItem as KanbanCard;

    useEffect(() => {
        if (workItem) {
            setTitle(workItem.title);
            setDescription(workItem.description);
            setStoryPoints(workItem.storyPoints?.toString() || '');
            setAcceptanceCriteria(workItem.acceptanceCriteria || []);
        }
    }, [workItem]);

    if (!isOpen) return null;

    const handleSave = () => {
        const updatedItem: WorkItem = {
            ...workItem,
            title,
            description,
            storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
            acceptanceCriteria,
        };
        onSave(updatedItem);
        onClose();
    };

    const handleAddCriterion = () => {
        if (newCriterion.trim()) {
            setAcceptanceCriteria([...acceptanceCriteria, { text: newCriterion.trim(), completed: false }]);
            setNewCriterion('');
        }
    };
    
    const handleRemoveCriterion = (index: number) => {
        setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
    }

    const primaryTeamName = workItem.primaryTeamId ? teamNameMap.get(workItem.primaryTeamId) : 'Sin asignar';
    const collaboratorNames = workItem.collaboratorTeamIds?.map(id => teamNameMap.get(id)).filter(Boolean).join(', ') || 'Ninguno';


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Detalles de la Historia ({workItem.id})</h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Equipo Principal</label>
                            <p className="mt-1 text-gray-900 p-2 bg-gray-100 rounded-md">{primaryTeamName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Colaboradores</label>
                            <p className="mt-1 text-gray-900 p-2 bg-gray-100 rounded-md">{collaboratorNames}</p>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción (Como..., Quiero..., Para...)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Story Points</label>
                        <input
                            type="number"
                            value={storyPoints}
                            onChange={(e) => setStoryPoints(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Criterios de Aceptación</label>
                        <div className="space-y-2 mt-1">
                            {acceptanceCriteria.map((ac, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="flex-grow text-gray-800">- {ac.text}</span>
                                    <button onClick={() => handleRemoveCriterion(index)} className="text-red-500 hover:text-red-700">Eliminar</button>
                                </div>
                            ))}
                        </div>
                         <div className="flex space-x-2 mt-2">
                            <input 
                                type="text"
                                value={newCriterion}
                                onChange={(e) => setNewCriterion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCriterion()}
                                placeholder="Añadir nuevo criterio..."
                                className="flex-grow p-2 border border-gray-300 rounded-md bg-slate-100 text-gray-900"
                            />
                            <button onClick={handleAddCriterion} className="bg-gray-200 px-4 rounded-md">Añadir</button>
                        </div>
                    </div>
                    {typedWorkItem.completedAt && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 border-t pt-4 mt-4">Métricas de Flujo</h3>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div className="bg-slate-100 p-2 rounded-md">
                                    <p className="font-semibold text-gray-800">Lead Time</p>
                                    <p className="text-gray-600">{formatSeconds(typedWorkItem.leadTimeSeconds)}</p>
                                    <p className="text-xs text-gray-400">(Desde que entró al sprint)</p>
                                </div>
                                <div className="bg-slate-100 p-2 rounded-md">
                                    <p className="font-semibold text-gray-800">Cycle Time</p>
                                    <p className="text-gray-600">{formatSeconds(typedWorkItem.cycleTimeSeconds)}</p>
                                    <p className="text-xs text-gray-400">(Desde que se empezó a trabajar)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 text-white">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};