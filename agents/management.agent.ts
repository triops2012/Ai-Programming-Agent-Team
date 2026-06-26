
import { ChatMessage } from "../types.ts";

const createSpecialistPrompt = (agentName: string, expertise: string, task: string, request: string, history: ChatMessage[]): string => {
    const historyString = history.map(m => `${m.author === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`).join('\n');
    return `
      Eres el ${agentName}, un miembro del equipo de ingeniería de IA. Tu especialidad es ${expertise}.
      El Agente Orquestador te ha delegado una tarea.

      **Contexto de la Conversación del Proyecto:**
      ---
      ${historyString}
      ---
      
      **Tu Tarea Actual:**
      Analiza la última solicitud del usuario: "${request}"
      ${task}
      Responde de forma concisa, experta y directa a la solicitud del usuario, desde tu rol. No saludes ni te presentes, ve directo a la respuesta. Tu respuesta se integrará en la conversación de planificación.
    `;
};

// --- AGENTE DE GESTIÓN DE PROYECTOS ---
const ProjectManagementAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Gestión de Proyectos (Product Owner)",
            "la planificación ágil, Scrum, historias de usuario y tareas.",
            "Desglosa la solicitud en 'historias de usuario' o 'tareas' lógicas, o responde a la pregunta de planificación del usuario.",
            request,
            history
        );
    },
    getDailyScrumSummaryPrompt: (context: { storyTitle: string; completed: string[]; inProgress: string[] }): string => {
        const completedString = context.completed.length > 0 ? context.completed.join(', ') : 'Ninguna';
        const inProgressString = context.inProgress.length > 0 ? context.inProgress.join(', ') : 'Ninguna';

        return `
            Eres el Project Manager AI. Tu tarea es generar un resumen conciso para el Daily Scrum del equipo.
            
            **Estado Actual del Sprint:**
            - **Trabajando en la Historia:** "${context.storyTitle}"
            - **Subtareas Completadas:** [${completedString}]
            - **Subtareas Pendientes/En Progreso:** [${inProgressString}]

            **Tu Tarea:**
            Redacta una actualización de estado breve y motivadora. Tu respuesta debe ser un único mensaje de chat.
            1. Menciona el progreso en la historia actual.
            2. Señala cuál es el siguiente foco de atención (las tareas pendientes).
            3. Termina con una nota de ánimo.

            **Ejemplo de Respuesta:**
            "¡Buen progreso en la historia '${context.storyTitle}'! Ya hemos completado las tareas [${completedString}]. Nuestro siguiente objetivo es enfocarnos en [${inProgressString}]. ¡Sigamos con el buen ritmo, equipo!"

            **REQUISITOS DE SALIDA ESTRICTOS:**
            *   La salida DEBE SER EXCLUSIVamente una cadena de texto.
            *   NO incluyas ninguna explicación, introducción o formato JSON.
            *   Tu respuesta debe ser directa y estar lista para ser publicada en el chat.

            Ahora, genera tu resumen del Daily Scrum.
        `;
    }
};


// --- AGENTE DE CONTROL DE VERSIONES ---
const VersionControlAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Control de Versiones",
            "Git, GitHub y las mejores prácticas de versionamiento de código.",
            "Proporciona los comandos de Git necesarios, explica un flujo de trabajo (como GitFlow) o responde a la pregunta sobre control de versiones del usuario.",
            request,
            history
        );
    }
};

export { ProjectManagementAgent, VersionControlAgent };