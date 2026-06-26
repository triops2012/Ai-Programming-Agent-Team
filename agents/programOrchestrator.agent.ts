import { CollaborationMessage, ProjectManagementState } from '../types.ts';
import { agentProfiles } from './agent.profiles.ts';

type GeminiAPICaller = (prompt: string, chatHistory: [], requestJson: boolean) => Promise<string>;

interface TeamStatus {
    teamName: string;
    status: {
        storyId: string | null;
        storyTitle: string;
        progressPercentage: number;
    }
}

export class ProgramOrchestratorAgent {
    private callGeminiAPI: GeminiAPICaller;

    constructor(callGeminiAPI: GeminiAPICaller) {
        this.callGeminiAPI = callGeminiAPI;
    }

    private getScrumOfScrumsPrompt(teamsStatus: TeamStatus[], projectState: ProjectManagementState): string {
        const profile = agentProfiles.ProgramOrchestrator;
        const statusString = teamsStatus.map(ts => 
            `- Equipo **${ts.teamName}**: Trabajando en HU ${ts.status.storyId || 'N/A'} ("${ts.status.storyTitle}") - Progreso: ${ts.status.progressPercentage}%.`
        ).join('\n');
        
        const allWorkItems = [
            ...projectState.productBacklog,
            ...projectState.teams.flatMap(t => t.activeSprint?.workItems || [])
        ];
        const dependencyMap = new Map<string, string[]>();
        allWorkItems.forEach(item => {
            if (item.dependencies && item.dependencies.length > 0) {
                dependencyMap.set(item.id, item.dependencies);
            }
        });

        const dependenciesString = Array.from(dependencyMap.entries()).map(([storyId, deps]) => 
            `- **${storyId}** depende de **[${deps.join(', ')}]**`
        ).join('\n');

        return `
            **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
            You are the ${profile.name}.
            - **Your Mission:** ${profile.mission}
            - **Your Style & Personality:** ${profile.personality}
            ---
            Your task is to direct the daily **Scrum of Scrums**. You must analyze the progress and dependency data to generate a concise, high-level summary for the entire project.

            **Estado Actual de los Equipos:**
            ---
            ${statusString}
            ---

            **Mapa de Dependencias del Proyecto:**
            ---
            ${dependenciesString || "No hay dependencias explícitas definidas."}
            ---

            **Your Task:**
            1.  **Analyze Progress & Blockers:** Review the team statuses and cross-reference them with the dependency map. A critical blocker exists if a team is working on a story that depends on an incomplete story from another team.
            2.  **Generate a Summary:** Draft a concise report for the general collaboration channel, strictly following your personality. Your report must:
                -   Start with a clear header "--- INFORME DEL SCRUM OF SCRUMS ---".
                -   Summarize each team's progress.
                -   **If a blocker is identified**, add a "🚨 ALERTA DE BLOQUEO" section and clearly explain the issue and which teams are involved.
                -   Conclude with a forward-looking or directive statement.

            **REQUISITOS DE SALIDA ESTRICTOS:**
            *   The output MUST BE EXCLUSIVELY a string with your report.
            *   DO NOT include any explanations or JSON.
            *   Your response must be direct and ready to post.

            Now, generate your Scrum of Scrums report.
        `;
    }

    public async runScrumOfScrums(teamsStatus: TeamStatus[], projectState: ProjectManagementState): Promise<CollaborationMessage> {
        const prompt = this.getScrumOfScrumsPrompt(teamsStatus, projectState);
        const summaryContent = await this.callGeminiAPI(prompt, [], false);

        return {
            agent: 'ProgramOrchestrator',
            content: summaryContent,
            type: 'system',
            timestamp: new Date().toISOString(),
        };
    }
}