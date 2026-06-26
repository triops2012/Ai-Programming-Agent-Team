import { AgentName, AgentStats, ProjectManagementState, Achievement, AchievementId, achievementData } from '../types.ts';

// Helper function to check if an achievement is already unlocked
const isUnlocked = (id: AchievementId, projectState: ProjectManagementState): boolean => {
    return projectState.achievements?.some(ach => ach.id === id) || false;
};

// --- Individual Achievement Checkers ---

const checkFirstImpeccableSubmission = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake',
    attempts?: number
): Achievement | null => {
    const id: AchievementId = 'FIRST_IMPECCABLE_SUBMISSION';
    if (isUnlocked(id, projectState)) return null;

    if (event === 'taskCompleted' && attempts === 1 && agentStats.tasksCompleted === 1) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};

const checkSerialShipper = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake'
): Achievement | null => {
    const id: AchievementId = 'SERIAL_SHIPPER';
    if (isUnlocked(id, projectState)) return null;

    const devAgents: AgentName[] = ['ReactAgent', 'NodeAPIAgent', 'CSSAgent', 'SQLDatabaseAgent', 'PythonAPIAgent', 'VueAgent', 'AngularAgent'];
    if (event === 'taskCompleted' && devAgents.includes(agentName) && agentStats.tasksCompleted === 5) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};

const checkBugHunter = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake'
): Achievement | null => {
    const id: AchievementId = 'BUG_HUNTER';
    if (isUnlocked(id, projectState)) return null;
    
    const reviewerAgents: AgentName[] = ['QualityAgent', 'SecurityAgent', 'IntegrationAgent'];
    if (event === 'issueFound' && reviewerAgents.includes(agentName) && agentStats.issuesFound === 5) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};

const checkQualityAdvocate = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake'
): Achievement | null => {
    const id: AchievementId = 'QUALITY_ADVOCATE';
    if (isUnlocked(id, projectState)) return null;

    if (event === 'issueFound' && agentName === 'QualityAgent' && agentStats.issuesFound === 5) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};

const checkSecurityGuardian = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake'
): Achievement | null => {
    const id: AchievementId = 'SECURITY_GUARDIAN';
    if (isUnlocked(id, projectState)) return null;

    if (event === 'issueFound' && agentName === 'SecurityAgent' && agentStats.issuesFound === 5) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};

const checkLearningFromMistakes = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake'
): Achievement | null => {
    const id: AchievementId = 'LEARNING_FROM_MISTAKES';
    if (isUnlocked(id, projectState)) return null;

    // This achievement is awarded the first time an agent successfully corrects a task
    if (event === 'learnedFromMistake' && agentStats.successfulCorrections === 1) {
        return {
            ...achievementData[id],
            id,
            unlockedAt: new Date().toISOString(),
            agent: agentName,
        };
    }
    return null;
};


// --- Main Service Function ---

type AchievementChecker = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake',
    attempts?: number
) => Achievement | null;

const checkers: AchievementChecker[] = [
    checkFirstImpeccableSubmission,
    checkSerialShipper,
    checkBugHunter,
    checkQualityAdvocate,
    checkSecurityGuardian,
    checkLearningFromMistakes,
];

export const checkAndUnlockAchievements = (
    agentName: AgentName,
    agentStats: AgentStats,
    projectState: ProjectManagementState,
    event: 'taskCompleted' | 'issueFound' | 'learnedFromMistake',
    attempts?: number
): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];

    for (const check of checkers) {
        const achievement = check(agentName, agentStats, projectState, event, attempts);
        if (achievement) {
            newlyUnlocked.push(achievement);
        }
    }

    return newlyUnlocked;
};