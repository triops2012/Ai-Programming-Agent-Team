import { ProductBacklogItem } from "../types.ts";

const getPrioritizationPrompt = (backlog: ProductBacklogItem[], projectGoal: string): string => {
    const backlogString = backlog.map(item => `- ${item.id}: ${item.title} (${item.storyPoints || '?'} SP)`).join('\n');

    return `
      Eres el Product Owner AI. Tu misión es maximizar el valor del producto gestionando y priorizando el Product Backlog.

      **Objetivo General del Proyecto:**
      ---
      ${projectGoal}
      ---

      **Product Backlog Actual (Sin Orden Específico):**
      ---
      ${backlogString}
      ---
      
      **Tu Tarea:**
      1.  **Analiza:** Revisa el backlog y el objetivo del proyecto.
      2.  **Prioriza:** Determina el orden más lógico y que aporte más valor para implementar las historias de usuario. Considera las dependencias y la construcción de funcionalidades incrementales.
      3.  **Razona:** Escribe una breve explicación (2-3 frases) de tu estrategia de priorización. ¿Por qué has elegido este orden?
      4.  **Genera JSON:** Empaqueta tu razonamiento y la lista de IDs de las historias de usuario en el nuevo orden en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVamente un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener dos claves: "reasoning" (string) y "prioritizedBacklog" (un array de strings con los IDs de las historias en el nuevo orden).
      *   Ejemplo de formato de salida:
          \`\`\`json
          {
              "reasoning": "He priorizado la historia de autenticación (HU-3) primero, ya que es un bloqueador para el resto de funcionalidades personalizadas. A continuación, la funcionalidad principal (HU-2) para entregar valor rápidamente.",
              "prioritizedBacklog": ["HU-3", "HU-2", "HU-5", "HU-4"]
          }
          \`\`\`

      Ahora, genera el objeto JSON con tu plan de priorización.
    `;
};

const getSprintOptionsPrompt = (prioritizedBacklog: ProductBacklogItem[], projectGoal: string, teamVelocity: number): string => {
    const backlogString = prioritizedBacklog.map(item => `- ${item.id}: ${item.title} (${item.storyPoints || 0} SP). Dependencias: [${item.dependencies?.join(', ') || 'ninguna'}]`).join('\n');
    const velocity = teamVelocity > 0 ? teamVelocity : 10; // Use a default velocity if none exists

    return `
      Eres un Product Owner y un Scrum Master experto en IA. Tu misión es analizar el backlog y proponer **tres (3) opciones de sprint distintas y estratégicas** para que el usuario elija.

      **Objetivo General del Proyecto:**
      ---
      ${projectGoal}
      ---
      
      **Velocidad del Equipo (Puntos del último sprint):** ~${velocity} SP

      **Product Backlog Priorizado (con dependencias):**
      ---
      ${backlogString}
      ---
      
      **Tu Tarea:**
      1.  **Analiza el Backlog:** Revisa las historias, sus puntos y, MUY IMPORTANTE, sus dependencias.
      2.  **Crea 3 Opciones de Sprint:** Diseña tres planes de sprint diferentes. Cada plan debe ser un conjunto coherente de historias.
          *   **Validez:** Un sprint es válido si todas las dependencias de una historia están también en el sprint o ya han sido completadas (no están en el backlog).
          *   **Capacidad:** La suma de Story Points de cada opción debe ser cercana (pero no necesariamente inferior) a la velocidad del equipo.
          *   **Estrategia:** Cada opción debe tener un enfoque estratégico diferente. Por ejemplo:
              - **Opción 1 (Segura/Fundacional):** Enfocada en desbloquear dependencias futuras o en la funcionalidad más crítica.
              - **Opción 2 (Valor al Usuario):** Agrupa historias que entregan una funcionalidad visible y completa para el usuario.
              - **Opción 3 (Técnica/Ambiciosa):** Quizás incluye algo de deuda técnica o una historia más compleja y de alto riesgo/recompensa.
      3.  **Genera JSON:** Empaqueta estas tres opciones en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una clave: "sprintOptions".
      *   El valor de "sprintOptions" debe ser un array con exactamente 3 objetos.
      *   Cada objeto debe tener esta estructura:
          \`\`\`typescript
          {
            "title": "string", // Un título estratégico, ej: "Opción A: Foco en Autenticación"
            "description": "string", // 1-2 frases explicando la estrategia.
            "storyIds": ["string"], // Array de IDs de las historias seleccionadas.
            "totalStoryPoints": number // Suma de los Story Points.
          }
          \`\`\`
      *   Asegúrate de que el JSON sea válido.

      Ahora, genera el objeto JSON con tus tres propuestas de sprint.
    `;
};


export const ProductOwnerAgent = {
    getPrioritizationPrompt,
    getSprintOptionsPrompt,
};