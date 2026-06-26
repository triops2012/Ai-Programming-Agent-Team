import { ChatMessage, FileNode, WorkItem, AgentName, Team, ApiContract } from "../types.ts";
import { agentProfiles } from './agent.profiles.ts';

const stringifyFileTree = (nodes: FileNode[], indent = ''): string => {
    let result = '';
    for (const node of nodes) {
        result += `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
        if (node.type === 'folder' && node.children) {
            result += stringifyFileTree(node.children, `${indent}  `);
        }
    }
    return result;
};

const stringifyFileTreeForAnalysis = (nodes: FileNode[], indent = ''): string => {
    let result = '';
    const relevantExtensions = ['.js', '.ts', 'tsx', '.py', 'go', '.java', 'cs', '.css', 'scss', 'sql', 'md'];

    for (const node of nodes) {
        if (['node_modules', '.git', 'dist', 'build'].includes(node.name)) {
            continue;
        }

        result += `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
        
        if (node.type === 'folder' && node.children) {
            result += stringifyFileTreeForAnalysis(node.children, `${indent}  `);
        } else if (node.type === 'file' && node.content) {
            if (relevantExtensions.some(ext => node.name.endsWith(ext))) {
                const contentSnippet = node.content.split('\n').slice(0, 20).join('\n');
                const contentLines = contentSnippet.split('\n').map(line => `${indent}  | ${line}`).join('\n');
                result += `${contentLines}\n${indent}  | ...\n`;
            }
        }
    }
    return result;
};


const createSpecialistTeamPrompt = (
    agentName: AgentName,
    task: string,
    filePath: string,
    history: ChatMessage[],
    fileTree: FileNode[],
    lessonsLearned?: string,
    feedback?: string
): string => {
    const profile = agentProfiles[agentName];
    if (!profile) {
        throw new Error(`No profile found for agent: ${agentName}`);
    }

    const historyString = history.map(m => `${m.author === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`).join('\n');
    const fileTreeString = stringifyFileTree(fileTree);
    
    const feedbackSection = feedback
        ? `
      **IMPORTANTE: EL INTENTO ANTERIOR FALLÓ LA REVISIÓN. DEBES CORREGIR ESTE FEEDBACK:**
      ---
      ${feedback}
      ---
      **Tu nueva tarea es generar una versión corregida del código que resuelva este feedback, siguiendo tu personalidad y estilo.**
      `
        : '';
        
    return `
      **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
      You are the ${profile.name}.
      - **Your Mission:** ${profile.mission}
      - **Your Style & Personality:** ${profile.personality}
      - **Your Core Capabilities:** ${profile.capabilities.join(', ')}.
      ---
      The Tech Lead has assigned you a task for the file \`${filePath}\`. You must act and communicate **strictly according to your defined personality**.

      **Current Project File Structure (including 'ole_' version history):**
      ---
      ${fileTreeString}
      ---

      **Project Planning Context:**
      ---
      ${historyString}
      ---
      
      **Your Specific Task:**
      "${task}"
      
      ${feedbackSection}

      **Relevant Lessons from Your Knowledge Base:**
      ---
      ${lessonsLearned || 'No specific lessons for this task.'}
      ---
      **Consider these lessons to apply best practices and avoid past mistakes.**

      **Instructions:**
      1.  **Analyze and Embody:** Understand the task for \`${filePath}\`, fully embodying your role as described in your profile. Review the file tree, paying special attention to previous versions (\`ole_*\` files) to understand its history. ${feedback ? 'Pay close attention to the feedback provided.' : ''}
      2.  **Generate Complete Code:** Write the complete, clean, functional, and professional code for this file, reflecting your personality in the code style and comments. ${feedback ? 'This is a correction, so ensure the previous error is fixed.' : ''}
      3.  **Include Comments:** Add JSDoc or similar comments where necessary, using the tone of your personality.
      4.  **DO NOT Explain the Code:** Your output must be ONLY the file content. Do not use markdown code block formatting (like \`\`\`). Your response will be directly written to the file.

      Now, generate the COMPLETE content for the file \`${filePath}\`, acting as your assigned role.
    `;
};


