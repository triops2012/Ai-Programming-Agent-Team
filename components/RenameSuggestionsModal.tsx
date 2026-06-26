import React, { useState, useEffect } from 'react';
import { RenameSuggestion } from '../types.ts';

interface RenameSuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: RenameSuggestion[];
    onConfirm: (approvedRenames: RenameSuggestion[]) => void;
}

interface LocalSuggestion extends RenameSuggestion {
    id: string;
    accepted: boolean;
}

export const RenameSuggestionsModal: React.FC<RenameSuggestionsModalProps> = ({ isOpen, onClose, suggestions, onConfirm }) => {
    const [localSuggestions, setLocalSuggestions] = useState<LocalSuggestion[]>([]);

    useEffect(() => {
        setLocalSuggestions(
            suggestions.map((s, i) => ({ ...s, id: `rename-${i}`, accepted: true }))
        );
    }, [suggestions]);

    if (!isOpen) return null;

    const handleToggleSuggestion = (id: string) => {
        setLocalSuggestions(prev => 
            prev.map(s => s.id === id ? { ...s, accepted: !s.accepted } : s)
        );
    };

    const handleConfirmClick = () => {
        const approvedRenames = localSuggestions
            .filter(s => s.accepted)
            .map(({ from, to }) => ({ from, to }));
        onConfirm(approvedRenames);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Sugerencias de Refactorización de Nombres</h2>
                    <p className="text-gray-600 mt-1">El Líder Técnico ha analizado la estructura de archivos y recomienda los siguientes cambios. Revisa y confirma las acciones.</p>
                </div>

                <div className="p-6 space-y-3 overflow-y-auto flex-grow">
                    {localSuggestions.length > 0 ? localSuggestions.map((suggestion) => (
                        <label key={suggestion.id} className="flex items-center p-3 rounded-md transition-colors duration-150 hover:bg-gray-50 border">
                            <input
                                type="checkbox"
                                checked={suggestion.accepted}
                                onChange={() => handleToggleSuggestion(suggestion.id)}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-4 flex-grow font-mono text-sm">
                                <span className="text-red-600 line-through">{suggestion.from}</span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="text-green-600 font-semibold">{suggestion.to}</span>
                            </div>
                        </label>
                    )) : (
                        <p className="text-gray-500 text-center py-8">El Líder Técnico no ha encontrado inconsistencias en los nombres de los archivos. ¡Buen trabajo!</p>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        Cancelar
                    </button>
                    <button onClick={handleConfirmClick} disabled={localSuggestions.length === 0} className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400">
                        Aplicar Cambios Aceptados
                    </button>
                </div>
            </div>
        </div>
    );
};