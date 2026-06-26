export type AppPhase = 'planning' | 'generating' | 'collaboration' | 'reviewing' | 'suggesting';

export type View = 'planning' | 'collaboration' | 'ide' | 'monitoring' | 'console' | 'docs' | 'knowledge' | 'statistics' | 'experience';

export type ApiProvider = 'gemini' | 'local';

export enum LogType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Delegation = 'delegation'
}

export interface LogEntry {
  message: string;
  type: LogType;
  timestamp: Date;
}

export interface ChatEntry {
    prompt: string;
    response: string;
}

export interface ChatMessage {
    author: 'user' | 'agent';
    content: string;
}

export interface Message {
    text: string;
    type: 'success' | 'error';
}

export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    children?: FileNode[];
    path?: string;
}

export interface Suggestion {
    id: string;
    text: string;
    accepted: boolean;
}

export interface RenameSuggestion {
    from: string;
    to: string;
}

export interface PlanningSuggestion {
    id: string;
    title: string;
    description: string;
    selected: boolean;
}

export interface VectorStoreEntry {
    id: number;
    text: string;
    embedding: number[];
}

// =================================================================
// DEPLOYMENT TYPES
// =================================================================

export type DeploymentStatus = 'idle' | 'deploying' | 'success' | 'error';

// =================================================================
// AGENT COLLABORATION TYPES
// =================================================================

export type AgentName = 
    'Orchestrator' | 
    'ProgramOrchestrator' |
    'Architect' |
    'ProjectManager' |
    'ProductOwner' |
    'ScrumMaster' |
    'TechLead' |
    'UIUXAgent' |
    'ReactAgent' |
    'VueAgent' |
    'AngularAgent' |
    'CSSAgent' |
    'NodeAPIAgent' |
    'GoAPIAgent' |
    'PythonAPIAgent' |
    'JavaAPIAgent' |
    'KotlinAPIAgent' |
    'RubyAPIAgent' |
    'PHPAgent' |
    'CSharpAPIAgent' |
    'SwiftAPIAgent' |
    'DelphiAgent' |
    'PascalAgent' |
    'CAgent' |
    'SQLDatabaseAgent' |
    'NoSQLDatabaseAgent' |
    'DataStructureAgent' |
    'SupabaseAgent' |
    'FirestoreAgent' |
    'TestingAgent' |
    'SecurityAgent' |
    'QualityAgent' |
    'IntegrationAgent' |
    'DockerAgent' |
    'GoogleCloudAgent' |
    'GoogleScriptsAgent' |
    'CICDAgent' |
    'LearningAgent' |
    'User';

export interface AgentProfile {
    name: AgentName;
    motto: string;
    mission: string;
    personality: string;
    capabilities: string[];
    interaction: {
        input: string;
        output: string;
    };
    specializations: string;
}

export interface CollaborationMessage {
    agent: AgentName;
    content: string;
    type: 'system' | 'message' | 'code' | 'pr-open' | 'pr-review' | 'pr-approved' | 'pr-merged';
    timestamp: string;
    storyId?: string;
    teamId?: string;
}


// =================================================================
// AGILE PROJECT MANAGEMENT TYPES
// =================================================================

export interface AcceptanceCriterion {
    text: string;
    completed: boolean;
}

// Base interface for any work item (User Story, Task, Bug)
export interface WorkItem {
    id: string;
    title: string;
    description: string; // "As a [user], I want [action] so that [benefit]"
    acceptanceCriteria: AcceptanceCriterion[];
    storyPoints: number | null;
    epicId?: string;
    primaryTeamId?: string; // The main team responsible for the item.
    collaboratorTeamIds?: string[]; // Other teams involved in the item.
    dependencies?: string[];
}

// A work item when it's in the Product Backlog
export interface ProductBacklogItem extends WorkItem {}

// A work item when it's on the Kanban board (part of an active sprint)
export interface KanbanCard extends WorkItem {
    status: KanbanCardStatus;
    reviewAttempts?: number;
    createdAt?: string; // ISO string when item is added to sprint
    inProgressAt?: string; // ISO string when item status changes to inProgress
    completedAt?: string; // ISO string when item status changes to done
    leadTimeSeconds?: number; // completedAt - createdAt
    cycleTimeSeconds?: number; // completedAt - inProgressAt
}

export type KanbanCardStatus = 'backlog' | 'inProgress' | 'inReview' | 'rework' | 'inPipeline' | 'done';

export interface Epic {
    id: string;
    title: string;
    description: string;
}

export type TransactionType = 'TASK_START' | 'CODE_GENERATED' | 'REVIEW_PASSED' | 'TASK_COMPLETED' | 'AGENT_MESSAGE';
export type TransactionStatus = 'SUCCESS' | 'FAILURE';

