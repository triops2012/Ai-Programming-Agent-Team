
// FIX: The entire content of this file has been replaced.
// The original content was an erroneous copy of `index.tsx`, which caused critical import/export errors.
// This new content provides the main React component for the application, restoring its functionality.
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import saveAs from 'file-saver';

// Types
import {
    AppPhase, ChatMessage, FileNode, LogEntry, LogType, Suggestion, PlanningSuggestion,
    ProjectManagementState, ProductBacklogItem, Epic, Team, KanbanCard, AppState,
    SprintOption, DeploymentStatus, Sprint, KanbanCardStatus, AgentName, ApiContract, Achievement, WorkItem, View, CollaborationMessage, AgentStats, ApiCallContext, RenameSuggestion, ApiProvider
} from './types.ts';

// Services
import * as apiQueueService from './services/apiQueueService.ts';
import { GenerateContentResponse } from '@google/genai';
import * as storageService from './services/storageService.ts';
import { createAndDownloadZip } from './services/zipService.ts';
import { seedInitialKnowledge } from './services/knowledgeSeedingService.ts';
import * as deploymentService from './services/deploymentService.ts';
import * as achievementService from './services/achievementService.ts';
import { setApiProvider as setGeminiApiProvider } from './services/geminiService.ts';


// Agents
import {
    PlanningAgent, GenerationAgent, SuggestionAgent, ReviewAgent, OrchestratorAgent,
    SprintReviewAgent, RetrospectiveAgent, ProductOwnerAgent, LearningAgent,
    ProgramOrchestratorAgent, agentProfiles, RefactoringAgent, DocumentationAgent, TeamAgents
} from './agents/index.ts';

// Components
import { Sidebar } from './components/Sidebar.tsx';
import { PlanningChat } from './components/PlanningChat.tsx';
import { ChatInput } from './components/ChatInput.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { OutputDisplay } from './components/OutputDisplay.tsx';
import { LogWidget } from './components/LogWidget.tsx';
import { Documentation } from './components/Documentation.tsx';
import { SuggestionsModal } from './components/SuggestionsModal.tsx';
import { MessageBox } from './components/MessageBox.tsx';
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { PlanningSuggestionsModal } from './components/PlanningSuggestionsModal.tsx';
import { ProjectMonitor } from './components/ProjectMonitor.tsx';
import { SprintPlanningModal } from './components/SprintPlanningModal.tsx';
import { SprintReviewRetrospectiveModal } from './components/SprintReviewRetrospectiveModal.tsx';
import { AgentCollaborationRoom } from './components/AgentCollaborationRoom.tsx';
import { DeploymentModal } from './components/DeploymentModal.tsx';
import { KnowledgeMonitor } from './components/KnowledgeMonitor.tsx';
import { ApiErrorModal } from './components/ApiErrorModal.tsx';
import { PhaseIndicator } from './components/PhaseIndicator.tsx';
import { IDEHeader } from './components/IDEHeader.tsx';
import { StatisticsView } from './components/StatisticsView.tsx';
import { SprintTimeLapseModal } from './components/SprintTimeLapseModal.tsx';
import { StatsAndAchievementsView } from './components/StatsAndAchievementsView.tsx';
import { RenameSuggestionsModal } from './components/RenameSuggestionsModal.tsx';


const initialPmState: ProjectManagementState = {
    productBacklog: [],
    epics: [],
    teams: [],
    definitionOfDone: [
        'El código ha pasado todas las revisiones (Calidad, Seguridad, Integración).',
        'Se han escrito y aprobado las pruebas unitarias y de integración.',
        'La funcionalidad cumple con todos los criterios de aceptación.',
        'La documentación relevante ha sido actualizada.'
    ],
    collaborationMessages: [],
    contracts: [],
    stats: {},
    achievements: [],
    apiUsageLogs: []
};

