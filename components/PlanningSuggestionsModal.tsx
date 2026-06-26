
import React, { useState, useEffect } from 'react';
import { PlanningSuggestion } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface PlanningSuggestionsModalProps {
    isOpen: boolean;
    suggestions: PlanningSuggestion[];
    onAcceptAndStart: (selected: PlanningSuggestion[]) => void;
    onAcceptAndSuggestMore: (selected: PlanningSuggestion[]) => void;
    isLoading: boolean;
}

export const PlanningSuggestionsModal: React.FC<PlanningSuggestionsModalProps> = ({ isOpen, suggestions, onAcceptAndStart, onAcceptAndSuggestMore, isLoading }) => {
    const [localSuggestions, setLocalSuggestions] = useState<PlanningSuggestion[]>([]);

    useEffect(() => {
        setLocalSuggestions(suggestions);
    }, [suggestions]);

    if (!isOpen) return null;

    const handleToggleSelection = (id: string) => {
        setLocalSuggestions(prev =>
            prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
        );
    };

    const getSelected = () => localSuggestions.filter(s => s.selected);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
                <style>{`
                    @keyframes fade-in-scale {
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    .animate-fade-in-scale {
                        animation: fade-in-scale 0.3s forwards;
                    }
                `}</style>
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Sugerencias del Arquitecto IA</h2>
                    <p className="text-gray-600 mt-1">He analizado tu idea. Aquí tienes algunas sugerencias para enriquecer el proyecto. Selecciona las que te gusten para construir el plan inicial.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-grow relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {localSuggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                onClick={() => handleToggleSelection(suggestion.id)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 h-full flex flex-col ${
                                    suggestion.selected
                                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-center mb-2">
                                     <input
                                        type="checkbox"
                                        readOnly
                                        checked={suggestion.selected}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                    />
                                    <h3 className="ml-3 font-bold text-gray-800">{suggestion.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600 flex-grow">{suggestion.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end items-center gap-3">
                    <button
                        onClick={() => onAcceptAndSuggestMore(getSelected())}
                        disabled={isLoading || getSelected().length === 0}
                        className="w-full sm:w-auto px-6 py-2 rounded-md bg-gray-600 text-white font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400"
                    >
                        Aceptar y Sugerir Más
                    </button>
                    <button
                        onClick={() => onAcceptAndStart(getSelected())}
                        disabled={isLoading || getSelected().length === 0}
                        className="w-full sm:w-auto px-8 py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                        Aceptar e Iniciar
                    </button>
                </div>
            </div>
        </div>
    );
};