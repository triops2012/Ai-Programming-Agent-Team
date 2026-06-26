
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

// --- AGENTE DE CALIDAD Y REVISORÍA ---
const QualityReviewAgent = {
    getPrompt: (request: string, history: ChatMessage[]): string => {
        return createSpecialistPrompt(
            "Agente de Calidad y Revisoría",
            "las mejores prácticas de codificación, seguridad y revisión de código.",
            "Analiza la solicitud o el código proporcionado en el historial y sugiere mejoras de calidad, seguridad o rendimiento. No generes código, solo da recomendaciones.",
            request,
            history
        );
    }
};

export { QualityReviewAgent };