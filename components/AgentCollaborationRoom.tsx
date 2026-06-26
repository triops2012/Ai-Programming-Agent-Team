import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CollaborationMessage, AgentName, Team } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { agentProfiles } from '../agents/index.ts';

const agentDetails: Record<AgentName, { icon: string; color: string; name: string }> = {
    Orchestrator: { icon: '👑', color: 'bg-indigo-100 border-indigo-300', name: 'Orquestador' },
    // FIX: Added missing ProgramOrchestrator agent details to satisfy the AgentName type.
    ProgramOrchestrator: { icon: '📊', color: 'bg-emerald-100 border-emerald-300', name: 'Orq. de Programa' },
    Architect: { icon: '🏛️', color: 'bg-gray-100 border-gray-300', name: 'Arquitecto' },
    ProjectManager: { icon: '📋', color: 'bg-blue-100 border-blue-300', name: 'Project Manager' },
    ProductOwner: { icon: '🎯', color: 'bg-blue-100 border-blue-300', name: 'Product Owner' },
    ScrumMaster: { icon: '🛡️', color: 'bg-yellow-100 border-yellow-300', name: 'Scrum Master' },
    TechLead: { icon: '🛠️', color: 'bg-yellow-100 border-yellow-300', name: 'Líder Técnico' },
    UIUXAgent: { icon: '🎨', color: 'bg-pink-100 border-pink-300', name: 'Diseñador UX/UI' },
    ReactAgent: { icon: '⚛️', color: 'bg-cyan-100 border-cyan-300', name: 'Dev React' },
    VueAgent: { icon: '🟩', color: 'bg-green-100 border-green-300', name: 'Dev Vue' },
    AngularAgent: { icon: '🅰️', color: 'bg-red-100 border-red-300', name: 'Dev Angular' },
    CSSAgent: { icon: '💅', color: 'bg-sky-100 border-sky-300', name: 'Estilista CSS' },
    NodeAPIAgent: { icon: '⚙️', color: 'bg-lime-100 border-lime-300', name: 'Dev API (Node)' },
    GoAPIAgent: { icon: '🐹', color: 'bg-teal-100 border-teal-300', name: 'Dev API (Go)' },
    PythonAPIAgent: { icon: '🐍', color: 'bg-blue-100 border-blue-300', name: 'Dev API (Python)' },
    JavaAPIAgent: { icon: '☕', color: 'bg-orange-100 border-orange-300', name: 'Dev API (Java)' },
    KotlinAPIAgent: { icon: '🔥', color: 'bg-purple-100 border-purple-300', name: 'Dev API (Kotlin)' },
    RubyAPIAgent: { icon: '💎', color: 'bg-red-100 border-red-300', name: 'Dev API (Ruby)' },
    PHPAgent: { icon: '🐘', color: 'bg-indigo-100 border-indigo-300', name: 'Dev API (PHP)' },
    CSharpAPIAgent: { icon: '💠', color: 'bg-purple-100 border-purple-300', name: 'Dev API (C#)' },
    SwiftAPIAgent: { icon: '🐦', color: 'bg-orange-100 border-orange-300', name: 'Dev Swift' },
    DelphiAgent: { icon: '🔷', color: 'bg-blue-100 border-blue-300', name: 'Dev Delphi' },
    PascalAgent: { icon: '📐', color: 'bg-yellow-100 border-yellow-300', name: 'Dev Pascal' },
    CAgent: { icon: '🔧', color: 'bg-gray-100 border-gray-300', name: 'Dev C' },
    SQLDatabaseAgent: { icon: '🗃️', color: 'bg-orange-100 border-orange-300', name: 'Admin BBDD (SQL)' },
    NoSQLDatabaseAgent: { icon: '📄', color: 'bg-amber-100 border-amber-300', name: 'Admin BBDD (NoSQL)' },
    DataStructureAgent: { icon: '📦', color: 'bg-rose-100 border-rose-300', name: 'Estructura de Datos' },
    SupabaseAgent: { icon: '🌲', color: 'bg-green-100 border-green-300', name: 'Especialista Supabase' },
    FirestoreAgent: { icon: '🔥', color: 'bg-yellow-100 border-yellow-300', name: 'Especialista Firestore' },
    DockerAgent: { icon: '🐳', color: 'bg-blue-100 border-blue-300', name: 'DevOps (Docker)' },
    GoogleCloudAgent: { icon: '☁️', color: 'bg-gray-100 border-gray-300', name: 'Especialista GCP' },
    GoogleScriptsAgent: { icon: '📜', color: 'bg-yellow-100 border-yellow-300', name: 'Dev Google Scripts' },
    TestingAgent: { icon: '🧪', color: 'bg-green-100 border-green-300', name: 'Ingeniero de Pruebas' },
    SecurityAgent: { icon: '🛡️', color: 'bg-red-100 border-red-300', name: 'Seguridad' },
    QualityAgent: { icon: ' VQ', color: 'bg-teal-100 border-teal-300', name: 'Calidad' },
    // Fix: Added missing 'IntegrationAgent' to satisfy the Record<AgentName, ...> type.
    IntegrationAgent: { icon: '🤝', color: 'bg-teal-100 border-teal-300', name: 'Integración' },
    CICDAgent: { icon: '🚀', color: 'bg-purple-100 border-purple-300', name: 'CI/CD' },
    LearningAgent: { icon: '🧠', color: 'bg-gray-100 border-gray-300', name: 'Aprendizaje' },
    User: { icon: '👤', color: 'bg-green-100 border-green-300', name: 'Tú (Product Owner)' }
};