export interface Transaction {
    id: string;
    timestamp: string;
    type: TransactionType;
    status: TransactionStatus;
    agent: AgentName;
    details: string;
    storyId: string;
    kanbanState?: KanbanCard[];
}

export interface Sprint {
    id: string;
    name: string;
    startDate: string; // ISO string
    endDate: string;   // ISO string
    goal: string;
    totalStoryPoints: number;
    completedStoryPoints: number;
    workItems: KanbanCard[];
    transactionLog?: Transaction[];
    retrospectiveSummary?: string;
}

export interface Team {
    id: string;
    name: string;
    activeSprint: Sprint | null;
    completedSprints: Sprint[];
}

export interface SprintOption {
    title: string;
    description: string;
    storyIds: string[];
    totalStoryPoints: number;
}

export interface SprintPlanningModalProps {
    isOpen: boolean;
    onClose: () => void;
    productBacklog: ProductBacklogItem[];
    onStartSprint: (sprintItems: ProductBacklogItem[], teamId: string, sprintGoal: string) => void;
    isLoading: boolean;
    sprintOptions: SprintOption[] | null;
    teamId: string;
    teamName: string;
}

export interface ApiContract {
    id: string;
    status: 'proposed' | 'accepted' | 'deprecated';
    providerTeamId: string;
    consumerTeamId: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
    requestSchema: object;
    responseSchema: object;
}

export interface ApiUsageLog {
    id: string;
    timestamp: string;
    agentName: AgentName;
    sprintId?: string;
    storyId?: string;
    inputTokens: number;
    outputTokens: number;
    status: 'success' | 'failure';
    latencyMs: number;
}

export type ApiCallContext = {
    agentName: AgentName;
    sprintId?: string;
    storyId?: string;
};


// =================================================================
// GAMIFICATION TYPES
// =================================================================
export type XpGainEvent = 'taskCompleted' | 'issueFound' | 'learnedFromMistake' | 'lessonLearned';

export interface AgentStats {
    xp: number;
    level: number;
    tasksCompleted: number;
    issuesFound: number;
    successfulCorrections: number;
    lessonsLearned: number;
    achievements: Achievement[];
}

export type AchievementId = 'FIRST_IMPECCABLE_SUBMISSION' | 'SERIAL_SHIPPER' | 'BUG_HUNTER' | 'QUALITY_ADVOCATE' | 'SECURITY_GUARDIAN' | 'LEARNING_FROM_MISTAKES';

// FIX: The Achievement interface was incorrect, causing type errors across multiple files.
// It has been updated to reflect the actual shape of achievement objects used in the application.
export interface Achievement {
    id: AchievementId;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
    agent: AgentName;
}

export const achievementData: Record<AchievementId, { name: string; description: string; icon: string; }> = {
    FIRST_IMPECCABLE_SUBMISSION: {
        name: 'Entrega Impecable',
        description: 'Completa una tarea en el primer intento sin necesidad de rework.',
        icon: '🎯'
    },
    SERIAL_SHIPPER: {
        name: 'Proveedor en Serie',
        description: 'Completa 5 tareas de desarrollo con éxito.',
        icon: '🚀'
    },
    BUG_HUNTER: {
        name: 'Cazador de Bugs',
        description: 'Identifica 5 problemas durante las revisiones de código.',
        icon: '🐞'
    },
    QUALITY_ADVOCATE: {
        name: 'Defensor de la Calidad',
        description: 'Como QualityAgent, encuentra 5 problemas de calidad.',
        icon: '✨'
    },
    SECURITY_GUARDIAN: {
        name: 'Guardián de la Seguridad',
        description: 'Como SecurityAgent, identifica 5 vulnerabilidades potenciales.',
        icon: '🛡️'
    },
    LEARNING_FROM_MISTAKES: {
        name: 'Aprendizaje Acelerado',
        description: 'Aplica con éxito una corrección en el primer intento después de recibir feedback.',
        icon: '🧠'
    }
};


export interface ProjectManagementState {
    productBacklog: ProductBacklogItem[];
    epics: Epic[];
    teams: Team[];
    definitionOfDone: string[];
    collaborationMessages: CollaborationMessage[];
    contracts?: ApiContract[];
    stats?: Partial<Record<AgentName, AgentStats>>;
    achievements?: Achievement[]; // Note: This is now a global log for display, the source of truth is in stats.
    apiUsageLogs?: ApiUsageLog[];
}

export interface AppState {
    phase: AppPhase;
    chatMessages: ChatMessage[];
    fileTree: FileNode[];
    selectedFile: FileNode | null;
    logs: LogEntry[];
    suggestions?: Suggestion[];
    projectManagementState?: ProjectManagementState;
}
