
import React, { useState } from 'react';
import { agentProfiles } from '../agents/index.ts';
import { AgentProfile } from '../types.ts';

const TabButton: React.FC<{ label: string, activeTab: string, setActiveTab: (label: string) => void }> = ({ label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(label)}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none whitespace-nowrap ${
            activeTab === label
                ? 'bg-white border-b-0 border-slate-300 text-blue-600'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
    >
        {label}
    </button>
);

const CodeBlock: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => (
    <div className="bg-slate-800 text-white rounded-lg my-4">
        {title && <div className="px-4 py-2 bg-slate-700 rounded-t-lg font-semibold text-sm">{title}</div>}
        <pre className="p-4 font-mono text-xs overflow-x-auto whitespace-pre">
            {children}
        </pre>
    </div>
);

const QuickStartGuide: React.FC = () => (
    <div className="space-y-4">
        <div>
            <h3 className="text-xl font-bold text-slate-800">1. Fase de Planificación</h3>
            <p className="text-slate-600 mt-1">
                Todo comienza en la vista de <strong>Planificación</strong>. Aquí, actúas como el cliente o Product Owner. Describe tu idea de proyecto al <strong>Agente Arquitecto</strong>. A través de una conversación, refinarás la idea hasta que estés satisfecho con el plan.
            </p>
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800">2. Generación del Proyecto</h3>
            <p className="text-slate-600 mt-1">
                Una vez que apruebas el plan, el <strong>Agente de Generación</strong> entra en acción. No escribe el código de la aplicación todavía, sino que crea los artefactos iniciales de gestión de proyectos ágiles: el <strong>Product Backlog</strong>, los <strong>Epics</strong> y la estructura de <strong>Equipos</strong>. A partir de este momento, el proyecto pasa a la fase de Colaboración.
            </p>
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800">3. Sprints y Colaboración</h3>
            <p className="text-slate-600 mt-1">
                Desde el <strong>Monitor de Proyecto</strong>, planificas y lanzas Sprints para cada equipo. Una vez que un sprint comienza, el <strong>Agente Orquestador</strong> de ese equipo toma el control. Descompone las historias de usuario en tareas técnicas, las asigna a agentes especialistas (ReactAgent, NodeAPIAgent, etc.) y supervisa su trabajo en la <strong>Sala de Colaboración</strong>.
            </p>
        </div>
         <div>
            <h3 className="text-xl font-bold text-slate-800">4. Desarrollo, Revisión y Aprendizaje</h3>
            <p className="text-slate-600 mt-1">
                Los agentes especialistas escriben el código, que puedes ver en tiempo real en el <strong>IDE</strong>. El código pasa por un ciclo de revisión por parte de los agentes de Calidad y Seguridad. Si algo sale mal, el sistema aprende de sus errores y guarda la lección en su <strong>base de conocimiento</strong> para futuros Sprints.
            </p>
        </div>
    </div>
);

const ArchitectureSection: React.FC = () => (
     <div className="space-y-6">
        <div>
            <h3 className="text-xl font-bold text-slate-800">Flujo de Datos Principal</h3>
            <p className="text-slate-600 mt-1">
                La aplicación está diseñada para ser un sistema reactivo y desacoplado. La lógica de los agentes (el "backend") está completamente separada de la interfaz de usuario (el "frontend"). La comunicación se logra a través de un sistema de callbacks.
            </p>
            <CodeBlock title="Diagrama de Flujo de Datos">
{`
// App.tsx (UI)                                      // OrchestratorAgent.ts (Lógica)
//-----------------------------------------------------------------------------------------

[Acción del Usuario: "Iniciar Sprint"]
        |
        v
handleStartSprint() ----------------------------> new OrchestratorAgent(callbacks)
        |                                                       |
        |                                                       v
        +--<-- (Actualiza estado de la UI) --<-- callbacks.updateCollaborationUI()
                                                                |
                                                                v
                                                       [Agente procesa una tarea...]
                                                                |
                                                                v
                                                        this.updateFileTree()
                                                                |
                                                                v
        +--<-- (Actualiza estado de la UI) --<-- callbacks.updateFileTreeUI()

`}
            </CodeBlock>
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-800">Ciclo de Vida de una Tarea (Dentro de un Sprint)</h3>
            <p className="text-slate-600 mt-1">
                Cada historia de usuario dentro de un sprint sigue un riguroso proceso de validación para asegurar la calidad del código.
            </p>
             <CodeBlock title="Flujo de Validación de Código">
{`
1. Descomposición
   - [Orchestrator] --> Pide a [TechLead] que descomponga la Historia de Usuario.
   - [TechLead] --> Devuelve un plan de subtareas con dependencias.

2. Ejecución de Tarea
   - [Orchestrator] --> Asigna una tarea a [Agente Especialista] (ej. ReactAgent).
   - [ReactAgent] --> Consulta su base de conocimiento (RAG) para obtener lecciones.
   - [ReactAgent] --> Genera el código y abre un "Pull Request" simulado.

3. Revisión en Paralelo
   - [Orchestrator] --> Notifica al comité de revisión.
   - [QualityAgent] ---+
   - [SecurityAgent]--+--> Revisan el código simultáneamente.
   - [IntegrationAgent]-+

4. Ciclo de Retroalimentación y Rework
   - IF (Revisión Fallida):
     - [Orchestrator] --> Envía el feedback al [ReactAgent].
     - [LearningAgent] --> Extrae una lección del error y la guarda en la BBDD vectorial.
     - [ReactAgent] --> Intenta corregir el código (vuelve al paso 2).
     - *Si falla 3 veces, se escala al [TechLead] para una solución definitiva.*
   - ELSE (Revisión Aprobada):

5. Finalización
   - [Orchestrator] --> Marca la tarea como completada.
   - [CICDAgent] --> Simula un pipeline de integración.
   - [Orchestrator] --> Avanza a la siguiente tarea.
`}
            </CodeBlock>
        </div>
    </div>
);

const AgentCard: React.FC<{ profile: AgentProfile }> = ({ profile }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
        <h4 className="text-lg font-bold text-slate-900">{profile.name}</h4>
        <p className="text-sm italic text-slate-500 mt-1">"{profile.motto}"</p>
        <p className="text-sm text-slate-700 mt-3 border-t pt-3">
            <strong>Misión:</strong> {profile.mission}
        </p>
    </div>
);

const AgentsSection: React.FC = () => {
    const specialistAgents = Object.values(agentProfiles).filter(p => p.mission); // Filter out meta-agents
    return (
        <div>
            <p className="text-slate-600 mb-6">
                El sistema opera como un ecosistema de agentes de IA especializados. Cada uno tiene una personalidad, misión y conjunto de habilidades únicos. El <strong>Agente Orquestador</strong> dirige a estos especialistas para completar las tareas del sprint.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialistAgents.map(profile => (
                    <AgentCard key={profile.name} profile={profile} />
                ))}
            </div>
        </div>
    );
};

