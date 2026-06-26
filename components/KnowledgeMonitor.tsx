import React, { useState, useEffect, useCallback } from 'react';
import * as vectorDbService from '../services/vectorDbService.ts';
import { AgentName, VectorStoreEntry } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { KnowledgeEntryModal } from './KnowledgeEntryModal.tsx';
import { RAGAgent, agentProfiles } from '../agents/index.ts';
import { callGeminiAPI, embedContent } from '../services/geminiService.ts';

export const KnowledgeMonitor: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<AgentName>(vectorDbService.ALL_AGENT_STORES[0]);
    const [knowledgeEntries, setKnowledgeEntries] = useState<VectorStoreEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<VectorStoreEntry | null>(null);

    const [researchTopic, setResearchTopic] = useState('');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isCorrectingId, setIsCorrectingId] = useState<number | null>(null);

    const selectedAgentProfile = agentProfiles[selectedAgent];


    const fetchKnowledge = useCallback(async () => {
        if (!selectedAgent) return;
        setIsLoading(true);
        try {
            const entries = await vectorDbService.getAllDocuments(selectedAgent);
            setKnowledgeEntries(entries);
        } catch (error) {
            console.error("Error fetching knowledge:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAgent]);

    useEffect(() => {
        fetchKnowledge();
    }, [fetchKnowledge]);
    
    const handleAddEntry = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };
    
    const handleEditEntry = (entry: VectorStoreEntry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDeleteEntry = async (id: number, namespace: AgentName) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
            await vectorDbService.deleteDocument(id, namespace);
            fetchKnowledge();
        }
    };
    
    const handleCorrectWithAI = async (entry: VectorStoreEntry) => {
        setIsCorrectingId(entry.id);
        try {
            const prompt = RAGAgent.getCorrectionPrompt(entry.text);
            // FIX: Updated the `callGeminiAPI` call to use the correct signature. The previous call passed a boolean, causing a type error. It now provides a full options object with `requestJson` and default `apiSettings` for the Gemini provider.
            const correctedTextResponse = await callGeminiAPI(prompt, [], { requestJson: false, apiSettings: { provider: 'gemini', model: 'gemini-3-flash-preview', endpoint: '' } });
            const correctedText = correctedTextResponse.text;
    
            if (correctedText && correctedText.trim() && correctedText.trim() !== entry.text.trim()) {
                const newEmbedding = await embedContent(correctedText);
                await vectorDbService.updateDocument(entry.id, correctedText, newEmbedding, selectedAgent);
                await fetchKnowledge();
            }
        } catch (error) {
            console.error("Error correcting knowledge:", error);
            // You might want to show an error toast here
        } finally {
            setIsCorrectingId(null);
        }
    };

    const handleEnrichKnowledge = async () => {
        if (!researchTopic.trim()) return;
        setIsEnriching(true);
        try {
            const prompt = RAGAgent.getWebIngestionPrompt(researchTopic);
            // We set requestJson to false because the googleSearch tool is needed,
            // and the agent is prompted to return a JSON string in its text response.
            // FIX: Updated the `callGeminiAPI` call to use the correct signature. The previous call passed a boolean, causing a type error. It now provides a full options object with `requestJson` and default `apiSettings` for the Gemini provider.
            const response = await callGeminiAPI(prompt, [], { requestJson: false, apiSettings: { provider: 'gemini', model: 'gemini-3-flash-preview', endpoint: '' } });

            // FIX: The response is a GenerateContentResponse object. Extract the .text property before matching.
            const jsonString = response.text.match(/```json\s*([\s\S]*?)\s*```/)?.[1];
            if (!jsonString) {
                throw new Error("La IA no devolvió un JSON válido.");
            }

            const { knowledgePoints } = JSON.parse(jsonString);
            if (!knowledgePoints || !Array.isArray(knowledgePoints)) {
                throw new Error("El formato del JSON de conocimiento es incorrecto.");
            }

            for (const point of knowledgePoints) {
                if (typeof point === 'string' && point.trim()) {
                    const embedding = await embedContent(point);
                    await vectorDbService.addDocument(point, embedding, selectedAgent);
                }
            }
            
            setResearchTopic('');
            await fetchKnowledge(); // Refresh the list with the new knowledge

        } catch (error) {
            console.error("Error enriching knowledge:", error);
            // Here you might want to show an error message to the user
        } finally {
            setIsEnriching(false);
        }
    };


    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border p-4 sm:p-6">
            <header className="pb-4 border-b flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">🧠 Monitor de Conocimiento</h2>
                    <p className="text-sm text-gray-500">Inspecciona, cura y contribuye a la memoria a largo plazo de tu equipo de IA.</p>
                </div>
                 <button onClick={handleAddEntry} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700">
                    + Añadir Lección Manualmente
                </button>
            </header>
            
            <div className="py-4 space-y-4">
                <div>
                    <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700">
                        Selecciona un especialista para ver su memoria:
                    </label>
                    <select
                        id="agent-select"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white text-gray-900"
                    >
                        {vectorDbService.ALL_AGENT_STORES.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                        ))}
                    </select>
                    {selectedAgentProfile && (
                        <p className="text-xs text-gray-500 mt-2 p-2 bg-slate-50 rounded-md">
                            <strong className="text-gray-700">Misión:</strong> {selectedAgentProfile.mission}
                        </p>
                    )}
                </div>
                 <div className="p-4 bg-slate-50 rounded-lg border">
                    <label htmlFor="research-topic" className="block text-sm font-medium text-gray-700">
                        Investigación Proactiva
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Pide al agente que investigue un tema en la web y guarde los hallazgos en su memoria.</p>
                    <div className="flex gap-2">
                        <input
                            id="research-topic"
                            type="text"
                            value={researchTopic}
                            onChange={(e) => setResearchTopic(e.target.value)}
                            placeholder={`Ej: "mejores prácticas de ${selectedAgent}"`}
                            className="flex-grow p-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            disabled={isEnriching}
                        />
                        <button 
                            onClick={handleEnrichKnowledge} 
                            disabled={isEnriching || !researchTopic.trim()}
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center min-w-[120px]"
                        >
                            {isEnriching ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Investigar y Añadir'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable container for knowledge entries */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                {isLoading ? <LoadingSpinner /> : (
                    <div className="space-y-3">
                        {knowledgeEntries.length > 0 ? knowledgeEntries.map(entry => (
                            <div key={entry.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group relative">
                                <p className="text-gray-800">{entry.text}</p>
                                {isCorrectingId === entry.id && (
                                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Corrigiendo...
                                        </div>
                                    </div>
                                )}
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                                     <button onClick={() => handleEditEntry(entry)} disabled={isCorrectingId !== null} className="text-xs text-blue-600 hover:underline disabled:opacity-50">Editar</button>
                                     <button onClick={() => handleDeleteEntry(entry.id, selectedAgent)} disabled={isCorrectingId !== null} className="text-xs text-red-600 hover:underline disabled:opacity-50">Eliminar</button>
                                     <button onClick={() => handleCorrectWithAI(entry)} disabled={isCorrectingId !== null} className="text-xs text-purple-600 hover:underline disabled:opacity-50">Corregir con IA</button>
                                </div>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-center text-gray-500">La base de conocimiento de este agente está vacía.</p>
                             </div>
                        )}
                    </div>
                )}
            </div>

             {isModalOpen && (
                <KnowledgeEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchKnowledge}
                    entry={editingEntry}
                    agentNamespace={selectedAgent}
                />
            )}
        </div>
    );
};
