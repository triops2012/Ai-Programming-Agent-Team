import React, { useState, useEffect } from 'react';
import { ProductBacklogItem, SprintPlanningModalProps, SprintOption } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

export const SprintPlanningModal: React.FC<SprintPlanningModalProps> = ({
    isOpen,
    onClose,
    productBacklog,
    onStartSprint,
    isLoading,
    sprintOptions,
    teamId,
    teamName
}) => {
    const [view, setView] = useState<'suggestions' | 'manual'>('suggestions');
    const [selectedOption, setSelectedOption] = useState<SprintOption | null>(null);

    // Manual planning state
    const [sprintItems, setSprintItems] = useState<ProductBacklogItem[]>([]);
    const [availableBacklog, setAvailableBacklog] = useState<ProductBacklogItem[]>([]);

    useEffect(() => {
        // Reset state when modal opens or team changes
        if (isOpen) {
            setView('suggestions');
            setSelectedOption(null);
            
            // Prepare for manual mode just in case
            const relevantBacklog = productBacklog.filter(pbi => !pbi.primaryTeamId || pbi.primaryTeamId === teamId);
            setSprintItems([]);
            setAvailableBacklog(relevantBacklog);
        }
    }, [isOpen, teamId, productBacklog]);

    if (!isOpen) return null;

    const handleStartSprintClick = () => {
        let itemsToStart: ProductBacklogItem[] = [];
        let goal = "Completar las tareas seleccionadas.";

        if (view === 'suggestions' && selectedOption) {
            itemsToStart = selectedOption.storyIds
                .map(id => productBacklog.find(item => item.id === id))
                .filter((item): item is ProductBacklogItem => !!item);
            goal = selectedOption.title;
        } else if (view === 'manual') {
            itemsToStart = sprintItems;
        }
        
        if (itemsToStart.length > 0) {
            onStartSprint(itemsToStart, teamId, goal);
        }
    };
    
    // --- Manual Planning Logic ---
    const totalStoryPoints = sprintItems.reduce((acc, item) => acc + (item.storyPoints || 0), 0);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ProductBacklogItem, source: 'backlog' | 'sprint') => {
        e.dataTransfer.setData('item', JSON.stringify({ ...item, source }));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: 'backlog' | 'sprint') => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('item'));
        const item = data as ProductBacklogItem & { source: 'backlog' | 'sprint' };

        if (item.source === target) return;

        if (target === 'sprint') {
            setSprintItems(prev => [...prev, item]);
            setAvailableBacklog(prev => prev.filter(i => i.id !== item.id));
        } else {
            setAvailableBacklog(prev => [...prev, item]);
            setSprintItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const renderManualColumn = (title: string, items: ProductBacklogItem[], type: 'backlog' | 'sprint') => (
        <div
            className="flex-1 bg-gray-100 p-3 rounded-lg flex flex-col min-h-[200px]"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, type)}
        >
            <h3 className="font-bold text-lg mb-2">{title} {type === 'sprint' && `(${totalStoryPoints} SP)`}</h3>
            <div className="overflow-y-auto space-y-2 flex-grow p-1">
                {items.map(item => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, type)}
                        className="bg-white p-3 rounded-md shadow-sm border cursor-grab"
                    >
                        <p className="font-medium text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.storyPoints || 'N/A'} SP</p>
                    </div>
                ))}
                {items.length === 0 && <div className="text-center text-gray-400 p-4">Arrastra historias aquí</div>}
            </div>
        </div>
    );
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
        }
        
        if (view === 'manual') {
            return (
                <div className="p-4 flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                    {renderManualColumn('Product Backlog (Relevante)', availableBacklog, 'backlog')}
                    {renderManualColumn('Sprint Backlog', sprintItems, 'sprint')}
                </div>
            );
        }

        return (
            <div className="p-6 flex-grow overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {(sprintOptions && sprintOptions.length > 0) ? sprintOptions.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedOption(option)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 h-full flex flex-col ${
                                selectedOption?.title === option.title
                                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-white'
                            }`}
                        >
                            <h3 className="font-bold text-gray-800 text-lg">{option.title}</h3>
                            <p className="text-sm text-gray-600 my-2 flex-grow">{option.description}</p>
                            <div className="text-sm font-semibold text-blue-700 py-1 px-2 bg-blue-100 rounded-md self-start">{option.totalStoryPoints} Story Points</div>
                            <ul className="text-xs text-gray-500 mt-3 space-y-1 list-disc list-inside">
                                {option.storyIds.map(id => <li key={id}>{productBacklog.find(i => i.id === id)?.title || id}</li>)}
                            </ul>
                        </div>
                    )) : (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            <p>El Agente Product Owner no pudo generar sugerencias.</p>
                            <button onClick={() => setView('manual')} className="mt-2 text-blue-600 hover:underline font-semibold">
                                Planifica tu sprint manualmente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Planificación del Sprint: {teamName}</h2>
                        <div className="flex items-center gap-4 mt-1">
                            <button onClick={() => setView('suggestions')} className={`text-sm font-semibold ${view === 'suggestions' ? 'text-blue-600' : 'text-gray-500'}`}>Sugerencias de IA</button>
                            <button onClick={() => setView('manual')} className={`text-sm font-semibold ${view === 'manual' ? 'text-blue-600' : 'text-gray-500'}`}>Planificación Manual</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold p-2">&times;</button>
                </div>
                {renderContent()}
                <div className="p-4 bg-gray-50 border-t flex justify-end items-center gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button
                        onClick={handleStartSprintClick}
                        disabled={isLoading || (view === 'suggestions' && !selectedOption) || (view === 'manual' && sprintItems.length === 0)}
                        className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        Iniciar Sprint
                    </button>
                </div>
            </div>
        </div>
    );
};
