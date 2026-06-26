import React, { useState, useEffect } from 'react';
import { VectorStoreEntry, AgentName } from '../types.ts';
import * as vectorDbService from '../services/vectorDbService.ts';
import { embedContent } from '../services/geminiService.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface KnowledgeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    entry: VectorStoreEntry | null;
    agentNamespace: AgentName;
}

export const KnowledgeEntryModal: React.FC<KnowledgeEntryModalProps> = ({ isOpen, onClose, onSave, entry, agentNamespace }) => {
    const [text, setText] = useState('');
    const [namespace, setNamespace] = useState<AgentName>(agentNamespace);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (entry) {
            setText(entry.text);
            setNamespace(agentNamespace);
        } else {
            setText('');
            setNamespace(agentNamespace);
        }
        setError(null);
    }, [entry, agentNamespace, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!text.trim()) {
            setError('La lección no puede estar vacía.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const embedding = await embedContent(text);
            if (entry) { // Editing existing entry
                await vectorDbService.updateDocument(entry.id, text, embedding, namespace);
            } else { // Creating new entry
                await vectorDbService.addDocument(text, embedding, namespace);
            }
            onSave();
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido.";
            setError(`Error al guardar: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {entry ? 'Editar Lección Aprendida' : 'Añadir Nueva Lección'}
                    </h2>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="lesson-text" className="block text-sm font-medium text-gray-700">
                            Contenido de la Lección
                        </label>
                        <textarea
                            id="lesson-text"
                            rows={5}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 bg-slate-100 text-gray-900"
                            placeholder="Escribe una lección clara y accionable..."
                        />
                    </div>
                    <div>
                        <label htmlFor="agent-namespace" className="block text-sm font-medium text-gray-700">
                            Especialista Relevante
                        </label>
                        <select
                            id="agent-namespace"
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value as AgentName)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-blue-500"
                        >
                            {vectorDbService.ALL_AGENT_STORES.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                    </div>
                     {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center justify-center min-w-[100px] disabled:bg-blue-400">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};