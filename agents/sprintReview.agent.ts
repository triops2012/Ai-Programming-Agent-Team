import { Sprint, WorkItem } from "../types.ts";

const getPrompt = (sprint: Sprint, completedItems: WorkItem[]): string => {
    const completedItemsString = completedItems.length > 0
        ? completedItems.map(item =>
            `- **${item.title} (${item.storyPoints || 0} SP):** ${item.description}`
        ).join('\n')
        : "No se completaron historias de usuario en este sprint.";
    
    const totalCompletedPoints = completedItems.reduce((acc, item) => acc + (item.storyPoints || 0), 0);

    return `
      Eres el Scrum Master AI, encargado de facilitar las ceremonias de Scrum. Tu tarea es generar un informe conciso y profesional para la Sprint Review.

      **Contexto del Sprint Finalizado:**
      - **Nombre del Sprint:** ${sprint.name}
      - **Objetivo del Sprint:** ${sprint.goal}
      - **Puntos Comprometidos:** ${sprint.totalStoryPoints} SP
      - **Puntos Completados:** ${totalCompletedPoints} SP

      **Historias de Usuario Completadas:**
      ${completedItemsString}

      **Tu Tarea:**
      Basándote en el contexto anterior, redacta un informe de Sprint Review en formato Markdown. El informe debe ser claro, profesional y estar listo para ser presentado a los stakeholders. Debe incluir:
      1.  Un resumen del rendimiento del sprint (puntos completados vs. comprometidos).
      2.  La lista de historias de usuario que se han completado y que están listas para la demostración.
      3.  Una conclusión breve y una invitación a los stakeholders para que proporcionen su feedback.

      Genera únicamente el contenido del informe en Markdown. No añadas introducciones o conclusiones fuera del propio informe.
    `;
};

export const SprintReviewAgent = {
    getPrompt,
};