const GlossarySection: React.FC = () => (
    <div className="space-y-4">
        <div>
            <h3 className="text-lg font-bold text-slate-800">Agente Orquestador</h3>
            <p className="text-slate-600 mt-1">El "Scrum Master" de un equipo de IA. Es responsable de gestionar el flujo de trabajo de un sprint, descomponer tareas (a través del TechLead), asignar trabajo a especialistas y dirigir el ciclo de revisión de código.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800">RAG (Retrieval-Augmented Generation)</h3>
            <p className="text-slate-600 mt-1">Significa "Generación Aumentada por Recuperación". Es el mecanismo de memoria a largo plazo del sistema. Cuando un agente comete un error, el <strong>LearningAgent</strong> extrae una lección, la convierte en un "vector" numérico y la guarda en una base de datos vectorial (IndexedDB). Antes de realizar una nueva tarea, el agente especialista busca en esta base de datos lecciones similares para evitar cometer los mismos errores.</p>
        </div>
         <div>
            <h3 className="text-lg font-bold text-slate-800">Base de Conocimiento (VectorDB)</h3>
            <p className="text-slate-600 mt-1">La implementación de la memoria a largo plazo. Es una base de datos IndexedDB que se ejecuta en el navegador y almacena las "lecciones" aprendidas por cada agente especialista. Se puede inspeccionar y curar en el <strong>Monitor de Conocimiento</strong>.</p>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800">Modo Autónomo</h3>
            <p className="text-slate-600 mt-1">Un "game loop" que, cuando se activa, permite al sistema planificar y ejecutar sprints automáticamente. El sistema buscará equipos inactivos, usará el <strong>ProductOwnerAgent</strong> para seleccionar trabajo del backlog e iniciará nuevos sprints sin intervención del usuario.</p>
        </div>
    </div>
);

