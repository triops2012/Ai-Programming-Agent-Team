import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sprint, KanbanCard, Transaction, KanbanCardStatus, AgentName } from '../types.ts';

const agentDetails: Record<AgentName, { icon: string }> = {
    Orchestrator: { icon: '👑' }, ProgramOrchestrator: { icon: '📊' }, Architect: { icon: '🏛️' }, ProjectManager: { icon: '📋' }, ProductOwner: { icon: '🎯' }, ScrumMaster: { icon: '🛡️' },
    TechLead: { icon: '🛠️' }, UIUXAgent: { icon: '🎨' }, ReactAgent: { icon: '⚛️' }, VueAgent: { icon: '🟩' }, AngularAgent: { icon: '🅰️' },
    CSSAgent: { icon: '💅' }, NodeAPIAgent: { icon: '⚙️' }, GoAPIAgent: { icon: '🐹' }, PythonAPIAgent: { icon: '🐍' }, JavaAPIAgent: { icon: '☕' },
    KotlinAPIAgent: { icon: '🔥' }, RubyAPIAgent: { icon: '💎' }, PHPAgent: { icon: '🐘' }, CSharpAPIAgent: { icon: '💠' }, SwiftAPIAgent: { icon: '🐦' },
    DelphiAgent: { icon: '🔷' }, PascalAgent: { icon: '📐' }, CAgent: { icon: '🔧' }, SQLDatabaseAgent: { icon: '🗃️' }, NoSQLDatabaseAgent: { icon: '📄' },
    DataStructureAgent: { icon: '📦' }, SupabaseAgent: { icon: '🌲' }, FirestoreAgent: { icon: '🔥' }, DockerAgent: { icon: '🐳' },
    GoogleCloudAgent: { icon: '☁️' }, GoogleScriptsAgent: { icon: '📜' }, TestingAgent: { icon: '🧪' }, SecurityAgent: { icon: '🛡️' },
    QualityAgent: { icon: ' VQ' },
    // Fix: Added missing 'IntegrationAgent' to satisfy the Record<AgentName, ...> type.
    IntegrationAgent: { icon: '🤝' },
    CICDAgent: { icon: '🚀' }, LearningAgent: { icon: '🧠' }, User: { icon: '👤' }
};

interface SprintTimeLapseModalProps {
    isOpen: boolean;
    onClose: () => void;
    sprint: Sprint;
}

const TimeLapseCard: React.FC<{ card: KanbanCard }> = ({ card }) => (
    <div className="p-2 bg-white rounded border border-gray-300 shadow-sm text-xs">
        <p className="font-semibold">{card.title}</p>
        <p className="text-gray-500">{card.id}</p>
    </div>
);

const TimeLapseColumn: React.FC<{ title: string, cards: KanbanCard[] }> = ({ title, cards }) => (
    <div className="flex-1 bg-gray-100 rounded p-2">
        <h4 className="font-bold text-sm text-center mb-2">{title}</h4>
        <div className="space-y-2 min-h-[100px]">
            {cards.map(card => <TimeLapseCard key={card.id} card={card} />)}
        </div>
    </div>
);

export const SprintTimeLapseModal: React.FC<SprintTimeLapseModalProps> = ({ isOpen, onClose, sprint }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const transactions = useMemo(() => sprint.transactionLog || [], [sprint]);

    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [sprint]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = window.setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= transactions.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, transactions.length]);

    if (!isOpen) return null;

    const currentTransaction = transactions[currentStep];
    const currentKanbanState = currentTransaction?.kanbanState || sprint.workItems;

    const getCardsForStatus = (status: KanbanCardStatus) => currentKanbanState.filter(c => c.status === status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Time-Lapse: {sprint.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </header>
                
                <main className="p-4 flex-grow overflow-y-auto space-y-4">
                    <div className="flex gap-4">
                        <TimeLapseColumn title="Backlog" cards={getCardsForStatus('backlog')} />
                        <TimeLapseColumn title="En Progreso" cards={getCardsForStatus('inProgress')} />
                        <TimeLapseColumn title="Hecho" cards={getCardsForStatus('done')} />
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-semibold text-sm">Paso {currentStep + 1} / {transactions.length}: {currentTransaction?.type}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="font-mono">{new Date(currentTransaction?.timestamp).toLocaleTimeString()}</span>
                            <span>{agentDetails[currentTransaction?.agent]?.icon} {currentTransaction?.agent}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{currentTransaction?.details}</p>
                    </div>
                </main>

                <footer className="p-4 bg-gray-50 border-t space-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
                            {isPlaying ? '❚❚' : '▶'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max={transactions.length > 0 ? transactions.length - 1 : 0}
                            value={currentStep}
                            onChange={e => setCurrentStep(Number(e.target.value))}
                            className="w-full"
                            disabled={transactions.length === 0}
                        />
                         <span className="text-sm font-mono whitespace-nowrap">{currentStep + 1} / {transactions.length}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};