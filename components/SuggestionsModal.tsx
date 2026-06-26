import React, { useState, useEffect } from 'react';
import { Suggestion } from '../types.ts';

interface SuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: Suggestion[];
    onApply: (acceptedTasks: string[]) => void;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ isOpen, onClose, suggestions, onApply }) => {
    const [localSuggestions, setLocalSuggestions] = useState<Suggestion[]>([]);
    const [newUserTask, setNewUserTask] = useState('');

    useEffect(() => {
        setLocalSuggestions(suggestions.map(s => ({ ...s, accepted: true })));
    }, [suggestions]);

    if (!isOpen) return null;

    const handleToggleSuggestion = (id: string) => {
        setLocalSuggestions(prev => 
            prev.map(s => s.id === id ? { ...s, accepted: !s.accepted } : s)
        );
    };

    const handleAddUserTask = () => {
        if (newUserTask.trim()) {
            const newTask: Suggestion = {
                id: `user-${Date.now()}`,
                text: newUserTask.trim(),
                accepted: true
            };
            setLocalSuggestions(prev => [...prev, newTask]);
            setNewUserTask('');
        }
    };

    const handleApplyClick = () => {
        const acceptedTasks = localSuggestions
            .filter(s => s.accepted)
            .map(s => s.text);
        onApply(acceptedTasks);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Planificación del Siguiente Sprint</h2>
                    <p className="text-gray-600 mt-1">El equipo de IA ha analizado el proyecto y sugiere las siguientes mejoras. Selecciona las tareas para el próximo ciclo de desarrollo.</p>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <h3 className="text-lg font-semibold text-gray-700">Sugerencias del Equipo de IA</h3>
                    {localSuggestions.filter(s => !s.id.startsWith('user-')).map((suggestion) => (
                        <label key={suggestion.id} className="flex items-start p-3 rounded-md transition-colors duration-150 hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={suggestion.accepted}
                                onChange={() => handleToggleSuggestion(suggestion.id)}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-700">{suggestion.text}</span>
                        </label>
                    ))}
                    <hr />
                     <h3 className="text-lg font-semibold text-gray-700">Tareas Adicionales (Añadidas por ti)</h3>
                     {localSuggestions.filter(s => s.id.startsWith('user-')).map((suggestion) => (
                        <label key={suggestion.id} className="flex items-start p-3 rounded-md bg-blue-50">
                            <input
                                type="checkbox"
                                checked={suggestion.accepted}
                                onChange={() => handleToggleSuggestion(suggestion.id)}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-800 font-medium">{suggestion.text}</span>
                        </label>
                    ))}
                    <div className="flex space-x-2">
                        <input 
                            type="text"
                            value={newUserTask}
                            onChange={(e) => setNewUserTask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddUserTask()}
                            placeholder="Añadir una nueva tarea o mejora..."
                            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 text-gray-900"
                        />
                        <button onClick={handleAddUserTask} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">Añadir</button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        Cancelar
                    </button>
                    <button onClick={handleApplyClick} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        Confirmar Sprint
                    </button>
                </div>
            </div>
        </div>
    );
};