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
      Responde de forma concisa, experta y directa a la solicitud del usuario, desde tu rol. No saludes ni te presentes, ve directo a la respuesta. Tu respuesta se integrará en la conversación de planificación. Si tu respuesta incluye código, usa formato markdown.
    `;
};

// --- AGENTE DE BASES DE DATOS ---
const DatabaseAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Bases de Datos",
            "el diseño de esquemas de bases de datos, SQL y NoSQL (MariaDB, Firestore).",
            "Genera un esquema de base de datos, escribe una consulta SQL o proporciona una recomendación sobre la mejor tecnología de base de datos para el proyecto actual.",
            request,
            history
        );
    }
};

// --- AGENTE DE ESTRUCTURA DE DATOS ---
const DataStructureAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Estructura de Datos",
            "el manejo de datos en formatos como JSON y XML, y el diseño de APIs RESTful.",
            "Proporciona un ejemplo de la estructura JSON/XML solicitada, o diseña los endpoints para una API RESTful relacionada con el proyecto.",
            request,
            history
        );
    }
};

// --- AGENTE DE ALTO RENDIMIENTO ---
const HighPerformanceAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Alto Rendimiento",
            "la optimización de código en lenguajes como Python y C++.",
            "Proporciona un fragmento de código optimizado en Python o C++ para la tarea solicitada, o explica una técnica de optimización relevante.",
            request,
            history
        );
    }
};

export { DatabaseAgent, DataStructureAgent, HighPerformanceAgent };