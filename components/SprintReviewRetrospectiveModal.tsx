import React, { useState, useEffect, useCallback } from 'react';
import { Sprint, ChatMessage } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { callGeminiAPI } from '../services/geminiService.ts';

interface SprintReviewRetrospectiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    sprint: Sprint;
    onFinalize: (retrospectiveNotes: string) => void;
    reviewAgent: { getPrompt: (sprint: Sprint, completedItems: any[]) => string };
    retrospectiveAgent: { getInitialPrompt: () => ChatMessage, getNextPrompt: (history: ChatMessage[]) => ChatMessage | { summary: string } };
}

type View = 'review' | 'retrospective';

export const SprintReviewRetrospectiveModal: React.FC<SprintReviewRetrospectiveModalProps> = ({
    isOpen, onClose, sprint, onFinalize, reviewAgent, retrospectiveAgent
}) => {
    const [activeView, setActiveView] = useState<View>('review');
    const [reviewContent, setReviewContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [retroHistory, setRetroHistory] = useState<ChatMessage[]>([]);
    const [retroInput, setRetroInput] = useState('');
    const [retroSummary, setRetroSummary] = useState('');

    const generateReview = useCallback(async () => {
        setIsLoading(true);
        try {
            const completedItems = sprint.workItems.filter(wi => wi.status === 'done');
            const prompt = reviewAgent.getPrompt(sprint, completedItems);
            // FIX: Updated the `callGeminiAPI` call to use the correct signature, providing an options object with `requestJson` and default `apiSettings` for Gemini, as the previous call with a boolean was causing a type error.
            const response = await callGeminiAPI(prompt, [], { requestJson: false, apiSettings: { provider: 'gemini', model: 'gemini-3-flash-preview', endpoint: '' } });
            // FIX: The response from callGeminiAPI is a GenerateContentResponse object. Extract the text property.
            setReviewContent(response.text);
        } catch (error) {
            setReviewContent("Error al generar el resumen de la revisión del sprint.");
        } finally {
            setIsLoading(false);
        }
    }, [sprint, reviewAgent]);

    useEffect(() => {
        if (isOpen) {
            generateReview();
            setRetroHistory([retrospectiveAgent.getInitialPrompt()]);
            setActiveView('review');
            setRetroSummary('');
        }
    }, [isOpen, generateReview, retrospectiveAgent]);

    if (!isOpen) return null;

    const handleSendRetroMessage = () => {
        if (!retroInput.trim()) return;
        const userMessage: ChatMessage = { author: 'user', content: retroInput };
        const newHistory = [...retroHistory, userMessage];

        const agentResponse = retrospectiveAgent.getNextPrompt(newHistory);
        if ('summary' in agentResponse) {
            setRetroSummary(agentResponse.summary);
            setRetroHistory(newHistory); // Show the last user message
        } else {
             setRetroHistory([...newHistory, agentResponse]);
        }
        setRetroInput('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                        {activeView === 'review' ? `Revisión del ${sprint.name}` : `Retrospectiva del ${sprint.name}`}
                    </h2>
                    <div className="flex gap-2">
                        {activeView === 'review' && <button onClick={() => setActiveView('retrospective')} className="px-4 py-2 rounded-md bg-blue-600 text-white">Iniciar Retrospectiva</button>}
                        {activeView === 'retrospective' && <button onClick={() => onFinalize(retroSummary)} disabled={!retroSummary} className="px-4 py-2 rounded-md bg-green-600 text-white disabled:bg-gray-400">Finalizar Sprint</button>}
                    </div>
                </header>
                
                <main className="p-4 flex-grow overflow-y-auto">
                    {activeView === 'review' && (
                        isLoading ? <LoadingSpinner /> : <MarkdownRenderer content={reviewContent} />
                    )}
                    {activeView === 'retrospective' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-grow space-y-4 pr-2">
                                {retroHistory.map((msg, i) => (
                                    <div key={i} className={`flex items-start gap-2 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                                        {msg.author === 'agent' && <div className="w-6 h-6 rounded-full bg-gray-600 text-white text-sm flex items-center justify-center flex-shrink-0">A</div>}
                                        <div className={`max-w-xl p-2 rounded-lg text-gray-800 ${msg.author === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                            <MarkdownRenderer content={msg.content} />
                                        </div>
                                    </div>
                                ))}
                                {retroSummary && <div className="p-4 bg-green-50 rounded-lg border border-green-200"><MarkdownRenderer content={retroSummary} /></div>}
                            </div>
                            {!retroSummary && (
                                <div className="mt-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={retroInput}
                                        onChange={e => setRetroInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendRetroMessage()}
                                        placeholder="Responde a la pregunta..."
                                        className="flex-grow p-2 border rounded-md text-gray-900 bg-slate-100"
                                    />
                                    <button onClick={handleSendRetroMessage} className="px-4 py-2 bg-blue-600 text-white rounded-md">Enviar</button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
                
                <footer className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200">Cerrar</button>
                </footer>
            </div>
        </div>
    );
};