const MessageBubble: React.FC<{ msg: CollaborationMessage }> = ({ msg }) => {
    // FIX: Added a fallback for unknown agent names to prevent the application from crashing.
    // This can happen if the AI model hallucinates an agent name that is not in the predefined list.
    const details = agentDetails[msg.agent] || {
        icon: '❓',
        color: 'bg-gray-100 border-gray-300',
        name: msg.agent, // Display the unknown agent name as-is for debugging.
    };
    const profile = agentProfiles[msg.agent];

    const getMessageStyle = () => {
        switch (msg.type) {
            case 'system': return 'text-center text-sm text-gray-500 italic my-4';
            case 'pr-open': return `border-l-4 border-blue-500 ${details.color}`;
            case 'pr-review': return `border-l-4 border-yellow-500 ${details.color}`;
            case 'pr-approved': return `border-l-4 border-green-500 ${details.color}`;
            case 'pr-merged': return `border-l-4 border-purple-500 ${details.color}`;
            default: return details.color;
        }
    };
    
    if (msg.type === 'system') {
        return <div className={getMessageStyle()}>{msg.content}</div>;
    }

    return (
        <div className={`flex items-start gap-3 my-2 ${msg.agent === 'User' ? 'justify-end' : ''}`}>
            {msg.agent !== 'User' && (
                <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xl flex-shrink-0" title={`${details.name} - ${profile?.motto || ''}`}>
                    {details.icon}
                </div>
            )}
            <div className={`max-w-3xl p-3 rounded-xl border text-gray-900 ${getMessageStyle()}`}>
                <div className="font-bold text-sm mb-1 text-gray-800">{details.name}</div>
                <MarkdownRenderer content={msg.content} />
            </div>
            {msg.agent === 'User' && (
                 <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-xl flex-shrink-0" title={details.name}>
                    {details.icon}
                </div>
            )}
        </div>
    );
};

interface AgentCollaborationRoomProps {
    messages: CollaborationMessage[];
    onSendMessage: (message: string) => void;
    teams: Team[];
}

export const AgentCollaborationRoom: React.FC<AgentCollaborationRoomProps> = ({ messages, onSendMessage, teams }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [userInput, setUserInput] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    const workItems = useMemo(() => teams.flatMap(t => t.activeSprint?.workItems ?? []), [teams]);

    const totalActiveAgents = useMemo(() => {
        const agentSet = new Set(messages
            .filter(msg => msg.storyId && msg.agent !== 'User' && msg.type !== 'system')
            .map(msg => msg.agent)
        );
        return agentSet.size;
    }, [messages]);

    const filteredMessages = useMemo(() => {
        if (activeTab === 'general') {
            return messages.filter(msg => !msg.storyId);
        }
        return messages.filter(msg => msg.storyId === activeTab);
    }, [messages, activeTab]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [filteredMessages]);

    const handleSend = () => {
        if (userInput.trim()) {
            onSendMessage(userInput.trim());
            setUserInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-white rounded-xl shadow-lg border p-4 overflow-hidden">
            <header className="border-b pb-2 mb-4">
                 <div className="flex justify-between items-start">
                     <div>
                        <h2 className="text-xl font-bold text-gray-800">Sala de Colaboración del Equipo de IA</h2>
                        <p className="text-sm text-gray-500">Observa cómo los agentes desarrollan el proyecto e interviene cuando lo necesites.</p>
                     </div>
                     <div className="flex gap-4 font-medium text-gray-700 text-right text-sm border p-2 rounded-lg bg-slate-50">
                        <span><strong className="block text-lg">{teams.length}</strong> Equipos</span>
                        <span><strong className="block text-lg">{totalActiveAgents}</strong> Agentes Activos</span>
                     </div>
                 </div>
            </header>
            
            <div className="border-b border-gray-200 mb-2">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`whitespace-nowrap py-2 px-3 font-semibold text-sm rounded-t-lg transition-colors ${
                            activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        General
                    </button>
                    {workItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                             className={`whitespace-nowrap py-2 px-3 font-semibold text-sm rounded-t-lg transition-colors truncate ${
                                activeTab === item.id ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title={item.title}
                        >
                            {item.id}: {item.title}
                        </button>
                    ))}
                </nav>
            </div>

            <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2">
                 {filteredMessages.map((msg, index) => (
                    <MessageBubble key={index} msg={msg} />
                ))}
                <div className="flex justify-center my-4">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                 <div className="flex items-start space-x-3">
                    <textarea 
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm resize-none placeholder-gray-500 bg-gray-100 text-gray-900"
                        placeholder="Escribe tu directiva aquí como Product Owner (aparecerá en la pestaña General)..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleSend}
                        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    >
                        Intervenir
                    </button>
                </div>
            </div>
        </div>
    );
};