const App: React.FC = () => {
    const [phase, setPhase] = useState<AppPhase>('planning');
    const [activeView, setActiveView] = useState<View>('planning');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [planningInput, setPlanningInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [renameSuggestions, setRenameSuggestions] = useState<RenameSuggestion[] | null>(null);
    const [planningSuggestions, setPlanningSuggestions] = useState<PlanningSuggestion[]>([]);
    const [isPlanningSuggestionsModalOpen, setIsPlanningSuggestionsModalOpen] = useState(false);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
    const [messageBox, setMessageBox] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [projectManagementState, setProjectManagementState] = useState<ProjectManagementState>(initialPmState);
    const [isApiErrorModalOpen, setIsApiErrorModalOpen] = useState(false);
    const [apiErrorMessage, setApiErrorMessage] = useState('');
    const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
    const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);
    
    // Time-lapse Modal State
    const [viewingTimeLapseSprint, setViewingTimeLapseSprint] = useState<Sprint | null>(null);

    // Sprint Planning Modal State
    const [sprintPlanningModal, setSprintPlanningModal] = useState<{ isOpen: boolean; teamId: string; teamName: string }>({ isOpen: false, teamId: '', teamName: '' });
    const [sprintOptions, setSprintOptions] = useState<SprintOption[] | null>(null);
    
    // Deployment State
    const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
    const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
    const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
    const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

    // Autonomous Mode State
    const [isAutonomousMode, setIsAutonomousMode] = useState(false);
    const prevIsAutonomousMode = useRef(isAutonomousMode);
    
    // API Provider State
    const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');
    const [localApiEndpoint, setLocalApiEndpoint] = useState('http://localhost:1234/v1');
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [selectedLocalModel, setSelectedLocalModel] = useState<string>('');
    const [localModelStatus, setLocalModelStatus] = useState<'disconnected' | 'loading' | 'connected' | 'error'>('disconnected');

    // Active Agent Orchestrators State
    const [activeOrchestrators, setActiveOrchestrators] = useState<Record<string, OrchestratorAgent>>({});

    // Load and Save State from LocalStorage
    useEffect(() => {
        const loadedState = storageService.loadState();
        if (loadedState) {
            setPhase(loadedState.phase);
            setChatMessages(loadedState.chatMessages);
            setFileTree(loadedState.fileTree);
            setSelectedFile(loadedState.selectedFile);
            setLogs(loadedState.logs);
            setSuggestions(loadedState.suggestions || []);
            setProjectManagementState(loadedState.projectManagementState || initialPmState);
        }
        seedInitialKnowledge();
    }, []);
    
    const appStateToSave: AppState = useMemo(() => ({
        phase, chatMessages, fileTree, selectedFile, logs, suggestions, projectManagementState
    }), [phase, chatMessages, fileTree, selectedFile, logs, suggestions, projectManagementState]);

    useEffect(() => {
        storageService.saveState(appStateToSave);
    }, [appStateToSave]);
    
    useEffect(() => {
        setGeminiApiProvider(apiProvider);
    }, [apiProvider]);

    const addLog = useCallback((message: string, type: LogType) => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    }, []);
    
    useEffect(() => {
        apiQueueService.initialize((log) => {
            setProjectManagementState(prev => ({
                ...prev,
                apiUsageLogs: [...(prev.apiUsageLogs || []), { ...log, id: `log-${Date.now()}` }]
            }));
        });
    }, []);

    const handleApiCall = useCallback(async (
        agentName: AgentName, 
        prompt: string, 
        options: { requestJson: boolean }, 
        storyId?: string
    ): Promise<GenerateContentResponse | null> => {
        setIsLoading(true);
        try {
            const context = { agentName, storyId };
            const apiSettings = {
                provider: apiProvider,
                endpoint: localApiEndpoint,
                model: apiProvider === 'local' ? selectedLocalModel : 'gemini-3-flash-preview',
            };
            return await apiQueueService.enqueueRequest(prompt, { ...options, apiSettings }, context);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            setApiErrorMessage(message);
            setIsApiErrorModalOpen(true);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiProvider, localApiEndpoint, selectedLocalModel]);

    const apiCallFunctionForAgents = useCallback(
        (prompt: string, options: { requestJson: boolean }, context: ApiCallContext) => {
            const apiSettings = {
                provider: apiProvider,
                endpoint: localApiEndpoint,
                model: apiProvider === 'local' ? selectedLocalModel : 'gemini-3-flash-preview',
            };
            return apiQueueService.enqueueRequest(prompt, { ...options, apiSettings }, context);
        },
        [apiProvider, localApiEndpoint, selectedLocalModel]
    );

    const handleLoadLocalModels = useCallback(async () => {
        setLocalModelStatus('loading');
        setLocalModels([]);
        setSelectedLocalModel('');
        try {
            // Ensure endpoint doesn't have a trailing slash before adding the path
            const endpoint = localApiEndpoint.replace(/\/$/, '') + '/models';
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            const modelIds = data.data.map((model: any) => model.id);
            setLocalModels(modelIds);
            if (modelIds.length > 0) {
                setSelectedLocalModel(modelIds[0]);
                setLocalModelStatus('connected');
                setMessageBox({ text: `Conectado y ${modelIds.length} modelos cargados.`, type: 'success' });
            } else {
                setLocalModelStatus('error');
                addLog('Conectado al servidor local, pero no se encontraron modelos cargados en LM Studio.', LogType.Warning);
                setMessageBox({ text: 'Conectado, pero no se encontraron modelos.', type: 'error' });
            }
        } catch (error) {
            setLocalModelStatus('error');
            const message = error instanceof Error ? error.message : "Error desconocido.";
            addLog(`No se pudo conectar al servidor local: ${message}.`, LogType.Error);
            setMessageBox({ text: `No se pudo conectar: ${message}. ¿Está LM Studio en ejecución y CORS habilitado?`, type: 'error' });
        }
    }, [localApiEndpoint, addLog]);

    const postCollaborationMessage = useCallback((agent: AgentName, content: string, type: CollaborationMessage['type'] = 'system', storyId?: string) => {
        const newMessage: CollaborationMessage = {
            agent,
            content,
            type,
            timestamp: new Date().toISOString(),
            storyId,
        };
        setProjectManagementState(prev => ({
            ...prev,
            collaborationMessages: [...prev.collaborationMessages, newMessage]
        }));
    }, []);


    const handleInitialPlanning = useCallback(async (idea: string) => {
        const prompt = SuggestionAgent.getPrompt(idea);
        const response = await handleApiCall('Architect', prompt, { requestJson: true });
        if (!response) return;

        try {
            // Robust JSON parsing: handles optional markdown code blocks.
            const jsonText = response.text.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || response.text;
            const parsed = JSON.parse(jsonText);
            
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                 throw new Error("La respuesta JSON no contiene un array 'suggestions'.");
            }

            const suggestions: PlanningSuggestion[] = parsed.suggestions.map((s: any, i: number) => ({
                id: `sugg-${Date.now()}-${i}`,
                title: s.title,
                description: s.description,
                selected: true,
            }));
            setPlanningSuggestions(suggestions);
            setIsPlanningSuggestionsModalOpen(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido.";
            addLog(`Failed to parse planning suggestions from AI: ${message}`, LogType.Error);
            addLog(`Raw AI response: ${response.text}`, LogType.Error);
            setMessageBox({ text: 'La IA devolvió una respuesta inválida. Inténtalo de nuevo.', type: 'error' });
        }
    }, [addLog, handleApiCall]);

    const handleStartGeneration = useCallback(async (finalPlan: ChatMessage[]) => {
        setPhase('generating');
        addLog('Plan approved. Starting project generation.', LogType.Success);

        const prompt = GenerationAgent.getPrompt(finalPlan);
        const response = await handleApiCall('Architect', prompt, { requestJson: true });
        if (!response) return;
        
        try {
            const { files } = JSON.parse(response.text);
            const backlogFile = files.find((f: FileNode) => f.name === 'PRODUCT_BACKLOG.md');
            if (backlogFile && backlogFile.content) {
                const { pbis, epics, teams } = GenerationAgent.parseBacklog(backlogFile.content);
                setProjectManagementState(prev => ({ ...prev, productBacklog: pbis, epics, teams }));
            }
            setFileTree(files);
            setPhase('collaboration');
            setActiveView('collaboration');
            addLog('Project management artifacts generated. Ready for collaboration.', LogType.Info);
        } catch(error) {
            addLog('Failed to parse generation response.', LogType.Error);
        }
    }, [addLog, handleApiCall]);
    
    const handleSendMessage = async () => {
        if (!planningInput.trim()) return;

        const newUserMessage: ChatMessage = { author: 'user', content: planningInput };
        setChatMessages(prev => [...prev, newUserMessage]);
        const currentInput = planningInput;
        setPlanningInput('');
        
        if (phase === 'planning' && chatMessages.length === 0) {
            await handleInitialPlanning(currentInput);
        } else {
            const prompt = PlanningAgent.getPrompt(currentInput, [...chatMessages, newUserMessage]);
            const response = await handleApiCall('Architect', prompt, { requestJson: false });
            if(response) {
                setChatMessages(prev => [...prev, { author: 'agent', content: response.text }]);
            }
        }
    };

    const handleStartSprintPlanning = useCallback(async (teamId: string, teamName: string) => {
        setSprintPlanningModal({ isOpen: true, teamId, teamName });
        setSprintOptions(null); // Clear previous options
        
        const team = projectManagementState.teams.find(t => t.id === teamId);
        const teamVelocity = team?.completedSprints.slice(-1)[0]?.completedStoryPoints || 0;
        
        const prompt = ProductOwnerAgent.getSprintOptionsPrompt(
            projectManagementState.productBacklog,
            "Desarrollar la funcionalidad principal de la aplicación.",
            teamVelocity
        );
        
        const response = await handleApiCall('ProductOwner', prompt, { requestJson: true });
        if (response) {
            try {
                const parsed = JSON.parse(response.text);
                setSprintOptions(parsed.sprintOptions);
                 postCollaborationMessage(
                    'ProductOwner',
                    `He analizado el backlog y la velocidad del **${teamName}**. He preparado ${parsed.sprintOptions.length} opciones estratégicas para el próximo sprint. Por favor, revisadlas.`,
                    'message'
                );
            } catch (error) {
                addLog(`Error al analizar las opciones de sprint: ${error}`, LogType.Error);
            }
        }
    }, [projectManagementState.productBacklog, projectManagementState.teams, handleApiCall, addLog, postCollaborationMessage]);
    
    const handleCompleteSprint = useCallback((teamToComplete: Team) => {
        const teamId = teamToComplete.id;
        const teamName = teamToComplete.name;

         postCollaborationMessage(
            'ScrumMaster',
            `¡Gran trabajo, **${teamName}**! El sprint ha finalizado oficialmente. Todas las tareas se han detenido. Preparando para la Revisión y Retrospectiva.`,
            'system'
        );

        setProjectManagementState(prev => {
            const newTeams = [...prev.teams];
            const teamIndex = newTeams.findIndex(t => t.id === teamId);
            if (teamIndex === -1 || !newTeams[teamIndex].activeSprint) return prev;
    
        const team = newTeams[teamIndex];
            const completedSprint: Sprint = {
                ...team.activeSprint!,
                completedStoryPoints: team.activeSprint!.workItems.filter(wi => wi.status === 'done').reduce((acc, item) => acc + (item.storyPoints || 0), 0),
                workItems: team.activeSprint!.workItems.map(wi => ({...wi, status: 'done', completedAt: new Date().toISOString()})),
                endDate: new Date().toISOString()
            };
    
        newTeams[teamIndex] = {
                ...team,
                activeSprint: null,
                completedSprints: [...team.completedSprints, completedSprint]
            };
            
            return { ...prev, teams: newTeams };
        });

        setActiveOrchestrators(prev => {
            const newOrchestrators = {...prev};
            delete newOrchestrators[teamId];
            return newOrchestrators;
        });

        addLog(`Sprint para el equipo ${teamName} ha sido completado.`, LogType.Success);
    }, [addLog, postCollaborationMessage]);
    
    // --- Orchestrator Callbacks ---
    const orchestratorCallbacks = useMemo(() => {
        
        const onTaskStatusChange = (taskId: string | null, status: KanbanCardStatus) => {
            if (!taskId) return;
            setProjectManagementState(prev => {
                const newTeams = prev.teams.map(team => {
                    const sprint = team.activeSprint;
                    if (sprint && sprint.workItems.some(wi => wi.id === taskId)) {
                        const newWorkItems = sprint.workItems.map(wi => 
                            wi.id === taskId ? { ...wi, status: status } as KanbanCard : wi
                        );
                        return { ...team, activeSprint: { ...sprint, workItems: newWorkItems } };
                    }
                    return team;
                });
                return { ...prev, teams: newTeams };
            });
        };

        const onAgentXpGain = (agent: AgentName, xp: number, event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake', attempts?: number) => {
            setProjectManagementState(prev => {
                const stats = { ...(prev.stats || {}) };
                // FIX: Added 'lessonsLearned: 0' to the initial AgentStats object to satisfy the type.
                const currentAgentStats: AgentStats = stats[agent] || { xp: 0, level: 1, tasksCompleted: 0, issuesFound: 0, successfulCorrections: 0, lessonsLearned: 0, achievements: [] };
                
                const newXp = currentAgentStats.xp + xp;
                const newLevel = Math.floor(newXp / 100) + 1;
                
                let newAgentStats: AgentStats = {
                    ...currentAgentStats,
                    xp: newXp,
                    level: newLevel,
                };
                
                switch(event) {
                    case 'taskCompleted':
                        newAgentStats.tasksCompleted = (newAgentStats.tasksCompleted || 0) + 1;
                        break;
                    case 'issueFound':
                        newAgentStats.issuesFound = (newAgentStats.issuesFound || 0) + 1;
                        break;
                    case 'learnedFromMistake':
                        newAgentStats.successfulCorrections = (newAgentStats.successfulCorrections || 0) + 1;
                        break;
                }

                const newlyUnlocked = achievementService.checkAndUnlockAchievements(agent, newAgentStats, prev, event, attempts);
                if (newlyUnlocked.length > 0) {
                    newlyUnlocked.forEach((ach, index) => {
                        setTimeout(() => setMessageBox({ text: `Logro Desbloqueado: ${ach.name}!`, type: 'success' }), index * 600);
                    });
                }

                return {
                    ...prev,
                    stats: {
                        ...stats,
                        [agent]: newAgentStats,
                    },
                    achievements: newlyUnlocked.length > 0 ? [...(prev.achievements || []), ...newlyUnlocked] : prev.achievements,
                };
            });
        };

        return {
            updateCollaborationUI: (message) => {
                setProjectManagementState(prev => ({
                    ...prev,
                    collaborationMessages: [...prev.collaborationMessages, message]
                }));
            },
            updateFileTreeUI: (newFileTree) => {
                setFileTree([...newFileTree]); // Create new array to trigger re-render
            },
            onTaskComplete: (taskId) => {
                 onTaskStatusChange(taskId, 'done');
            },
            logTransaction: (transaction) => { /* TODO: Implement */ },
            onContractsChange: (newContracts) => {
                 setProjectManagementState(prev => ({
                    ...prev,
                    contracts: [...(prev.contracts || []), ...newContracts.map((c, i) => ({...c, id: `contract-${Date.now()}-${i}`}))]
                }));
            },
            onTaskStartProgress: (taskId) => {
                setProjectManagementState(prev => {
                    const newTeams = prev.teams.map(team => {
                        if (team.activeSprint?.workItems.some(wi => wi.id === taskId)) {
                            const newWorkItems = team.activeSprint.workItems.map(wi => 
                                wi.id === taskId ? { ...wi, status: 'inProgress', inProgressAt: new Date().toISOString() } as KanbanCard : wi
                            );
                            return { ...team, activeSprint: { ...team.activeSprint, workItems: newWorkItems } };
                        }
                        return team;
                    });
                    return { ...prev, teams: newTeams };
                });
            },
            onTaskStatusChange: onTaskStatusChange,
            onAgentXpGain: onAgentXpGain,
        };
    }, []);


    const startOrchestratorForTeam = useCallback((team: Team, sprintId: string) => {
        if (!team.activeSprint) {
            addLog(`Intento de iniciar orquestador para ${team.name} sin sprint activo.`, LogType.Warning);
            return;
        }
    
        const sprintItems = team.activeSprint.workItems;
        const unfinishedItems = sprintItems.filter(i => i.status !== 'done');
    
        if (unfinishedItems.length === 0) {
            addLog(`El sprint de ${team.name} no tiene tareas pendientes. No se necesita orquestador.`, LogType.Info);
            return;
        }
    
        addLog(`Iniciando/Reanudando OrchestratorAgent para ${team.name}...`, LogType.Info);
        
        const orchestrator = new OrchestratorAgent(
            chatMessages,
            fileTree,
            sprintItems,
            sprintId,
            orchestratorCallbacks.updateCollaborationUI,
            orchestratorCallbacks.updateFileTreeUI,
            (finalFileTree) => {
                addLog(`El sprint de ${team.name} ha finalizado.`, LogType.Success);
                handleCompleteSprint(team);
            },
            apiCallFunctionForAgents,
            orchestratorCallbacks.onTaskComplete,
            orchestratorCallbacks.logTransaction,
            orchestratorCallbacks.onContractsChange,
            projectManagementState,
            orchestratorCallbacks.onTaskStartProgress,
            orchestratorCallbacks.onTaskStatusChange,
            orchestratorCallbacks.onAgentXpGain
        );
        
        setActiveOrchestrators(prev => ({...prev, [team.id]: orchestrator}));
        orchestrator.start();
    
    }, [addLog, chatMessages, fileTree, projectManagementState, orchestratorCallbacks, handleCompleteSprint, apiCallFunctionForAgents]);

    const handleStartSprint = useCallback((sprintItems: ProductBacklogItem[], teamId: string, sprintGoal: string) => {
        const team = projectManagementState.teams.find(t => t.id === teamId);
        if (!team) {
            addLog(`Error fatal: No se pudo encontrar el equipo ${teamId} para iniciar el sprint.`, LogType.Error);
            return;
        }
    
        const now = new Date();
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Sprint duration: 7 days
        const newSprint: Sprint = {
            id: `sprint-${teamId}-${Date.now()}`,
            name: `${team.name} Sprint ${team.completedSprints.length + 1}`,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            goal: sprintGoal,
            totalStoryPoints: sprintItems.reduce((acc, item) => acc + (item.storyPoints || 0), 0),
            completedStoryPoints: 0,
            workItems: sprintItems.map(item => ({ ...item, status: 'backlog', createdAt: now.toISOString() })),
            transactionLog: []
        };
    
        const teamWithNewSprint = { ...team, activeSprint: newSprint };
    
        setProjectManagementState(prev => {
            const newTeams = prev.teams.map(t => (t.id === teamId ? teamWithNewSprint : t));
            const newBacklog = prev.productBacklog.filter(pbi => !sprintItems.some(si => si.id === pbi.id));
            return { ...prev, teams: newTeams, productBacklog: newBacklog };
        });
    
        setSprintPlanningModal({ isOpen: false, teamId: '', teamName: '' });
        addLog(`Nuevo sprint iniciado para el equipo ${teamWithNewSprint.name}.`, LogType.Success);
    
        startOrchestratorForTeam(teamWithNewSprint, newSprint.id);
    
    }, [addLog, projectManagementState.teams, projectManagementState.productBacklog, startOrchestratorForTeam]);
    
    const handleSuggestMore = useCallback(async (acceptedSuggestions: PlanningSuggestion[]) => {
        const newMessages: ChatMessage[] = [
            ...chatMessages,
            { 
                author: 'agent', 
                content: "Excelentes elecciones. Basado en eso, las siguientes sugerencias se han añadido al plan:"
            },
            { 
                author: 'user', 
                content: acceptedSuggestions.map(s => `**${s.title}**: ${s.description}`).join('\n') 
            }
        ];
        setChatMessages(newMessages);
        setIsPlanningSuggestionsModalOpen(false);
    
        const initialIdea = chatMessages.find(m => m.author === 'user')?.content || '';
        if (!initialIdea) {
            addLog('No se pudo encontrar la idea inicial para obtener más sugerencias.', LogType.Error);
            return;
        }
    
        const context = {
            initialIdea,
            acceptedSuggestions: acceptedSuggestions.map(({ title, description }) => ({ title, description }))
        };
        
        const prompt = SuggestionAgent.getMoreSuggestionsPrompt(context);
        const response = await handleApiCall('Architect', prompt, { requestJson: true });
        if (!response) return;
    
        try {
            // Robust JSON parsing: handles optional markdown code blocks.
            const jsonText = response.text.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || response.text;
            const parsed = JSON.parse(jsonText);

            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                 throw new Error("La respuesta JSON no contiene un array 'suggestions'.");
            }
            
            const newSuggestions: PlanningSuggestion[] = parsed.suggestions.map((s: any, i: number) => ({
                id: `sugg-${Date.now()}-${i}`,
                title: s.title,
                description: s.description,
                selected: true,
            }));
            setPlanningSuggestions(newSuggestions);
            setIsPlanningSuggestionsModalOpen(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido.";
            addLog(`Error al analizar más sugerencias de planificación de la IA: ${message}`, LogType.Error);
            addLog(`Raw AI response: ${response.text}`, LogType.Error);
            setMessageBox({ text: 'La IA devolvió una respuesta inválida. Inténtalo de nuevo.', type: 'error' });
        }
    }, [addLog, handleApiCall, chatMessages]);

    // Autonomous Mode "Game Loop" - Refactored to avoid `while` loop inside useEffect
    useEffect(() => {
        if (isAutonomousMode && !prevIsAutonomousMode.current) {
            addLog("Modo Autónomo ACTIVADO. El sistema planificará y ejecutará sprints automáticamente.", LogType.Info);
        } else if (!isAutonomousMode && prevIsAutonomousMode.current) {
            addLog("Modo Autónomo DESACTIVADO.", LogType.Info);
        }
        prevIsAutonomousMode.current = isAutonomousMode;

        if (!isAutonomousMode) return;

        const idleTeam = projectManagementState.teams.find(t => !t.activeSprint);
        const workLeftInBacklog = projectManagementState.productBacklog.length > 0;

        if (idleTeam && workLeftInBacklog) {
            addLog(`Equipo inactivo encontrado: ${idleTeam.name}. Planificando sprint automáticamente...`, LogType.Delegation);

            const planAndStart = async () => {
                const teamVelocity = idleTeam?.completedSprints.slice(-1)[0]?.completedStoryPoints || 10;
                const prompt = ProductOwnerAgent.getSprintOptionsPrompt(
                    projectManagementState.productBacklog,
                    "Continuar con el desarrollo del producto.",
                    teamVelocity
                );
                
                try {
                    const response = await handleApiCall('ProductOwner', prompt, { requestJson: true });
                    if (response) {
                        const parsed = JSON.parse(response.text);
                        const options = parsed.sprintOptions as SprintOption[];
                        if (options && options.length > 0) {
                            const bestOption = options[0];
                            const sprintItems = bestOption.storyIds
                                .map(id => projectManagementState.productBacklog.find(item => item.id === id))
                                .filter((item): item is ProductBacklogItem => !!item);
                            
                            if (sprintItems.length > 0) {
                                addLog(`Opción de sprint seleccionada: "${bestOption.title}". Iniciando sprint...`, LogType.Success);
                                handleStartSprint(sprintItems, idleTeam.id, bestOption.title);
                            } else {
                                addLog(`No se encontraron items válidos para el sprint para ${idleTeam.name}.`, LogType.Warning);
                            }
                        } else {
                             addLog(`El PO no pudo generar opciones de sprint para ${idleTeam.name}.`, LogType.Warning);
                        }
                    }
                } catch (e) {
                     const message = e instanceof Error ? e.message : "Error desconocido."
                     addLog(`Error planificando sprint para ${idleTeam.name}: ${message}`, LogType.Error);
                }
            };
            planAndStart();

        } else if (!workLeftInBacklog && projectManagementState.teams.every(t => !t.activeSprint)) {
            addLog("Product Backlog vacío y no hay sprints activos. El Modo Autónomo se detendrá.", LogType.Success);
            setIsAutonomousMode(false);
        }

    }, [isAutonomousMode, projectManagementState.teams, projectManagementState.productBacklog, handleStartSprint, addLog, handleApiCall]);
    
     const handleSaveFile = (file: FileNode, newContent: string) => {
        const updateNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(node => {
                if (node === file || (node.path && file.path && node.path === file.path && node.name === file.name)) {
                    return { ...node, content: newContent };
                }
                if (node.children) {
                    return { ...node, children: updateNode(node.children) };
                }
                return node;
            });
        };
        setFileTree(prev => updateNode(prev));
        setSelectedFile(prev => prev ? {...prev, content: newContent} : null);
        setMessageBox({ text: `${file.name} guardado.`, type: 'success' });
    };

    const handleDeploy = async (type: 'webcontainer' | 'netlify') => {
        setDeploymentStatus('deploying');
        setDeploymentLogs([]);
        setDeploymentUrl(null);

        const logCallback = (log: string) => setDeploymentLogs(prev => [...prev, log]);

        try {
            const url = type === 'webcontainer'
                ? await deploymentService.deployToWebContainer(fileTree, logCallback)
                : await deploymentService.deployToNetlify(fileTree, logCallback);
            setDeploymentUrl(url);
            setDeploymentStatus('success');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Deployment failed.";
            logCallback(`ERROR: ${message}`);
            setDeploymentStatus('error');
        }
    };

    const handleRefactorProject = async () => {
        addLog('Solicitando refactorización de IA...', LogType.Info);
        const prompt = RefactoringAgent.getPrompt(fileTree);
        const response = await handleApiCall('TechLead', prompt, { requestJson: true });
        if (response) {
            try {
                const parsed = JSON.parse(response.text);
                const refactorSuggestions: Suggestion[] = parsed.suggestions.map((s: any, i: number) => ({
                    id: `refactor-${Date.now()}-${i}`,
                    text: s.text,
                    accepted: true,
                }));
                setSuggestions(refactorSuggestions);
                setIsSuggestionsModalOpen(true);
            } catch (e) {
                addLog('Error al analizar las sugerencias de refactorización.', LogType.Error);
            }
        }
    };
    
    const handleAnalyzeFileNames = async () => {
        addLog('Solicitando análisis de nombres de archivos...', LogType.Info);
        const prompt = TeamAgents.TechLeadAgent.getFileNameAnalysisPrompt(fileTree);
        const response = await handleApiCall('TechLead', prompt, { requestJson: true });
        if (response) {
            try {
                const parsed = JSON.parse(response.text);
                setRenameSuggestions(parsed.renameSuggestions || []);
            } catch (e) {
                 addLog('Error al analizar las sugerencias de nombres de archivo.', LogType.Error);
                 setMessageBox({ text: 'La IA devolvió una respuesta inválida.', type: 'error' });
            }
        }
    };

    const handleApplyRenames = (approvedRenames: RenameSuggestion[]) => {
        if (approvedRenames.length === 0) {
            setRenameSuggestions(null);
            return;
        }

        const renameFile = (nodes: FileNode[], from: string, to: string): FileNode[] => {
            // Helper to build full path for comparison
            const buildPath = (node: FileNode, parentPath: string) => `${parentPath}/${node.name}`.replace(/^\//, '');

            return nodes.map(node => {
                const currentPath = buildPath(node, node.path || '');
                if (currentPath === from) {
                    const newName = to.split('/').pop()!;
                    const newPath = to.substring(0, to.lastIndexOf('/'));
                    return { ...node, name: newName, path: newPath }; // This is simplified. A real impl needs to move the node.
                }
                 if (node.children) {
                    // This part is complex. A real implementation would need a more robust
                    // tree traversal and modification logic to move files between folders.
                    // For now, we focus on simple renames in the same directory.
                    return { ...node, children: renameFile(node.children, from, to) };
                }
                return node;
            });
        };
        
        let newFileTree = [...fileTree];
        // Note: This is a simplified rename logic. A robust implementation would handle moving files between directories.
        // For now, it will primarily work for correcting names within the same path.
        approvedRenames.forEach(({ from, to }) => {
            addLog(`Renombrando ${from} -> ${to}`, LogType.Info);
        });

        // Placeholder for a more complex tree update logic
        setMessageBox({ text: `${approvedRenames.length} archivos renombrados (simulación).`, type: 'success'});
        console.log("Applying renames (simulation):", approvedRenames);
        
        setRenameSuggestions(null);
    };


    const handleGenerateReadme = async () => {
        addLog('Generando README.md con IA...', LogType.Info);
        const prompt = DocumentationAgent.getPrompt(fileTree);
        const readmeContentResponse = await handleApiCall('TechLead', prompt, { requestJson: false });
        if (readmeContentResponse) {
            const readmeContent = readmeContentResponse.text;
            setFileTree(prevTree => {
                const newTree = prevTree.filter(f => f.name.toLowerCase() !== 'readme.md');
                newTree.push({ name: 'README.md', type: 'file', content: readmeContent });
                return newTree;
            });
            setMessageBox({ text: 'README.md generado/actualizado exitosamente!', type: 'success' });
        }
    };

    const handleDownloadZip = () => {
        createAndDownloadZip(fileTree, 'ai-project');
        setMessageBox({ text: 'Proyecto descargado como .zip.', type: 'success' });
    };
    
    const handleDownloadWithDocker = async () => {
        addLog('Generando archivos Docker con IA...', LogType.Info);
        const prompt = TeamAgents.TechLeadAgent.getDockerizationPlanPrompt(fileTree);
        const response = await handleApiCall('DockerAgent', prompt, { requestJson: true });
        if (response) {
            try {
                const { files: dockerFiles } = JSON.parse(response.text);
                setFileTree(currentTree => {
                    const newTree = [...currentTree, ...dockerFiles];
                    createAndDownloadZip(newTree, 'ai-project-with-docker');
                    return newTree;
                });
                setMessageBox({ text: 'Archivos Docker generados y proyecto descargado!', type: 'success' });
            } catch (e) {
                addLog('Error al analizar los archivos Docker.', LogType.Error);
            }
        }
    };

    const handleSaveProjectState = () => {
        try {
            const stateJson = JSON.stringify(appStateToSave, null, 2);
            const blob = new Blob([stateJson], { type: 'application/json' });
            saveAs(blob, 'ai-project-state.json');
            setMessageBox({ text: 'Estado del proyecto guardado exitosamente.', type: 'success' });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido.";
            setMessageBox({ text: `Error al guardar el estado: ${message}`, type: 'error' });
        }
    };
    
    const handleLoadProjectState = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not a string.");

                const loadedState: AppState = JSON.parse(text);
                
                if (!loadedState.phase || !loadedState.fileTree) {
                    throw new Error("El archivo no parece ser un estado de proyecto válido.");
                }

                setPhase(loadedState.phase);
                setChatMessages(loadedState.chatMessages || []);
                setFileTree(loadedState.fileTree || []);
                setSelectedFile(loadedState.selectedFile || null);
                setLogs((loadedState.logs || []).map(l => ({...l, timestamp: new Date(l.timestamp)})));
                setSuggestions(loadedState.suggestions || []);
                setProjectManagementState(loadedState.projectManagementState || initialPmState);

                setMessageBox({ text: 'Proyecto cargado exitosamente.', type: 'success' });
                setActiveView('ide');
            } catch (error) {
                const message = error instanceof Error ? error.message : "Error desconocido.";
                setMessageBox({ text: `Error al cargar el proyecto: ${message}`, type: 'error' });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleResumeSprints = useCallback(() => {
        addLog("Se ha activado la reanudación de sprints. Buscando sprints pausados...", LogType.Info);
        
        const resumableTeams = projectManagementState.teams.filter(team => 
            team.activeSprint && 
            team.activeSprint.workItems.some(wi => wi.status !== 'done')
        );
    
        if (resumableTeams.length > 0) {
            const message = `Reanudando ${resumableTeams.length} sprint(s) de forma escalonada para evitar exceder los límites de la API.`;
            setMessageBox({ text: message, type: 'success' });
            addLog(message, LogType.Info);
            
            resumableTeams.forEach((team, index) => {
                const delay = index * 3000; // Stagger by 3 seconds
                setTimeout(() => {
                    addLog(`Reanudando sprint para el equipo ${team.name} (retraso de ${delay / 1000}s).`, LogType.Info);
                    if (team.activeSprint) {
                        startOrchestratorForTeam(team, team.activeSprint.id);
                    }
                }, delay);
            });
        } else {
            addLog("No se encontraron sprints pausados para reanudar.", LogType.Info);
        }
    
        addLog("Iniciando modo autónomo para gestionar futuros sprints.", LogType.Info);
        setIsAutonomousMode(true);
    }, [addLog, projectManagementState.teams, startOrchestratorForTeam]);
    
    const resetState = useCallback(() => {
        setActiveOrchestrators({});
    
        setPhase('planning');
        setActiveView('planning');
        setChatMessages([]);
        setPlanningInput('');
        setIsLoading(false);
        setFileTree([]);
        setSelectedFile(null);
        setLogs([]);
        setSuggestions([]);
        setPlanningSuggestions([]);
        setIsPlanningSuggestionsModalOpen(false);
        setIsSuggestionsModalOpen(false);
        setMessageBox(null);
        setProjectManagementState({ ...initialPmState, apiUsageLogs: [] });
        setIsApiErrorModalOpen(false);
        setApiErrorMessage('');
        setIsGenerateConfirmOpen(false);
        setSprintPlanningModal({ isOpen: false, teamId: '', teamName: '' });
        setSprintOptions(null);
        setIsDeploymentModalOpen(false);
        setDeploymentStatus('idle');
        setDeploymentLogs([]);
        setDeploymentUrl(null);
        setIsAutonomousMode(false);
        
        storageService.clearState();
        
        addLog('Nuevo proyecto iniciado.', LogType.Info);
        setMessageBox({ text: 'Se ha iniciado un nuevo proyecto.', type: 'success' });
    }, [addLog]);
    
    const handleViewTimeLapse = (sprint: Sprint) => {
        setViewingTimeLapseSprint(sprint);
    };

    const renderActiveView = () => {
        switch (activeView) {
            case 'planning':
                return (
                    <div className="flex flex-col h-full">
                        <header className="flex-shrink-0 p-4 border-b bg-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Panel de Planificación</h2>
                                <p className="text-sm text-gray-500">Define tu proyecto con el Arquitecto IA.</p>
                            </div>
                            <button
                                onClick={() => setIsGenerateConfirmOpen(true)}
                                disabled={chatMessages.length === 0 || isLoading}
                                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Generar Proyecto
                            </button>
                        </header>
                        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
                           {chatMessages.length > 0 && <div className="mb-4"><PhaseIndicator currentPhase={phase} /></div>}
                           <div className="flex-grow overflow-y-auto mb-4">
                                <PlanningChat messages={chatMessages} onExampleClick={setPlanningInput} />
                            </div>
                            <ChatInput
                                value={planningInput}
                                onChange={setPlanningInput}
                                onSend={handleSendMessage}
                                placeholder={chatMessages.length === 0 ? "Describe tu idea de proyecto para empezar..." : "Refina tu idea o haz preguntas..."}
                            />
                        </div>
                    </div>
                );
            case 'collaboration':
                return <AgentCollaborationRoom messages={projectManagementState.collaborationMessages} onSendMessage={() => {}} teams={projectManagementState.teams} />;
            case 'ide':
                 const canResumeSprints = projectManagementState.teams.some(t => t.activeSprint && t.activeSprint.workItems.some(wi => wi.status !== 'done'));
                return (
                    <div className="h-full flex flex-col overflow-hidden bg-slate-50">
                        <IDEHeader
                            onDeploy={() => {
                                setDeploymentStatus('idle');
                                setDeploymentLogs([]);
                                setDeploymentUrl(null);
                                setIsDeploymentModalOpen(true);
                            }}
                            onRefactor={handleRefactorProject}
                            onGenerateReadme={handleGenerateReadme}
                            onDownloadZip={handleDownloadZip}
                            onDownloadWithDocker={handleDownloadWithDocker}
                            isAutonomousMode={isAutonomousMode}
                            onToggleAutonomousMode={() => setIsAutonomousMode(prev => !prev)}
                            canResumeSprints={canResumeSprints}
                            onResumeSprints={handleResumeSprints}
                            onAnalyzeFileNames={handleAnalyzeFileNames}
                        />
                        <div className="flex-grow p-4 min-h-0">
                            <OutputDisplay fileTree={fileTree} selectedFile={selectedFile} onFileSelect={setSelectedFile} onSaveFile={handleSaveFile} />
                        </div>
                    </div>
                );
            case 'monitoring':
                return <ProjectMonitor projectState={projectManagementState} onUpdate={setProjectManagementState} onStartSprintPlanning={handleStartSprintPlanning} onCompleteSprint={handleCompleteSprint} onViewTimeLapse={handleViewTimeLapse} />;
            case 'console':
                return <div className="h-full p-4"><LogWidget logs={logs} /></div>;
            case 'docs':
                return <div className="h-full p-4 overflow-y-auto"><Documentation /></div>;
            case 'knowledge':
                return <div className="h-full"><KnowledgeMonitor /></div>;
            case 'statistics':
                 return <StatisticsView projectState={projectManagementState} />;
             case 'experience':
                return <StatsAndAchievementsView stats={projectManagementState.stats} achievements={projectManagementState.achievements} />;
            default:
                return <div className="p-4">Select a view from the sidebar.</div>;
        }
    };
    
    const { globalLevel, totalXp, xpInCurrentLevel, xpForNextLevel } = useMemo(() => {
        const stats = projectManagementState.stats || {};
        // FIX: The value `s` from `Object.values` is of type `unknown`. Cast it to `AgentStats` to safely access the `xp` property and resolve the arithmetic errors.
        const totalXp: number = Object.values(stats).reduce<number>((acc, s) => acc + ((s as AgentStats)?.xp || 0), 0);
        const xpPerLevel = 100;
        const globalLevel = Math.floor(totalXp / xpPerLevel) + 1;
        const xpForCurrentLevel = (globalLevel - 1) * xpPerLevel;
        const xpInCurrentLevel = totalXp - xpForCurrentLevel;
        const xpForNextLevel = xpPerLevel;
        return { globalLevel, totalXp, xpInCurrentLevel, xpForNextLevel };
    }, [projectManagementState.stats]);

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            {messageBox && <MessageBox text={messageBox.text} type={messageBox.type} />}
             <ApiErrorModal
                isOpen={isApiErrorModalOpen}
                onClose={() => setIsApiErrorModalOpen(false)}
                errorMessage={apiErrorMessage}
            />

            <ConfirmationModal
                isOpen={isNewProjectConfirmOpen}
                onCancel={() => setIsNewProjectConfirmOpen(false)}
                onConfirm={() => {
                    setIsNewProjectConfirmOpen(false);
                    resetState();
                }}
                title="Iniciar Nuevo Proyecto"
                confirmButtonText="Sí, empezar de nuevo"
                confirmButtonColor="red"
            >
                ¿Estás seguro de que quieres empezar un nuevo proyecto? Todo el progreso actual no guardado se perderá.
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isGenerateConfirmOpen}
                onCancel={() => setIsGenerateConfirmOpen(false)}
                onConfirm={() => {
                    setIsGenerateConfirmOpen(false);
                    handleStartGeneration(chatMessages);
                }}
                title="Confirmar Generación del Proyecto"
                confirmButtonText="Generar"
                confirmButtonColor="blue"
            >
                ¿Estás seguro de que quieres finalizar la planificación y generar el proyecto? El plan se basará en el historial de chat actual.
            </ConfirmationModal>

            {sprintPlanningModal.isOpen && (
                <SprintPlanningModal
                    isOpen={sprintPlanningModal.isOpen}
                    onClose={() => setSprintPlanningModal({ isOpen: false, teamId: '', teamName: '' })}
                    productBacklog={projectManagementState.productBacklog}
                    onStartSprint={handleStartSprint}
                    isLoading={isLoading && !sprintOptions}
                    sprintOptions={sprintOptions}
                    teamId={sprintPlanningModal.teamId}
                    teamName={sprintPlanningModal.teamName}
                />
            )}

            {isPlanningSuggestionsModalOpen && (
                <PlanningSuggestionsModal
                    isOpen={isPlanningSuggestionsModalOpen}
                    suggestions={planningSuggestions}
                    isLoading={isLoading}
                    onAcceptAndStart={(selected) => {
                        const finalMessages: ChatMessage[] = [
                            ...chatMessages,
                            { author: 'agent', content: "Based on your idea, I've prepared these suggestions. You have accepted the following to form the project plan:"},
                            { author: 'user', content: selected.map(s => `**${s.title}**: ${s.description}`).join('\n') }
                        ];
                        setChatMessages(finalMessages);
                        setIsPlanningSuggestionsModalOpen(false);
                        handleStartGeneration(finalMessages);
                    }}
                    onAcceptAndSuggestMore={handleSuggestMore}
                />
            )}
            
            <DeploymentModal
                isOpen={isDeploymentModalOpen}
                onClose={() => setIsDeploymentModalOpen(false)}
                onDeployWebContainer={() => handleDeploy('webcontainer')}
                onDeployNetlify={() => handleDeploy('netlify')}
                status={deploymentStatus}
                logs={deploymentLogs}
                url={deploymentUrl}
            />
            
            <SuggestionsModal
                isOpen={isSuggestionsModalOpen}
                onClose={() => setIsSuggestionsModalOpen(false)}
                suggestions={suggestions}
                onApply={(acceptedTasks) => {
                    addLog(`El usuario ha revisado ${acceptedTasks.length} sugerencias de refactorización. (La aplicación automática no está implementada).`, LogType.Info);
                    setIsSuggestionsModalOpen(false);
                }}
            />
             {renameSuggestions && (
                <RenameSuggestionsModal
                    isOpen={!!renameSuggestions}
                    onClose={() => setRenameSuggestions(null)}
                    suggestions={renameSuggestions}
                    onConfirm={handleApplyRenames}
                />
            )}
            
            {viewingTimeLapseSprint && (
                <SprintTimeLapseModal
                    isOpen={!!viewingTimeLapseSprint}
                    onClose={() => setViewingTimeLapseSprint(null)}
                    sprint={viewingTimeLapseSprint}
                />
            )}

            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                phase={phase}
                onStartNewProject={() => setIsNewProjectConfirmOpen(true)}
                onSaveProject={handleSaveProjectState}
                onLoadProject={handleLoadProjectState}
                fileTree={fileTree}
                totalXp={totalXp}
                globalLevel={globalLevel}
                xpInCurrentLevel={xpInCurrentLevel}
                xpForNextLevel={xpForNextLevel}
                apiProvider={apiProvider}
                setApiProvider={setApiProvider}
                localApiEndpoint={localApiEndpoint}
                setLocalApiEndpoint={setLocalApiEndpoint}
                localModels={localModels}
                selectedLocalModel={selectedLocalModel}
                setSelectedLocalModel={setSelectedLocalModel}
                localModelStatus={localModelStatus}
                onLoadLocalModels={handleLoadLocalModels}
            />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;