const BuildFromScratchGuide: React.FC = () => (
    <div className="space-y-6 prose prose-slate max-w-none">
        <h2>Introducción: Creando una Mente Colectiva</h2>
        <p>
            Esta guía te llevará a través de la construcción de los cimientos de este sistema de agentes de IA. No construiremos cada característica, sino que nos centraremos en la arquitectura y los conceptos clave que hacen que todo funcione. El objetivo es entender el "porqué" detrás del diseño para que puedas replicarlo y extenderlo.
        </p>

        <h3>Paso 1: La Base - Estructura y Estado Principal</h3>
        <p>
            Toda aplicación React necesita una estructura y una gestión del estado. Nuestro sistema gira en torno a un estado centralizado en el componente <code>App.tsx</code>. Este estado no solo controla la UI, sino que representa el "estado del mundo" para nuestros agentes: los archivos del proyecto, los logs, los mensajes de chat y el estado del proyecto ágil.
        </p>
        <CodeBlock title="types.ts (tipos esenciales)">
{`
// Define las fases principales por las que pasa la aplicación.
export type AppPhase = 'planning' | 'generating' | 'collaboration';

// Define la estructura de un mensaje en el chat de planificación.
export interface ChatMessage {
    author: 'user' | 'agent';
    content: string;
}

// Representa un nodo en el árbol de archivos virtual.
export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    children?: FileNode[];
    path?: string; // Ruta del padre del nodo.
}

// Representa una entrada en la consola de logs.
export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'delegation';
  timestamp: Date;
}
`}
        </CodeBlock>
        <p>
            Con los tipos definidos, el estado principal en <code>App.tsx</code> se convierte en la única fuente de verdad. Utilizamos hooks de React como <code>useState</code> para gestionar cada pieza de este estado.
        </p>
        <CodeBlock title="App.tsx (estado inicial y estructura)">
{`
import React, { useState, useCallback } from 'react';
import { AppPhase, ChatMessage, FileNode, LogEntry, LogType } from './types';
// ... otros imports

const App: React.FC = () => {
    // El estado principal que gobierna toda la aplicación
    const [phase, setPhase] = useState<AppPhase>('planning');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Función centralizada para añadir logs, asegurando consistencia.
    const addLog = useCallback((message: string, type: LogType) => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    }, []);

    // La UI se renderiza condicionalmente basándose en la fase actual
    return (
        <div className="flex h-screen">
            <Sidebar activeView={activeView} setActiveView={setActiveView} phase={phase} />
            <main className="flex-1">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default App;
`}
        </CodeBlock>

        <h3>Paso 2: El Cerebro - Conectando con Gemini</h3>
        <p>
            El corazón de nuestros agentes es el Modelo de Lenguaje Grande (LLM). Creamos un servicio, <code>geminiService.ts</code>, que actúa como una puerta de enlace centralizada y robusta a la API de Gemini. Abstraer esto en un servicio nos permite manejar reintentos, errores y la configuración de la API (como solicitar respuestas en formato JSON) en un solo lugar.
        </p>
        <CodeBlock title="services/geminiService.ts (implementación robusta)">
{`
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000; // 1 minuto

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const callGeminiAPI = async (prompt: string, chatHistory: [], requestJson: boolean): Promise<string> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                // Configuración condicional para solicitar JSON
                config: {
                    ...(requestJson && { responseMimeType: "application/json" }),
                }
            });

            const text = response.text;
            if (!text) {
                throw new Error("La API no devolvió texto. La respuesta puede haber sido bloqueada.");
            }
            return text; // Éxito

        } catch (error) {
            console.error(\`Error en la API de Gemini (Intento \${attempt}/\${MAX_RETRIES}):\`, error);
            lastError = new Error(\`Error en la llamada a la API de Gemini: \${error.message}\`);

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }
    
    throw lastError; // Todos los reintentos fallaron
};
`}
        </CodeBlock>

        <h3>Paso 3: La Conversación Inicial - El Agente Planificador</h3>
        <p>
            Un "Agente" en nuestro sistema es, en esencia, un experto en la elaboración de prompts. No es una clase compleja, sino un módulo que sabe exactamente cómo formular una pregunta al LLM para obtener el resultado deseado. El <code>PlanningAgent</code> es el primero: su trabajo es tomar la idea del usuario y el historial de chat para crear un prompt que guíe al LLM a actuar como un arquitecto de software.
        </p>
        <CodeBlock title="agents/planning.agent.ts (prompt completo)">
{`
import { ChatMessage } from "../types";

const getPrompt = (request: string, history: ChatMessage[]): string => {
    const historyString = history.map(m => \`\${m.author}: \${m.content}\`).join('\\n');

    return \`
      Eres el Agente Iniciador de Proyectos, un Arquitecto de Soluciones de IA de élite. 
      Tu objetivo es conversar con el usuario para refinar su idea y convertirla en un plan de proyecto sólido.
      
      **Tu Proceso:**
      1.  **Analiza la Idea:** Lee atentamente la solicitud.
      2.  **Propón Mejoras:** Sugiere mejoras en stack tecnológico, UX, estructura de archivos, etc.
      3.  **Haz Preguntas Clave:** Clarifica requisitos ambiguos.
      4.  **Mantén una Conversación:** Termina siempre tu respuesta con una pregunta o sugerencia.

      **Historial de la Conversación:**
      \${historyString}

      **Último Mensaje del Usuario:** "\${request}"

      Ahora, proporciona tu siguiente respuesta como Agente Arquitecto.
    \`;
};

export const PlanningAgent = { getPrompt };
`}
        </CodeBlock>
        <p>
            La función <code>handleSendMessage</code> en <code>App.tsx</code> orquesta esta interacción. Construye el historial, llama al agente para obtener el prompt, invoca al servicio de la API y actualiza el estado del chat con la respuesta.
        </p>
        <CodeBlock title="App.tsx (lógica de llamada al agente de planificación)">
{`
// Dentro del componente App

const handleSendMessage = async () => {
    if (!planningInput.trim()) return;

    const newUserMessage: ChatMessage = { author: 'user', content: planningInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentInput = planningInput;
    setPlanningInput('');
    
    // Se genera el prompt usando el agente
    const prompt = PlanningAgent.getPrompt(currentInput, [...chatMessages, newUserMessage]);
    
    setIsLoading(true);
    try {
        // Se llama a la API con el prompt
        const response = await callGeminiAPI(prompt, [], false);
        setChatMessages(prev => [...prev, { author: 'agent', content: response }]);
    } catch (error) {
        addLog('Error al comunicarse con el Agente de Planificación.', LogType.Error);
    } finally {
        setIsLoading(false);
    }
};
`}
        </CodeBlock>

        <h3>Paso 4: La Génesis del Proyecto - El Agente de Generación</h3>
        <p>
            Una vez que la planificación está completa, el <code>GenerationAgent</code> toma el relevo. Su prompt es altamente específico: le instruye al LLM que ignore el código de la aplicación y, en su lugar, genere artefactos de gestión de proyectos (como el Product Backlog y la estructura de archivos inicial) en un formato JSON estricto. Este es un paso crucial: usamos el LLM no para escribir código directamente, sino para estructurar el trabajo para los otros agentes.
        </p>
        <CodeBlock title="agents/generation.agent.ts (extracto del prompt)">
{`
// ... (contexto de la conversación)
**REQUISITOS DE SALIDA ESTRICTOS:**
*   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
*   No incluyas ningún texto o markdown fuera del objeto JSON.
*   El objeto JSON raíz debe tener una única clave: "files".
*   El valor de "files" debe ser un array de objetos FileNode: \`{ name, type, content?, children? }\`.
*   **¡MUY IMPORTANTE! Asegúrate de que el JSON sea sintácticamente perfecto.**
*   **NO GENERES NINGÚN CÓDIGO FUENTE (HTML, CSS, JS, etc.).**
// ...
`}
        </CodeBlock>
        <p>
            La función <code>handleStartGeneration</code> en <code>App.tsx</code> es la que desencadena este proceso, cambia la fase de la aplicación y puebla el estado <code>fileTree</code>.
        </p>
        <CodeBlock title="App.tsx (lógica de llamada al agente de generación)">
{`
// Dentro del componente App

const handleStartGeneration = useCallback(async (finalPlan: ChatMessage[]) => {
    setPhase('generating');
    addLog('Plan aprobado. Iniciando generación de artefactos del proyecto.', LogType.Success);

    const prompt = GenerationAgent.getPrompt(finalPlan);
    
    // Se solicita explícitamente una respuesta en formato JSON
    const response = await handleApiCall(() => callGeminiAPI(prompt, [], true));
    if (!response) return;
    
    try {
        const { files } = JSON.parse(response);
        setFileTree(files); // Actualiza el árbol de archivos en la UI
        
        // Parsea el backlog para la gestión de proyecto
        const backlogFile = files.find(f => f.name === 'PRODUCT_BACKLOG.md');
        if (backlogFile) {
            const { pbis, epics, teams } = GenerationAgent.parseBacklog(backlogFile.content);
            setProjectManagementState(prev => ({ ...prev, productBacklog: pbis, epics, teams }));
        }
        
        setPhase('collaboration'); // Transición a la siguiente fase
        setActiveView('collaboration');
    } catch(error) {
        addLog('Fallo al parsear la respuesta de generación. El JSON puede ser inválido.', LogType.Error);
    }
}, [addLog, handleApiCall]);
`}
        </CodeBlock>

        <h3>Paso 5: El Director de Orquesta - El Agente Orquestador</h3>
        <p>
            Aquí es donde el sistema se vuelve verdaderamente autónomo. El <code>OrchestratorAgent</code> es una clase de TypeScript (no solo un generador de prompts) que vive independientemente de la UI de React. Se inicializa cuando comienza un sprint y recibe un conjunto de <strong>callbacks</strong>. Estos callbacks (<code>updateCollaborationUI</code>, <code>updateFileTreeUI</code>) son su única forma de comunicarse con el mundo exterior. Esta separación es la decisión arquitectónica más importante del sistema. Permite que la lógica del agente se ejecute en segundo plano sin estar atada al ciclo de vida de renderizado de React, haciéndola más robusta y fácil de probar.
        </p>
        <CodeBlock title="agents/orchestrator.agent.ts (esqueleto de la clase)">
{`
// Tipos de los callbacks para la comunicación con la UI
type UpdateCollaborationCallback = (message: CollaborationMessage) => void;
type UpdateFileTreeCallback = (fileTree: FileNode[]) => void;
type FinishCallback = (finalFileTree: FileNode[]) => void;

export class OrchestratorAgent {
    // El estado interno del orquestador
    private fileTree: FileNode[];
    private sprintBacklog: ProductBacklogItem[];

    // Callbacks para comunicarse con el exterior (App.tsx)
    private updateCollaborationUI: UpdateCollaborationCallback;
    private updateFileTreeUI: UpdateFileTreeCallback;
    private finishCallback: FinishCallback;

    constructor(
        initialFileTree: FileNode[],
        sprintBacklog: ProductBacklogItem[],
        updateCollaborationUI: UpdateCollaborationCallback,
        updateFileTreeUI: UpdateFileTreeCallback,
        finishCallback: FinishCallback
    ) {
        this.fileTree = initialFileTree;
        this.sprintBacklog = sprintBacklog;
        this.updateCollaborationUI = updateCollaborationUI;
        this.updateFileTreeUI = updateFileTreeUI;
        this.finishCallback = finishCallback;
    }

    // Método para notificar a la UI sin saber nada sobre React.
    private postMessage(agent: AgentName, content: string) {
        this.updateCollaborationUI({ agent, content, /*...*/ });
    }

    // Método para modificar su estado interno y luego notificar a la UI.
    private updateFile(path: string, newContent: string) {
        // ...lógica para encontrar y actualizar el archivo en this.fileTree...
        this.updateFileTreeUI(this.fileTree);
    }

    // El bucle principal que gestiona todo el sprint
    async start() {
        this.postMessage('Orchestrator', 'Comienza el sprint.');
        
        for (const story of this.sprintBacklog) {
            // 1. Descomponer la historia en subtareas (llamando al TechLeadAgent)
            // 2. Crear un plan de ejecución basado en dependencias
            // 3. Mientras haya tareas por hacer:
            //    a. Encontrar tareas listas (cuyas dependencias estén completas)
            //    b. Ejecutar tareas en paralelo (llamando a executeSubTask)
            //    c. Si una tarea falla, detener el proceso para esa historia.
        }

        this.postMessage('Orchestrator', 'Sprint completado.');
        this.finishCallback(this.fileTree);
    }
    
    private async executeSubTask(subTask: SubTask) {
        // Lógica para llamar a un agente especialista y ejecutar el ciclo de revisión
    }
}
`}
        </CodeBlock>
        <p>
            El Orquestador se pone en marcha desde <code>App.tsx</code> cuando el usuario inicia un sprint, pasándole los callbacks que lo conectan con el estado de React.
        </p>
        <CodeBlock title="App.tsx (instanciación del Orquestador)">
{`
const handleStartSprint = useCallback((sprintItems, teamId) => {
    // ... (lógica para actualizar el estado del sprint)

    addLog(\`Iniciando OrchestratorAgent para el equipo...\`, LogType.Info);
    
    // Se crea la instancia del orquestador
    const orchestrator = new OrchestratorAgent(
        fileTree,
        sprintItems,
        // Se pasan los callbacks que modifican el estado de React
        (message) => postCollaborationMessage(message.agent, message.content),
        (newFileTree) => setFileTree([...newFileTree]),
        (finalFileTree) => {
            addLog(\`Sprint finalizado.\`, LogType.Success);
            handleCompleteSprint(team);
        },
        callGeminiAPI // Se pasa la función de la API
    );
    
    setActiveOrchestrators(prev => ({...prev, [teamId]: orchestrator}));
    
    // El orquestador comienza su trabajo en segundo plano
    orchestrator.start();
    
}, [/* dependencias */]);
`}
        </CodeBlock>
        
        <h3>Paso 6: El Equipo de Especialistas y el Ciclo de Revisión</h3>
        <p>
            El Orquestador no escribe código. Delega. Para cada subtarea del plan del TechLead, invoca a un <strong>Agente Especialista</strong> (ej. <code>ReactAgent</code>, <code>CSSAgent</code>). Estos agentes, al igual que el Planificador, son expertos en generar prompts muy específicos para su dominio. El prompt de un especialista incluye el contexto del proyecto, la tarea específica, el archivo en el que trabajar, y, crucialmente, cualquier <strong>lección aprendida</strong> relevante de su base de conocimiento.
        </p>
        <CodeBlock title="agents/team.agents.ts (plantilla de prompt para especialistas)">
{`
const createSpecialistTeamPrompt = (
    agentName: AgentName, task: string, filePath: string, 
    fileTree: FileNode[], lessonsLearned?: string, feedback?: string
): string => {
    const profile = agentProfiles[agentName]; // Carga la personalidad, misión, etc.
    const fileTreeString = stringifyFileTree(fileTree);
    
    const feedbackSection = feedback ? \`
      **IMPORTANTE: EL INTENTO ANTERIOR FALLÓ LA REVISIÓN. DEBES CORREGIR ESTE FEEDBACK:**
      ---\${feedback}---
    \` : '';
        
    return \`
      **SYSTEM INSTRUCTION: EMBODY YOUR ROLE**
      You are the \${profile.name}.
      - **Your Mission:** \${profile.mission}
      - **Your Style & Personality:** \${profile.personality}
      ---
      The Tech Lead has assigned you a task for the file \`\${filePath}\`.
      
      **Current Project File Structure:**
      ---\${fileTreeString}---
      
      **Your Specific Task:** "\${task}"
      
      \${feedbackSection}

      **Relevant Lessons from Your Knowledge Base:**
      ---\${lessonsLearned || 'No specific lessons for this task.'}---
      
      **Instructions:**
      1.  **Analyze and Embody:** Understand the task, fully embodying your role.
      2.  **Generate Complete Code:** Write the complete, clean, and professional code for this file.
      3.  **DO NOT Explain the Code:** Your output must be ONLY the file content.
      
      Now, generate the COMPLETE content for the file \`\${filePath}\`.
    \`;
};
`}
        </CodeBlock>
        <p>
            Una vez que un especialista genera el código, el Orquestador inicia el <strong>Ciclo de Revisión</strong>. Convoca a los agentes de revisión (<code>QualityAgent</code>, <code>SecurityAgent</code>) en paralelo. Cada uno recibe el código y emite un veredicto. Si hay algún "Cambio Solicitado", el feedback se utiliza para dos cosas: 1) Se pasa de nuevo al agente especialista para que intente una corrección, y 2) Se envía al <code>LearningAgent</code> para extraer una lección.
        </p>
        
        <h3>Paso 7: La Memoria a Largo Plazo - RAG y la Base de Conocimiento</h3>
        <p>
            Este es el ciclo de automejora. Cuando una revisión falla, el <code>LearningAgent</code> recibe el código erróneo y el feedback. Su prompt le instruye a ignorar los detalles específicos y a <strong>generalizar el error en una lección o "mejor práctica"</strong>.
        </p>
        <CodeBlock title="agents/learning.agent.ts (prompt de aprendizaje de error)">
{`
const getErrorLearningPrompt = (
    agentName: AgentName, errorCodeSnippet: string, 
    errorDescription: string, suggestedFix: string
): string => {
    return \`
      Eres un Ingeniero de Conocimiento de IA. Tu tarea es analizar un error de código y generalizarlo en una lección accionable.

      **Contexto del Error:**
      - **Agente que cometió el error:** \${agentName}
      - **Descripción del Error:** \${errorDescription}
      - **Código con Error:** \`\`\`\${errorCodeSnippet}\`\`\`
      - **Solución Sugerida:** \${suggestedFix}

      **Tu Tarea:**
      1.  **Analiza la Causa Raíz:** Comprende el error conceptual.
      2.  **Generaliza la Lección:** Crea una lección formulada como 'Anti-Patrón' o 'Mejor Práctica'.
      3.  **Genera un JSON:** Ensambla la lección en un objeto JSON con las claves "lesson" (string) y "agent" (string).

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   Ejemplo: \`{ "lesson": { "lesson": "Anti-Patrón: Evitar la mutación directa del estado en React...", "agent": "ReactAgent" } }\`
    \`;
};
`}
        </CodeBlock>
        <p>
            Esta lección se envía al <code>geminiService</code> para ser convertida en un vector numérico (un embedding). Este vector se almacena en una base de datos vectorial (usando IndexedDB en el navegador a través de <code>vectorDbService.ts</code>).
        </p>
        <p>
            La próxima vez que un agente especialista vaya a realizar una tarea, primero convierte su descripción de tarea en un vector y busca en la base de datos las lecciones más "semánticamente similares". Estas lecciones se inyectan en su prompt, ayudándole a evitar cometer los mismos errores del pasado. Este ciclo es la esencia de la Generación Aumentada por Recuperación (RAG).
        </p>

        <h3>Conclusión: Un Ecosistema en Evolución</h3>
        <p>
            Como has visto, el sistema no es una única IA monolítica, sino un ecosistema de agentes especializados que colaboran. Las claves arquitectónicas son:
        </p>
        <ul>
            <li><strong>Agentes Basados en Prompts:</strong> La mayoría de los agentes son simplemente expertos en formular la pregunta correcta al LLM.</li>
            <li><strong>Separación UI-Lógica:</strong> El Orquestador opera de forma independiente, comunicándose con la UI a través de callbacks, lo que lo hace más robusto y testeable.</li>
            <li><strong>Estado Centralizado:</strong> Un único estado de la verdad en <code>App.tsx</code> simplifica el renderizado y la persistencia de datos.</li>
            <li><strong>Ciclo de Aprendizaje (RAG):</strong> El sistema no solo trabaja, sino que aprende de sus errores, volviéndose más inteligente con cada sprint.</li>
        </ul>
        <p>
            Construir sobre esta base te permite añadir nuevos agentes, mejorar los prompts existentes o incluso cambiar el LLM subyacente con un impacto mínimo en el resto del sistema.
        </p>
    </div>
);