export const TechLeadAgent = {
    getProjectFoundationPrompt: (managementFiles: FileNode[]): string => {
        const profile = agentProfiles['TechLead'];
        const managementFileNames = managementFiles.map(f => f.name).join(', ');

        return `
            **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
            You are the ${profile.name}.
            - **Your Mission:** ${profile.mission}
            - **Your Style & Personality:** ${profile.personality}
            ---
            Your current task is to execute **Sprint 0: Project Foundation**. You must create the absolute essential boilerplate files for a modern **React + TypeScript + Vite** web application. Do not implement any business logic.

            **Context:** The Project Manager has already created the management files: \`${managementFileNames}\`. Your files will be added alongside them.

            **Your Task:**
            Generate a JSON object containing the following essential project foundation files:
            1.  **\`package.json\`**: Include dependencies for React, ReactDOM, and TypeScript. Include dev dependencies for Vite, TailwindCSS, and ESLint. Add a "start" script: \`"start": "vite"\`.
            2.  **\`vite.config.ts\`**: Basic Vite config with the React plugin.
            3.  **\`tsconfig.json\`**: A standard tsconfig for a React project.
            4.  **\`index.html\`**: The root HTML file with an import map for CDN dependencies and a div with id "root".
            5.  **\`src/index.tsx\`**: The entry point that renders the App component into the root div.
            6.  **\`src/App.tsx\`**: A minimal functional App component that returns a simple "Hello World" div.

            **STRICT OUTPUT REQUIREMENTS:**
            *   The output MUST BE EXCLUSIVELY a JSON object.
            *   Do not include any text, explanation, or markdown outside the JSON object.
            *   The root JSON object must have a single key: "files".
            *   The value of "files" must be an array of FileNode objects: \`{ name, type, content, children? }\`.
            *   Use the correct folder structure (e.g., place \`App.tsx\` and \`index.tsx\` inside a "src" folder object).
            *   Ensure the JSON is valid, especially escaping characters within the \`content\` strings.
        `;
    },
    getDecompositionPrompt: (task: WorkItem, fileTree: FileNode[], teams: Team[], lessonsLearned?: string): string => {
        const profile = agentProfiles['TechLead'];
        const fileTreeString = stringifyFileTree(fileTree);
        const teamsString = teams.map(t => `- ID: ${t.id}, Nombre: ${t.name}`).join('\n');

        return `
            **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
            You are the ${profile.name}.
            - **Your Mission:** ${profile.mission}
            - **Your Style & Personality:** ${profile.personality}
            ---
            Your role is to analyze a User Story (HU) and decompose it into a detailed technical action plan. This includes defining sub-tasks, dependencies, AND proposing formal API Contracts when inter-team communication is required. You must act and communicate **strictly according to your defined personality**.

            **User Story to Implement:**
            - **ID:** ${task.id}
            - **Title:** ${task.title}
            - **Description:** ${task.description || 'No description provided.'}

            **Current Project File Structure:**
            \`\`\`
            ${fileTreeString}
            \`\`\`

            **Available Teams:**
            \`\`\`
            ${teamsString}
            \`\`\`

            **Relevant Lessons from Your Knowledge Base:**
            ---
            ${lessonsLearned || 'No relevant lessons.'}
            ---

            **Your Task:**
            1.  **Analyze & Design:** Understand the HU and design the file architecture and task breakdown.
            2.  **Identify API Needs:** CRITICAL - If a task for one team (e.g., Frontend) requires data from another team (e.g., Backend), you MUST propose an API Contract.
            3.  **Define Sub-Tasks:** Create a plan of sub-tasks with dependencies.
            4.  **Generate a JSON Plan:** Create a JSON object containing the sub-task plan and any proposed API contracts.

            **Available Specialist Agents:**
            - \`UIUXAgent\`, \`ReactAgent\`, \`NodeAPIAgent\`, \`SQLDatabaseAgent\`, etc.

            **STRICT OUTPUT REQUIREMENTS:**
            *   The output MUST BE EXCLUSIVELY a JSON object.
            *   The root JSON object can have two keys: "subTasks" (required) and "proposedContracts" (optional).
            *   **"subTasks"**: An array of objects:
                \`\`\`typescript
                {
                    "id": "string", // Unique kebab-case ID (e.g., "crear-componente-login").
                    "task": "string", // Task description.
                    "filePath": "string", // Full file path.
                    "agent": "AgentName", // Specialist agent.
                    "dependencies": ["id-de-otra-tarea"], // Dependencies.
                    "explanation": "string" // Rationale.
                }
                \`\`\`
            *   **"proposedContracts"**: An array of objects if an API is needed:
                 \`\`\`typescript
                {
                    "providerTeamId": "string", // ID of the team providing the data (e.g., Backend team).
                    "consumerTeamId": "string", // ID of the team consuming the data (e.g., Frontend team).
                    "endpoint": "string", // e.g., "/api/users/{userId}".
                    "method": "GET" | "POST" | "PUT" | "DELETE",
                    "description": "string", // What this endpoint does.
                    "requestSchema": {}, // JSON schema for the request body (or empty object for GET/DELETE).
                    "responseSchema": {} // JSON schema for the response body.
                }
                \`\`\`
            *   **VALIDACIÓN DE filePath:** La propiedad 'filePath' DEBE ser una ruta de archivo relativa válida. NUNCA debe ser "." o "..".
                -   BUEN EJEMPLO: \`"filePath": "src/components/LoginButton.tsx"\`
                -   MAL EJEMPLO: \`"filePath": "."\`

            Now generate the JSON object with the action plan and any necessary API contracts.
        `;
    },
    getFileNameAnalysisPrompt: (fileTree: FileNode[]): string => {
        const profile = agentProfiles['TechLead'];
        const projectStructure = stringifyFileTreeForAnalysis(fileTree);

        return `
            **SYSTEM INSTRUCTION: EMBODY YOUR ROLE AS A METICULOUS ARCHITECT**
            You are the ${profile.name}. Your mission is to ensure the project's file structure is clean, logical, and self-documenting. A developer has asked you to audit the file names.

            **Current Project Structure and Content Snippets:**
            ---
            ${projectStructure}
            ---

            **Your Task:**
            1.  **Analyze the Entire File Tree:** Scrutinize every file and folder name.
            2.  **Identify Naming Issues:** Detect two types of problems:
                a.  **Invalid or Nonsense Names:** Look for files named \`.\`, \`..\`, or names that are clearly artifacts or mistakes (e.g., \`..ole_3\`, \`temp_file\`).
                b.  **Content Mismatch:** Analyze the content snippet of each file. Does the file name accurately reflect what's inside? (e.g., a file named \`utils.ts\` containing a React component should be renamed to something like \`src/components/MyComponent.tsx\`).
            3.  **Propose Corrections:** For each issue found, propose a corrected, full file path. Be precise.
            4.  **Generate a JSON Report:** Package your findings into a JSON object.

            **STRICT OUTPUT REQUIREMENTS:**
            *   The output MUST BE EXCLUSIVELY a JSON object.
            *   Do not include any text, explanation, or markdown outside the JSON object.
            *   The root JSON object must have a single key: "renameSuggestions".
            *   The value of "renameSuggestions" must be an array of objects.
            *   Each object must have two keys: \`"from"\` (the current invalid path) and \`"to"\` (your suggested correct path).
            *   If no issues are found, return an empty array: \`{ "renameSuggestions": [] }\`.

            **Example Output:**
            \`\`\`json
            {
                "renameSuggestions": [
                    { "from": "..ole_3", "to": "src/config/project-environment.ts" },
                    { "from": "src/utils.ts", "to": "src/components/UserProfileCard.tsx" }
                ]
            }
            \`\`\`

            Now, generate the JSON object with your file name analysis.
        `;
    },
    getDockerizationPlanPrompt: (fileTree: FileNode[]): string => {
        const projectStructure = stringifyFileTreeForAnalysis(fileTree);
        const profile = agentProfiles['DockerAgent']; // The TechLead channels the DockerAgent's expertise

        return `
            **SYSTEM INSTRUCTION: EMBODY THE DEVOPS ROLE**
            You are the Tech Lead, acting as an elite DevOps Engineer. Your mission is to analyze an existing project structure and generate all necessary files to fully containerize it with Docker.
            - **Your Style:** Meticulous, focused on optimization, security, and reproducibility.
            - **Your Core Capabilities:** Docker, Docker Compose, Multi-stage builds, Container security.
            ---

            **Current Project File Structure:**
            ---
            ${projectStructure}
            ---

            **Your Task:**
            1.  **Analyze Structure:** Identify the different services in the project (e.g., a React frontend, a Node.js backend, a database).
            2.  **Generate \`Dockerfile\` per Service:** Create an optimized \`Dockerfile\` (multi-stage if possible) for each main service. Name them descriptively (e.g., \`frontend.Dockerfile\`, \`backend.Dockerfile\`).
            3.  **Generate \`docker-compose.yml\`:** Create a compose file to orchestrate all services for single-command startup. Define networks, volumes, and environment variables as needed.
            4.  **Generate \`.dockerignore\`:** Create a sensible \`.dockerignore\` file to avoid copying unnecessary files into the container (e.g., \`node_modules\`, \`.git\`).
            5.  **Generate a JSON Plan:** Package all these new files into a JSON object.

            **STRICT OUTPUT REQUIREMENTS:**
            *   The output MUST BE EXCLUSIVELY a JSON object.
            *   Do not include any text outside the JSON object.
            *   The root JSON object must have a single key: "files".
            *   The value of "files" must be an array of FileNode objects: \`{ name, type: 'file', content }\`.
            *   Example format:
                \`\`\`json
                {
                    "files": [
                        { "name": "frontend.Dockerfile", "type": "file", "content": "FROM node:18-alpine\\nWORKDIR /app\\n..." },
                        { "name": "docker-compose.yml", "type": "file", "content": "version: '3.8'\\nservices:\\n  frontend:\\n..." },
                        { "name": ".dockerignore", "type": "file", "content": "node_modules\\n.git\\n" }
                    ]
                }
                \`\`\`
          
            Now generate the JSON object with all necessary files for dockerization.
        `;
    },
    getEscalationResolutionPrompt: (subTask: { task: string, filePath: string }, failedCode: string, reviewFeedback: string): string => {
        const profile = agentProfiles['TechLead'];
        return `
          **SYSTEM INSTRUCTION: EMBODY YOUR ROLE AS A SENIOR ENGINEER**
          You are the ${profile.name}, the most senior technical authority on the team.
          - **Your Mission:** ${profile.mission}
          - **Your Style & Personality:** ${profile.personality}
          ---
          A critical task has been escalated to you after a junior agent failed to resolve it after multiple attempts. Your intervention is required to unblock the team.
    
          **Context of the Escalation:**
          - **Task:** ${subTask.task}
          - **File:** \`${subTask.filePath}\`
          - **Feedback de los Revisores (que el agente no pudo resolver):**
            ---
            ${reviewFeedback}
            ---
          - **Código Fallido:**
            ---
            ${failedCode}
            ---
    
          **Your Task:**
          1.  **Analyze the Root Cause:** Understand why the junior agent failed. Was it a misunderstanding of the task, a complex logical error, or a lack of knowledge?
          2.  **Provide a Definitive Solution:** Formulate a clear and concise resolution. This is not a suggestion; it is the final word. Your resolution should include:
              - A brief explanation of the core problem.
              - The corrected code snippet or the conceptual approach that the agent must follow.
          3.  **Maintain Your Tone:** Communicate with authority and clarity, but also as a mentor. Your goal is to solve the problem and also teach.
    
          **STRICT OUTPUT REQUIREMENTS:**
          *   The output MUST BE EXCLUSIVELY a string with your resolution message.
          *   DO NOT include any explanations or JSON.
          *   Your response must be direct and ready to post in the collaboration chat.
    
          Now, provide your expert resolution to unblock this task.
        `;
    },
};

