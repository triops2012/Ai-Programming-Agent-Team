import { ChatMessage, Sprint } from "../types.ts";

const getInitialPrompt = (): ChatMessage => {
    return {
        author: 'agent',
        content: `¡Gran trabajo en este sprint! Ahora, tomémonos un momento para la retrospectiva. Reflexionemos para mejorar en el siguiente.\n\nEmpecemos con la primera pregunta: **¿Qué fue bien durante este sprint?**`
    };
};

const getNextPrompt = (history: ChatMessage[]): ChatMessage | { summary: string } => {
    const userResponses = history.filter(m => m.author === 'user');
    
    switch (userResponses.length) {
        case 1:
            return {
                author: 'agent',
                content: `Excelente. Es bueno reconocer los éxitos.\n\nAhora, la segunda pregunta: **¿Qué se podría haber hecho mejor o qué impedimentos encontramos?**`
            };
        case 2:
            return {
                author: 'agent',
                content: `Gracias por la honestidad. Identificar áreas de mejora es clave.\n\nFinalmente, la pregunta más importante: **¿Qué acciones concretas podemos tomar para mejorar en el próximo sprint?**`
            };
        case 3:
            const wentWell = userResponses[0].content;
            const couldBeBetter = userResponses[1].content;
            const actionItems = userResponses[2].content;

            const summary = `
## Resumen de la Retrospectiva

### ✅ ¿Qué fue bien?
${wentWell}

### 🤔 ¿Qué se podría mejorar?
${couldBeBetter}

### 🚀 Acciones a tomar
${actionItems}
            `;
            return { summary };
        default:
             return {
                author: 'agent',
                content: `Parece que hemos terminado. ¿Estás listo para finalizar la retrospectiva?`
            };
    }
};

const getAutonomousSummaryPrompt = (sprint: Sprint): string => {
    const completedItems = sprint.workItems.filter(wi => wi.status === 'done');
    const incompleteItems = sprint.workItems.filter(wi => wi.status !== 'done');

    const completedString = completedItems.length > 0
        ? completedItems.map(i => `- ${i.title} (${i.storyPoints || 0} SP)`).join('\n')
        : 'Ninguna.';
    
    const incompleteString = incompleteItems.length > 0
        ? incompleteItems.map(i => `- ${i.title} (${i.storyPoints || 0} SP)`).join('\n')
        : 'Ninguna.';

    return `
      Eres el Scrum Master AI, facilitando una retrospectiva de sprint automatizada para el equipo de desarrollo de IA. El objetivo es generar un resumen realista y útil para el Agente de Aprendizaje.

      **Contexto del Sprint Finalizado:**
      - **Objetivo:** ${sprint.goal}
      - **Puntos Completados:** ${sprint.completedStoryPoints} / ${sprint.totalStoryPoints}
      - **Historias Completadas:**
      ${completedString}
      - **Historias No Completadas:**
      ${incompleteString}

      **Tu Tarea:**
      Actúa como si fueras el equipo entero reflexionando sobre el sprint. Genera un resumen de retrospectiva conciso en formato Markdown. Simula una reflexión realista basada en los resultados.
      1.  **¿Qué fue bien?:** Si el sprint fue exitoso (la mayoría de los puntos completados), enfócate en la eficiencia, la buena planificación del TechLead, etc. Si no, enfócate en pequeñas victorias.
      2.  **¿Qué se podría mejorar?:** Si hubo historias incompletas, reflexiona sobre por qué. ¿Subestimación de la complejidad? ¿Dependencias inesperadas? ¿Errores en la revisión? Sé específico.
      3.  **Acciones a tomar:** Propón 1 o 2 acciones concretas y accionables para el próximo sprint que aborden los puntos de mejora.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE el resumen en formato Markdown.
      *   NO incluyas ninguna explicación o texto introductorio.
      *   El formato debe ser EXACTAMENTE el siguiente:
      
      ## Resumen de la Retrospectiva

      ### ✅ ¿Qué fue bien?
      [Tu análisis aquí]

      ### 🤔 ¿Qué se podría mejorar?
      [Tu análisis aquí]

      ### 🚀 Acciones a tomar
      [Tus acciones aquí]

      Ahora, genera el resumen de la retrospectiva.
    `;
};

export const RetrospectiveAgent = {
    getInitialPrompt,
    getNextPrompt,
    getAutonomousSummaryPrompt,
};