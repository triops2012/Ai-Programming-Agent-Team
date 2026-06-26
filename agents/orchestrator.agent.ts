import { ChatMessage, FileNode, CollaborationMessage, KanbanCard, AgentName, Transaction, ApiContract, Team, KanbanCardStatus, ProjectManagementState, ApiCallContext, XpGainEvent } from '../types.ts';
import { GenerateContentResponse } from '@google/genai';
import { TeamAgents, LearningAgent, ScrumMasterAgent, ProjectManagementAgent } from './index.ts';
import { embedContent } from '../services/geminiService.ts';
import * as vectorDbService from '../services/vectorDbService.ts';
import { agentProfiles } from './agent.profiles.ts';

type GeminiAPICaller = (prompt: string, options: { requestJson: boolean }, context: ApiCallContext) => Promise<GenerateContentResponse | null>;

interface SubTask {
    id: string;
    task: string;
    filePath: string;
    agent: AgentName;
    dependencies: string[];
    explanation: string;
}

interface DecompositionPlan {
    subTasks: SubTask[];
    proposedContracts?: Omit<ApiContract, 'id' | 'status'>[];
}


const SIMILARITY_THRESHOLD = 0.75;
const MAX_CORRECTION_ATTEMPTS = 3; // 1 initial attempt + 2 correction retries
const MAX_OLE_VERSIONS = 10;

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class OrchestratorAgent {
    private projectPlan: ChatMessage[];
    private fileTree: FileNode[];
    private projectManagementState: ProjectManagementState;
    private updateCollaborationUI: (message: CollaborationMessage) => void;
    private updateFileTreeUI: (fileTree: FileNode[]) => void;
    private finishCallback: (finalFileTree: FileNode[]) => void;
    private callGeminiAPI: GeminiAPICaller;
    private onTaskComplete: (taskId: string) => void;
    private logTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
    private onContractsChange: (newContracts: Omit<ApiContract, 'id'>[]) => void;
    private onTaskStartProgress: (taskId: string) => void;
    private onTaskStatusChange: (taskId: string | null, status: KanbanCardStatus) => void;
    private onAgentXpGain: (agent: AgentName, xp: number, event: XpGainEvent, attempts?: number) => void;

    private taskQueue: KanbanCard[] = [];
    private userInputQueue: string[] = [];
    private currentStoryId: string | null = null;
    private sprintBacklog: KanbanCard[];
    private subTaskPlan: SubTask[] = [];
    private completedSubTaskIds = new Set<string>();
    private sprintId: string;
    
    // Status for Scrum of Scrums
    private isRunningDailyScrum = false;


    constructor(
        projectPlan: ChatMessage[],
        initialFileTree: FileNode[],
        sprintBacklog: KanbanCard[],
        sprintId: string,
        updateCollaborationUI: (message: CollaborationMessage) => void,
        updateFileTreeUI: (fileTree: FileNode[]) => void,
        finishCallback: (finalFileTree: FileNode[]) => void,
        callGeminiAPI: GeminiAPICaller,
        onTaskComplete: (taskId: string) => void,
        logTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void,
        onContractsChange: (newContracts: Omit<ApiContract, 'id'>[]) => void,
        projectManagementState: ProjectManagementState,
        onTaskStartProgress: (taskId: string) => void,
        onTaskStatusChange: (taskId: string | null, status: KanbanCardStatus) => void,
        onAgentXpGain: (agent: AgentName, xp: number, event: XpGainEvent, attempts?: number) => void
    ) {
        this.projectPlan = projectPlan;
        this.fileTree = initialFileTree;
        this.sprintBacklog = sprintBacklog;
        this.sprintId = sprintId;
        this.taskQueue = sprintBacklog.filter(item => item.status !== 'done');
        this.updateCollaborationUI = updateCollaborationUI;
        this.updateFileTreeUI = updateFileTreeUI;
        this.finishCallback = finishCallback;
        this.callGeminiAPI = callGeminiAPI;
        this.onTaskComplete = onTaskComplete;
        this.logTransaction = logTransaction;
        this.onContractsChange = onContractsChange;
        this.projectManagementState = projectManagementState;
        this.onTaskStartProgress = onTaskStartProgress;
        this.onTaskStatusChange = onTaskStatusChange;
        this.onAgentXpGain = onAgentXpGain;
    }
    
    public async getStatus(): Promise<{ storyId: string | null; storyTitle: string; progressPercentage: number; subTasksCompleted: number; subTasksTotal: number; }> {
        const story = this.sprintBacklog.find(s => s.id === this.currentStoryId);
        const totalTasks = this.subTaskPlan.length;
        const completedTasks = this.completedSubTaskIds.size;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            storyId: this.currentStoryId,
            storyTitle: story?.title || 'N/A',
            progressPercentage: progress,
            subTasksCompleted: completedTasks,
            subTasksTotal: totalTasks
        };
    }

    private postMessage(agent: CollaborationMessage['agent'], content: string, type: CollaborationMessage['type'] = 'message') {
        this.updateCollaborationUI({ 
            agent, 
            content, 
            type, 
            timestamp: new Date().toISOString(),
            storyId: this.currentStoryId ?? undefined
        });
         if (this.currentStoryId && agent !== 'Orchestrator' && agent !== 'User') {
            this.logTransaction({
                type: 'AGENT_MESSAGE',
                status: 'SUCCESS',
                agent: agent,
                details: content.substring(0, 150),
                storyId: this.currentStoryId
            });
        }
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private updateFile(path: string, newContent: string) {
        // FIX: Add defensive coding to prevent invalid file paths like "." or ".."
        const fileName = path.split('/').pop();
        if (!fileName || fileName === '.' || fileName === '..') {
            this.postMessage('Orchestrator', `⚠️ Advertencia: Se ha intentado crear un archivo con un nombre inválido ("${path}"). La tarea se ha omitido.`, 'system');
            return;
        }

        const parts = path.split('/').filter(p => p);
        let currentChildren = this.fileTree;
        let currentPathParts: string[] = [];
    
        // Traverse/create folders to find the correct directory
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            currentPathParts.push(part);
            const currentPath = currentPathParts.join('/');
            let folder = currentChildren.find(node => node.name === part && node.type === 'folder');
            if (!folder) {
                folder = { name: part, type: 'folder', children: [], path: currentPath };
                currentChildren.push(folder);
            }
            currentChildren = folder.children!;
        }
    
        const finalFileName = parts[parts.length - 1];
        const fileIndex = currentChildren.findIndex(node => node.name === finalFileName && node.type === 'file');
        const filePath = parts.slice(0, -1).join('/');
    
        if (fileIndex !== -1) {
            // --- File exists, apply versioning logic ---
            const existingFile = currentChildren[fileIndex];
            const oldContent = existingFile.content;
    
            // 1. Get base name and extension
            const extMatch = finalFileName.match(/\.([^.]+)$/);
            const ext = extMatch ? extMatch[0] : '';
            const baseName = ext ? finalFileName.substring(0, finalFileName.length - ext.length) : finalFileName;
    
            // 2. Find existing ole versions and their numbers
            const oleRegex = new RegExp(`^${escapeRegex(baseName)}\\.ole_(\\d+)${escapeRegex(ext)}$`);
            const oleVersions = currentChildren
                .map(node => {
                    const match = node.name.match(oleRegex);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter((n): n is number => n !== null)
                .sort((a, b) => a - b);
    
            // 3. Create new backup file
            const newOleNumber = oleVersions.length > 0 ? Math.max(...oleVersions) + 1 : 1;
            const backupFileName = `${baseName}.ole_${newOleNumber}${ext}`;
            currentChildren.push({ name: backupFileName, type: 'file', content: oldContent, path: filePath });
    
            // 4. If count > MAX_OLE_VERSIONS, remove the oldest
            if (oleVersions.length + 1 > MAX_OLE_VERSIONS) {
                const oldestOleNumber = oleVersions[0];
                const oldestFileName = `${baseName}.ole_${oldestOleNumber}${ext}`;
                const oldestFileIndex = currentChildren.findIndex(node => node.name === oldestFileName);
                if (oldestFileIndex !== -1) {
                    currentChildren.splice(oldestFileIndex, 1);
                }
            }
    
            // 5. Update the original file with new content
            existingFile.content = newContent;
        } else {
            // File does not exist, just create it
            currentChildren.push({ name: finalFileName, type: 'file', content: newContent, path: filePath });
        }
        
        this.updateFileTreeUI(this.fileTree);
    }

    public handleUserInput(input: string) {
        this.userInputQueue.push(input);
    }

    private getSpecialistAgent(agentName: AgentName) {
        const agentKey = Object.keys(TeamAgents).find(key => key.toLowerCase() === `${agentName.toLowerCase()}`);
        if (agentKey) {
            return (TeamAgents as any)[agentKey];
        }
        // Fallback for names that might not perfectly match
        if (agentName.includes('React')) return TeamAgents.ReactAgent;
        if (agentName.includes('Node')) return TeamAgents.NodeAPIAgent;
        if (agentName.includes('CSS')) return TeamAgents.CSSAgent;
        if (agentName.includes('SQL')) return TeamAgents.SQLDatabaseAgent;
        return TeamAgents.ReactAgent; // Default fallback
    }

    private async runReviewCycle(authorAgent: AgentName, filesForReview: { filePath: string, code: string }[], subTask: SubTask): Promise<{ approved: boolean; feedback?: string }> {
        if (!this.currentStoryId) return { approved: false, feedback: "No hay historia activa" };
        this.onTaskStatusChange(this.currentStoryId, 'inReview');

        const reviewers: AgentName[] = ['QualityAgent', 'SecurityAgent', 'IntegrationAgent'];
        this.postMessage('Orchestrator', `Comité de Revisión convocado para ${filesForReview.map(f => `\`${f.filePath}\``).join(', ')}. Participan: @${reviewers.join(', @')}.`, 'system');
        await this.sleep(2000);

        let allFeedbacks: string[] = [];
        
        const reviewPromises = reviewers.map(async (reviewerName) => {
            const reviewerProfile = agentProfiles[reviewerName];
            const allCodeForReview = filesForReview.map(f => `--- CÓDIGO PARA ${f.filePath} ---\n${f.code}`).join('\n\n');
            let reviewPrompt: string;

            if (reviewerName === 'IntegrationAgent') {
                reviewPrompt = TeamAgents.IntegrationAgent.getReviewPrompt(allCodeForReview, filesForReview[0].filePath, this.projectManagementState.contracts || []);
            } else {
                 reviewPrompt = `
                    **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
                    You are the ${reviewerProfile.name}.
                    - **Your Mission:** ${reviewerProfile.mission}
                    - **Your Style & Personality:** ${reviewerProfile.personality}
                    ---
                    You are part of a code review committee. Review the following code submission from @${authorAgent}.
                    Your response must be a single line of chat, strictly following your personality.
                    - If there are no issues from your perspective, respond ONLY with the word "Aprobado".
                    - If you find an issue, start your response with "**Cambio Solicitado:**" and concisely describe the problem and the required fix.

                    **Código a Revisar:**
                    ${allCodeForReview}
                `;
            }

            try {
                const reviewResponse = await this.callGeminiAPI(reviewPrompt, { requestJson: false }, { agentName: reviewerName, sprintId: this.sprintId, storyId: this.currentStoryId });
                if (reviewResponse) {
                    this.postMessage(reviewerName, reviewResponse.text, 'pr-review');
                    await this.sleep(1500);
                    if (reviewResponse.text.toLowerCase().startsWith('cambio solicitado:')) {
                        allFeedbacks.push(reviewResponse.text);
                        this.onAgentXpGain(reviewerName, 5, 'issueFound');
                    }
                }
            } catch (e) {
                const errorMsg = `El agente @${reviewerName} encontró un error durante la revisión.`;
                this.postMessage('Orchestrator', errorMsg, 'system');
                allFeedbacks.push(`Cambio Solicitado: ${errorMsg}`);
            }
        });

        await Promise.all(reviewPromises);
        
        const changesRequested = allFeedbacks.length > 0;
        
        if (changesRequested && this.currentStoryId) {
             this.onTaskStatusChange(this.currentStoryId, 'rework');
             this.postMessage('Orchestrator', `Se han solicitado cambios. Iniciando ciclo de aprendizaje...`, 'system');
             await this.sleep(1000);
             const errorDescription = allFeedbacks.join('\n');
             try {
                const learningPrompt = LearningAgent.getErrorLearningPrompt(authorAgent, filesForReview[0].code, errorDescription, "Aplicar las correcciones sugeridas.");
                const learningResponse = await this.callGeminiAPI(learningPrompt, { requestJson: true }, { agentName: 'LearningAgent', sprintId: this.sprintId, storyId: this.currentStoryId });
                if (learningResponse) {
                    const learningResponseJson = learningResponse.text;
                    const parsedLearning = JSON.parse(learningResponseJson.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || learningResponseJson);

                    const { lesson } = parsedLearning;
                    if (lesson && lesson.lesson && lesson.agent) {
                        this.postMessage('LearningAgent', `Lección extraída: "${lesson.lesson}". Almacenando en la base de conocimiento de @${lesson.agent}.`, 'message');
                        const embedding = await embedContent(lesson.lesson);
                        await vectorDbService.addDocument(lesson.lesson, embedding, lesson.agent as AgentName);
                        this.onAgentXpGain(lesson.agent as AgentName, 3, 'lessonLearned');
                        await this.sleep(2000);
                    }
                }
             } catch(e) { /* silent fail on learning */ }
        }

        return { approved: !changesRequested, feedback: changesRequested ? allFeedbacks.join('\n') : undefined };
    }
    
    private async runPipeline(subTask: SubTask): Promise<boolean> {
        if (!this.currentStoryId) return false;
        this.onTaskStatusChange(this.currentStoryId, 'inPipeline');
        this.postMessage('CICDAgent', `Pipeline iniciado para la historia \`${this.currentStoryId}\`. Ejecutando pruebas y validaciones...`, 'system');
        await this.sleep(3000); // Simulate pipeline run time
        // In a real scenario, this could fail. For now, we assume it always succeeds.
        this.postMessage('CICDAgent', `✅ Pipeline para \`${this.currentStoryId}\` completado con éxito.`, 'system');
        return true;
    }


    private async executeSubTask(subTask: SubTask): Promise<{ success: boolean; reason?: string }> {
        try {
            const specialistAgent = this.getSpecialistAgent(subTask.agent);
            if (!specialistAgent) {
                this.postMessage('Orchestrator', `No se encontró un agente especialista para ${subTask.agent}. Saltando la subtarea ${subTask.id}.`, 'system');
                return { success: false, reason: 'Agente no encontrado' };
            }
             if (!this.currentStoryId) return { success: false, reason: 'No current story context' };
            
            this.logTransaction({
                type: 'TASK_START',
                status: 'SUCCESS',
                agent: 'Orchestrator',
                details: `Iniciando subtarea ${subTask.id} (${subTask.task}) para la historia ${this.currentStoryId}`,
                storyId: this.currentStoryId
            });


            let attempts = 0;
            let isApproved = false;
            let feedbackForCorrection: string | undefined = undefined;

            while (attempts < MAX_CORRECTION_ATTEMPTS && !isApproved) {
                attempts++;
                
                this.onTaskStatusChange(this.currentStoryId, attempts > 1 ? 'rework' : 'inProgress');

                if (attempts > 1) {
                    this.postMessage('Orchestrator', `Intento de corrección ${attempts - 1}/${MAX_CORRECTION_ATTEMPTS - 1} para la tarea ${subTask.id}.`, 'system');
                    await this.sleep(1500);
                }

                let lessonsForSpecialist = '';
                try {
                    const queryVector = await embedContent(subTask.task);
                    const similarDoc = await vectorDbService.findMostSimilar(queryVector, subTask.agent);
                    if (similarDoc && similarDoc.similarity > SIMILARITY_THRESHOLD) {
                        lessonsForSpecialist = similarDoc.document.text;
                        this.postMessage('LearningAgent', `Contexto relevante encontrado para @${subTask.agent}: "${lessonsForSpecialist}"`, 'message');
                        await this.sleep(1500);
                    }
                } catch (e) { /* ignore */ }

                if (attempts === 1) {
                    this.postMessage(subTask.agent, `Entendido. Comenzando la tarea ${subTask.id}: "${subTask.task}". Trabajando en \`${subTask.filePath}\`.`, 'message');
                    await this.sleep(2000);
                }

                const codePrompt = specialistAgent.getPrompt(subTask.task, subTask.filePath, this.projectPlan, this.fileTree, lessonsForSpecialist, feedbackForCorrection);
                const codeResponse = await this.callGeminiAPI(codePrompt, { requestJson: false }, { agentName: subTask.agent, sprintId: this.sprintId, storyId: this.currentStoryId });
                if (!codeResponse) return { success: false, reason: "API call failed." };
                const generatedCode = codeResponse.text;
                
                 if (this.currentStoryId) {
                    this.logTransaction({
                        type: 'CODE_GENERATED',
                        status: 'SUCCESS',
                        agent: subTask.agent,
                        details: `Código generado para ${subTask.filePath}`,
                        storyId: this.currentStoryId
                    });
                }
                
                this.updateFile(subTask.filePath, generatedCode);
                this.postMessage(subTask.agent, `${attempts > 1 ? 'Versión corregida' : 'Implementación inicial'} de \`${subTask.filePath}\` lista. Abriendo PR para revisión.\n\`\`\`${subTask.filePath.split('.').pop()}\n${generatedCode.substring(0, 200)}...\n\`\`\``, 'code');
                await this.sleep(2000);

                const reviewResult = await this.runReviewCycle(subTask.agent, [{ filePath: subTask.filePath, code: generatedCode }], subTask);
                
                isApproved = reviewResult.approved;

                if (!isApproved) {
                    feedbackForCorrection = reviewResult.feedback;
                    this.postMessage('TechLead', `Cambios solicitados en \`${subTask.filePath}\`. PR para la tarea ${subTask.id} Rechazado.`, 'pr-review');
                    this.postMessage('Orchestrator', `@${subTask.agent}, por favor, corrige el problema basado en el feedback: "${feedbackForCorrection}"`, 'system');
                    await this.sleep(3000);
                }
            }

            if (isApproved) {
                this.postMessage('TechLead', `Revisión del PR para \`${subTask.filePath}\` (Tarea ${subTask.id}) Aprobada.`, 'pr-approved');
                
                const pipelineSuccess = await this.runPipeline(subTask);

                if (pipelineSuccess) {
                     if (this.currentStoryId) {
                        this.logTransaction({
                            type: 'REVIEW_PASSED',
                            status: 'SUCCESS',
                            agent: 'TechLead',
                            details: `Subtarea ${subTask.id} aprobada y pipeline exitoso.`,
                            storyId: this.currentStoryId
                        });
                    }
                    // Grant XP for successful completion
                    const xpForTask = 10;
                    const bonusXp = attempts === 1 ? 5 : 0; // Bonus for getting it right the first time
                    this.onAgentXpGain(subTask.agent, xpForTask + bonusXp, 'taskCompleted', attempts);
                    if (attempts > 1) { // If it was a correction
                         this.onAgentXpGain(subTask.agent, 7, 'learnedFromMistake'); // Extra XP for learning
                    }

                    return { success: true };
                } else {
                     this.postMessage('Orchestrator', `El pipeline falló para la subtarea ${subTask.id}.`, 'system');
                     return { success: false, reason: 'Fallo en el pipeline' };
                }

            } else {
                this.postMessage('Orchestrator', `La subtarea ${subTask.id} no pudo ser aprobada después de ${MAX_CORRECTION_ATTEMPTS} intentos. **Escalando al @TechLead.**`, 'system');
                await this.sleep(2000);
                
                // --- Escalation Logic ---
                const findFile = (nodes: FileNode[], path: string): FileNode | null => {
                    const parts = path.split('/').filter(p => p);
                    let currentLevel: FileNode[] = nodes;
                    for (let i = 0; i < parts.length; i++) {
                        const part = parts[i];
                        const found = currentLevel.find(n => n.name === part);
                        if (!found) return null;
                        if (i === parts.length - 1 && found.type === 'file') return found;
                        if (found.type === 'folder' && found.children) {
                            currentLevel = found.children;
                        } else { return null; }
                    }
                    return null;
                };
                
                const failedFile = findFile(this.fileTree, subTask.filePath);
                const failedCode = failedFile?.content || "No se pudo recuperar el código.";

                const resolutionPrompt = TeamAgents.TechLeadAgent.getEscalationResolutionPrompt(subTask, failedCode, feedbackForCorrection || "Sin feedback específico.");
                const resolutionResponse = await this.callGeminiAPI(resolutionPrompt, { requestJson: false }, { agentName: 'TechLead', sprintId: this.sprintId, storyId: this.currentStoryId });
                if (!resolutionResponse) return { success: false, reason: 'API call for escalation failed.' };
                const resolution = resolutionResponse.text;
                this.postMessage('TechLead', `**Intervención en Tarea ${subTask.id}:**\n${resolution}`, 'message');
                await this.sleep(3000);

                this.postMessage('LearningAgent', `Analizando la intervención del @TechLead para extraer una lección de alto impacto...`, 'system');
                await this.sleep(1500);

                const learningPrompt = LearningAgent.getTechLeadInterventionLearningPrompt(subTask, failedCode, feedbackForCorrection || "Sin feedback específico.", resolution);
                const learningResponse = await this.callGeminiAPI(learningPrompt, { requestJson: true }, { agentName: 'LearningAgent', sprintId: this.sprintId, storyId: this.currentStoryId });
                if (learningResponse) {
                    const learningResponseJson = learningResponse.text;
                    const parsedLearning = JSON.parse(learningResponseJson.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || learningResponseJson);

                    const { lesson } = parsedLearning;
                    if (lesson && lesson.lesson && lesson.agent) {
                        this.postMessage('LearningAgent', `Lección de Alto Impacto Generada: "${lesson.lesson}". Almacenando en la base de conocimiento de @${lesson.agent}.`, 'message');
                        const embedding = await embedContent(lesson.lesson);
                        await vectorDbService.addDocument(lesson.lesson, embedding, lesson.agent as AgentName);
                        this.onAgentXpGain(lesson.agent as AgentName, 3, 'lessonLearned');
                        await this.sleep(2000);
                    }
                }
                
                if (this.currentStoryId) {
                     this.logTransaction({
                        type: 'TASK_COMPLETED',
                        status: 'FAILURE',
                        agent: 'Orchestrator',
                        details: `Subtarea ${subTask.id} falló después de ${MAX_CORRECTION_ATTEMPTS} intentos y fue escalada.`,
                        storyId: this.currentStoryId
                    });
                }
                return { success: false, reason: feedbackForCorrection || 'Múltiples fallos en la revisión' };
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
            this.postMessage('Orchestrator', `Falló la subtarea '${subTask.id}': ${errorMessage}`, 'system');
            return { success: false, reason: errorMessage };
        }
    }

    async start() {
        this.postMessage('Orchestrator', 'Equipo, he convocado la reunión. Analizando el Sprint Backlog para comenzar el desarrollo.', 'system');
        await this.sleep(2000);
        this.postMessage('ProjectManager', 'Backlog del sprint analizado. Tenemos ' + this.taskQueue.length + ' historia(s) de usuario para implementar.', 'message');
        await this.sleep(2000);

        while (this.taskQueue.length > 0) {
            const currentStory = this.taskQueue.shift()!;
            this.currentStoryId = currentStory.id;
            this.subTaskPlan = [];
            this.completedSubTaskIds.clear();

            try {
                this.postMessage('Orchestrator', `Comenzando trabajo en **${currentStory.id}: ${currentStory.title}**. @TechLead, por favor, desglosa esta historia en tareas técnicas y define la arquitectura de archivos y sus dependencias.`, 'message');
                await this.sleep(2000);
                
                // Notify App that progress has started for Cycle Time calculation
                this.onTaskStartProgress(currentStory.id);

                // Step 1: Decompose the story into sub-tasks with dependencies
                let decompositionPlan: DecompositionPlan | null = null;
                try {
                    const decompositionPrompt = TeamAgents.TechLeadAgent.getDecompositionPrompt(currentStory, this.fileTree, this.projectManagementState.teams, ''); // RAG for TechLead can be added here
                    const response = await this.callGeminiAPI(decompositionPrompt, { requestJson: true }, { agentName: 'TechLead', sprintId: this.sprintId, storyId: this.currentStoryId });
                    if (!response) throw new Error("API call for decomposition returned null");
                    const responseJson = response.text;
                    const parsedResponse = JSON.parse(responseJson.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || responseJson);
                    decompositionPlan = parsedResponse as DecompositionPlan;
                    this.subTaskPlan = decompositionPlan.subTasks;
                    
                    const planMessage = `**Plan de Ataque para ${currentStory.id}:**\n` + this.subTaskPlan.map(t => `  - **ID:** ${t.id} | **Archivo:** \`${t.filePath}\` | **Encargado:** @${t.agent} | **Deps:** [${t.dependencies.join(', ')}]`).join('\n');
                    this.postMessage('TechLead', planMessage, 'message');
                } catch (error) {
                    this.postMessage('Orchestrator', `Error al obtener el plan de descomposición del Líder Técnico para ${currentStory.id}. Saltando historia. Error: ${error}`, 'system');
                    continue; // Skip to next story
                }
                
                // Step 1.5: Handle proposed API Contracts
                if (decompositionPlan.proposedContracts && decompositionPlan.proposedContracts.length > 0) {
                    const teamNameMap = new Map(this.projectManagementState.teams.map(t => [t.id, t.name]));
                    for (const contract of decompositionPlan.proposedContracts) {
                        const providerName = teamNameMap.get(contract.providerTeamId) || contract.providerTeamId;
                        const consumerName = teamNameMap.get(contract.consumerTeamId) || contract.consumerTeamId;

                        this.postMessage('TechLead', `**Propuesta de Contrato de API:** Se necesita un contrato entre ${consumerName} (consumidor) y ${providerName} (proveedor) para el endpoint \`${contract.method} ${contract.endpoint}\`. Revisando...`, 'system');
                        await this.sleep(3000);
                        
                        // Simulate review and acceptance by the provider team's TechLead
                        this.postMessage('TechLead', `Como Líder Técnico de ${providerName}, he revisado la propuesta de contrato para \`${contract.endpoint}\`. El esquema parece sólido. **Aceptado.**`, 'message');
                        await this.sleep(2000);

                        this.onContractsChange([{...contract, status: 'accepted'}]);
                    }
                }

                // Step 2: Execute sub-tasks in parallel based on dependencies
                let remainingSubTasks = [...this.subTaskPlan];
                let storySuccessfullyCompleted = true;
                let deadlockCounter = 0;

                while (remainingSubTasks.length > 0) {
                    const readyTasks = remainingSubTasks.filter(task => 
                        task.dependencies.every(depId => this.completedSubTaskIds.has(depId))
                    );

                    if (readyTasks.length === 0 && remainingSubTasks.length > 0) {
                        deadlockCounter++;
                        if (deadlockCounter > 2) {
                            this.postMessage('Orchestrator', `Error Crítico: Deadlock detectado en las dependencias de tareas para ${currentStory.id}. @ScrumMaster, por favor interviene.`, 'system');
                            await this.sleep(1500);
                            const smPrompt = ScrumMasterAgent.getStalledTaskCheckPrompt(remainingSubTasks.map(t => ({id: t.id, dependencies: t.dependencies})));
                            const smAnalysisResponse = await this.callGeminiAPI(smPrompt, { requestJson: false }, { agentName: 'ScrumMaster', sprintId: this.sprintId, storyId: this.currentStoryId });
                            if (smAnalysisResponse) {
                                const smAnalysis = smAnalysisResponse.text;
                                this.postMessage('ScrumMaster', smAnalysis, 'message');
                            }
                            storySuccessfullyCompleted = false;
                            break;
                        }
                        await this.sleep(2000); // Wait before re-checking for ready tasks
                        continue;
                    }
                    
                    deadlockCounter = 0; // Reset counter if progress is made

                    this.postMessage('Orchestrator', `Iniciando un lote de ${readyTasks.length} tarea(s) en paralelo: ${readyTasks.map(t => t.id).join(', ')}.`, 'system');
                    await this.sleep(1500);

                    const taskPromises = readyTasks.map(subTask => this.executeSubTask(subTask));
                    const results = await Promise.all(taskPromises);

                    let batchFailed = false;
                    for (let i = 0; i < results.length; i++) {
                        if (results[i].success) {
                            this.completedSubTaskIds.add(readyTasks[i].id);
                        } else {
                            batchFailed = true;
                        }
                    }
                    
                    remainingSubTasks = remainingSubTasks.filter(task => !this.completedSubTaskIds.has(task.id));
                    
                    if (batchFailed) {
                        this.postMessage('Orchestrator', `Una o más tareas fallaron en el lote actual para la historia ${currentStory.id}. La historia no se completará.`, 'system');
                        storySuccessfullyCompleted = false;
                        break;
                    }

                     // Check for user input between batches
                    if (this.userInputQueue.length > 0) {
                        const userInput = this.userInputQueue.shift()!;
                        this.currentStoryId = null; // Switch to general channel for user intervention message
                        this.postMessage('Orchestrator', `**INTERVENCIÓN DEL PRODUCT OWNER DETECTADA:** "${userInput}"`, 'system');
                        await this.sleep(1000);
                        this.postMessage('ProjectManager', `Entendido. Se creará una nueva historia de usuario y se priorizará para el próximo sprint. Continuaremos con el plan actual por ahora.`, 'message');
                        this.currentStoryId = currentStory.id; // Switch back to story channel
                        await this.sleep(2000);
                    }
                }

                if (storySuccessfullyCompleted) {
                    this.postMessage('Orchestrator', `Todas las subtareas para '${currentStory.title}' completadas. Fusionando en \`main\`.`, 'pr-merged');
                    this.onTaskComplete(currentStory.id);
                    this.logTransaction({
                        type: 'TASK_COMPLETED',
                        status: 'SUCCESS',
                        agent: 'Orchestrator',
                        details: `Historia de usuario ${currentStory.id} completada.`,
                        storyId: currentStory.id
                    });
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
                this.postMessage('Orchestrator', `Se encontró un error irrecuperable al procesar la historia ${currentStory.id}: ${errorMessage}. Saltando al siguiente elemento del backlog.`, 'system');
            } finally {
                this.currentStoryId = null;
            }
        }

        this.postMessage('Orchestrator', '¡Excelente trabajo, equipo! Todas las historias de usuario del sprint han sido implementadas.', 'system');
        this.finishCallback(this.fileTree);
    }
}