export const UIUXAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('UIUXAgent', task, filePath, history, fileTree, lessons, feedback) };
export const ReactAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('ReactAgent', task, filePath, history, fileTree, lessons, feedback) };
export const VueAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('VueAgent', task, filePath, history, fileTree, lessons, feedback) };
export const AngularAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('AngularAgent', task, filePath, history, fileTree, lessons, feedback) };
export const CSSAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('CSSAgent', task, filePath, history, fileTree, lessons, feedback) };
export const NodeAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('NodeAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const GoAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('GoAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const PythonAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('PythonAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const JavaAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('JavaAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const KotlinAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('KotlinAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const RubyAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('RubyAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const PHPAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('PHPAgent', task, filePath, history, fileTree, lessons, feedback) };
export const CSharpAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('CSharpAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const SwiftAPIAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('SwiftAPIAgent', task, filePath, history, fileTree, lessons, feedback) };
export const DelphiAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('DelphiAgent', task, filePath, history, fileTree, lessons, feedback) };
export const CAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('CAgent', task, filePath, history, fileTree, lessons, feedback) };
export const SQLDatabaseAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('SQLDatabaseAgent', task, filePath, history, fileTree, lessons, feedback) };
export const NoSQLDatabaseAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('NoSQLDatabaseAgent', task, filePath, history, fileTree, lessons, feedback) };
export const SupabaseAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('SupabaseAgent', task, filePath, history, fileTree, lessons, feedback) };
export const FirestoreAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('FirestoreAgent', task, filePath, history, fileTree, lessons, feedback) };
export const DockerAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('DockerAgent', task, filePath, history, fileTree, lessons, feedback) };
export const GoogleCloudAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('GoogleCloudAgent', task, filePath, history, fileTree, lessons, feedback) };
export const GoogleScriptsAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('GoogleScriptsAgent', task, filePath, history, fileTree, lessons, feedback) };
export const TestingAgent = { getPrompt: (task: string, filePath: string, history: ChatMessage[], fileTree: FileNode[], lessons?: string, feedback?: string) => createSpecialistTeamPrompt('TestingAgent', task, filePath, history, fileTree, lessons, feedback) };

