// FIX: Import AppState from the central types file.
import { AppState, AppPhase, ChatMessage, FileNode, LogEntry, Suggestion, ProjectManagementState, WorkItem, KanbanCard, Sprint, Team, Transaction, ApiContract, AgentStats, Achievement, ApiUsageLog } from '../types.ts';

// FIX: Removed local AppState definition as it is now imported from types.ts.

const STORAGE_KEY = 'ai-programming-agent-session';

// Deep-clones FileNode objects to remove any extraneous properties (like React fibers)
// that could cause circular reference errors during JSON serialization.
const cleanFileTree = (nodes: FileNode[]): FileNode[] => {
    return nodes.map(node => ({
        name: node.name,
        type: node.type,
        ...(node.content !== undefined && { content: node.content }),
        ...(node.path && { path: node.path }),
        ...(node.children && { children: cleanFileTree(node.children) })
    }));
};

// --- START: Robust State Cleaning ---
// These functions manually reconstruct state objects to strip any properties
// added by React's internals, which can cause circular reference errors on serialization.

const cleanWorkItem = (item: WorkItem): WorkItem => ({
    id: item.id,
    title: item.title,
    description: item.description,
    acceptanceCriteria: item.acceptanceCriteria.map(ac => ({ text: ac.text, completed: ac.completed })),
    storyPoints: item.storyPoints,
    epicId: item.epicId,
    primaryTeamId: item.primaryTeamId,
    collaboratorTeamIds: item.collaboratorTeamIds ? [...item.collaboratorTeamIds] : undefined,
    dependencies: item.dependencies ? [...item.dependencies] : undefined,
});

const cleanKanbanCard = (card: KanbanCard): KanbanCard => ({
    ...cleanWorkItem(card),
    status: card.status,
    reviewAttempts: card.reviewAttempts,
    createdAt: card.createdAt,
    inProgressAt: card.inProgressAt,
    completedAt: card.completedAt,
    leadTimeSeconds: card.leadTimeSeconds,
    cycleTimeSeconds: card.cycleTimeSeconds,
});

const cleanTransaction = (transaction: Transaction): Transaction => ({
    id: transaction.id,
    timestamp: transaction.timestamp,
    type: transaction.type,
    status: transaction.status,
    agent: transaction.agent,
    details: transaction.details,
    storyId: transaction.storyId,
    kanbanState: transaction.kanbanState ? transaction.kanbanState.map(cleanKanbanCard) : undefined,
});


const cleanSprint = (sprint: Sprint): Sprint => ({
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    goal: sprint.goal,
    totalStoryPoints: sprint.totalStoryPoints,
    completedStoryPoints: sprint.completedStoryPoints,
    workItems: sprint.workItems.map(cleanKanbanCard),
    transactionLog: sprint.transactionLog ? sprint.transactionLog.map(cleanTransaction) : undefined,
    retrospectiveSummary: sprint.retrospectiveSummary,
});

const cleanProjectManagementState = (pmState?: ProjectManagementState): ProjectManagementState | undefined => {
    if (!pmState) return undefined;
    try {
        // Fix: The state shape was outdated. It should clean the 'teams' array,
        // which contains 'activeSprint' and 'completedSprints', instead of looking for them on the root state object.
        return {
            productBacklog: pmState.productBacklog.map(cleanWorkItem),
            epics: pmState.epics.map(epic => ({ id: epic.id, title: epic.title, description: epic.description })),
            teams: (pmState.teams || []).map((team: Team) => ({
                id: team.id,
                name: team.name,
                activeSprint: team.activeSprint ? cleanSprint(team.activeSprint) : null,
                completedSprints: (team.completedSprints || []).map(cleanSprint)
            })),
            definitionOfDone: [...pmState.definitionOfDone],
            collaborationMessages: pmState.collaborationMessages.map(msg => ({ ...msg })),
            contracts: (pmState.contracts || []).map((contract: ApiContract) => ({...contract})),
            stats: pmState.stats ? { ...pmState.stats } : undefined,
            achievements: pmState.achievements ? [...pmState.achievements] : undefined,
            apiUsageLogs: pmState.apiUsageLogs ? pmState.apiUsageLogs.map((log: ApiUsageLog) => ({ ...log })) : undefined,
        };
    } catch (error) {
        console.error("Failed to clean project management state. Some data might not be persisted correctly.", error);
        // Return a partially cleaned or empty state to avoid crashing the app.
        return {
             ...initialProjectManagementState // Assuming initial state is available or imported
             // Or just return undefined if better
        };
    }
};

// Fix: The state shape was outdated. It should have a 'teams' array instead of 'activeSprint' and 'completedSprints'.
const initialProjectManagementState: ProjectManagementState = {
    productBacklog: [], epics: [], teams: [], definitionOfDone: [], collaborationMessages: [], contracts: [], stats: {}, achievements: [], apiUsageLogs: []
};


export const cleanStateForSerialization = (state: AppState): AppState => {
    return {
        ...state,
        fileTree: state.fileTree ? cleanFileTree(state.fileTree) : [],
        selectedFile: state.selectedFile ? cleanFileTree([state.selectedFile])[0] : null,
        suggestions: state.suggestions ? state.suggestions.map(s => ({ id: s.id, text: s.text, accepted: s.accepted })) : undefined,
        projectManagementState: cleanProjectManagementState(state.projectManagementState)
        // chatMessages and logs are generally safe, but we could clean them too if needed.
    };
};
// --- END: Robust State Cleaning ---


export const saveState = (state: AppState): void => {
    try {
        const cleanState = cleanStateForSerialization(state);
        const serializedState = JSON.stringify(cleanState);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error) {
        console.error("Could not save state to localStorage", error);
    }
};

export const loadState = (): AppState | undefined => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        const parsedState = JSON.parse(serializedState);
        
        // Re-hydrate date objects after parsing from JSON
        if (parsedState.logs) {
            parsedState.logs = parsedState.logs.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp),
            }));
        }

        return parsedState as AppState;
    } catch (error) {
        console.error("Could not load state from localStorage", error);
        return undefined;
    }
};

export const clearState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    // Fix: The catch block was missing braces, causing a syntax error. This has been corrected.
    } catch (error) {
        console.error("Could not clear state from localStorage", error);
    }
};