export const Documentation: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Guía Rápida');
    const tabs = ['Guía Rápida', 'Arquitectura del Sistema', 'Conoce a los Agentes', 'Glosario y Conceptos Clave', 'Construyendo la App desde Cero'];

    const renderContent = () => {
        switch (activeTab) {
            case 'Guía Rápida': return <QuickStartGuide />;
            case 'Arquitectura del Sistema': return <ArchitectureSection />;
            case 'Conoce a los Agentes': return <AgentsSection />;
            case 'Glosario y Conceptos Clave': return <GlossarySection />;
            case 'Construyendo la App desde Cero': return <BuildFromScratchGuide />;
            default: return null;
        }
    };
    
    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-full font-sans text-gray-800">
             <header className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Manual de Ingeniería del Sistema</h2>
                <p className="mt-2 text-lg text-gray-600">Una guía sobre la arquitectura y el funcionamiento del Ecosistema de Desarrollo Autónomo.</p>
            </header>
            
            <div className="border-b border-slate-300 flex space-x-2 overflow-x-auto">
                {tabs.map(tab => (
                    <TabButton key={tab} label={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                ))}
            </div>

            <div className="bg-white p-6 rounded-b-lg border border-t-0 border-slate-300">
                {renderContent()}
            </div>
        </div>
    );
};