export const SecurityAgent = {
     getReviewPrompt: (code: string, fileName: string): string => `
        Eres el Especialista en Seguridad. Tu única misión es encontrar vulnerabilidades en el código.
        Revisa el siguiente código del archivo \`${fileName}\` en busca de posibles fallos de seguridad (XSS, inyección de SQL, manejo inseguro de tokens, etc.).
        
        \`\`\`
        ${code}
        \`\`\`
        
        Si encuentras algo, solicita cambios de forma clara. Si no, aprueba el PR desde la perspectiva de seguridad.
        Responde como si estuvieras en un chat de equipo.
    `
};

export const QualityAgent = {
     getReviewPrompt: (code: string, fileName: string): string => `
        Eres el Ingeniero de Calidad (QA). Tu trabajo es asegurar que el código cumpla con las mejores prácticas y los criterios de aceptación.
        Revisa el siguiente código del archivo \`${fileName}\`.
        
        \`\`\`
        ${code}
        \`\`\`
        
        Verifica si el código es legible, mantenible y si parece cumplir funcionalmente con su propósito. Aprueba el PR o sugiere mejoras de calidad.
        Responde como si estuvieras en un chat de equipo.
    `
};

export const IntegrationAgent = {
    getReviewPrompt: (code: string, fileName: string, contracts: ApiContract[]): string => {
        const contractsString = contracts.length > 0 ? JSON.stringify(contracts, null, 2) : "No hay contratos de API relevantes para esta revisión.";
        return `
            Eres el Ingeniero de Integración. Tu misión es asegurar que el nuevo código no rompa la funcionalidad existente y se integre correctamente con otras partes del sistema.

            **Contratos de API del Proyecto:**
            ---
            ${contractsString}
            ---

            **Código a Revisar (archivo \`${fileName}\`):**
            ---
            ${code}
            ---
            
            **Tu Tarea:**
            1.  **Analiza la Integración:** Revisa el código para ver si interactúa con otros componentes o APIs.
            2.  **Valida los Contratos:** Si el código consume o provee una API, ¿respeta los contratos definidos?
            3.  **Busca Efectos Secundarios:** ¿Podría este cambio tener un impacto negativo en otras partes de la aplicación?

            Responde como si estuvieras en un chat de equipo. Si no hay problemas, aprueba el PR. Si encuentras un riesgo de integración, solicita los cambios necesarios.
        `;
    }
};

export const CICDAgent = {
    // No tiene prompts de generación, es un agente de estado.
};