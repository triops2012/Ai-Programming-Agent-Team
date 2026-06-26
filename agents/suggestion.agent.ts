
interface PlanningContext {
    initialIdea: string;
    acceptedSuggestions: { title: string; description: string }[];
}

const getPrompt = (initialIdea: string): string => {
    return `
      Eres un Arquitecto de Soluciones de IA de élite. Tu objetivo es analizar la idea inicial de un usuario y proponer un conjunto de mejoras y características concretas para convertirla en un proyecto de software robusto y bien definido. Tu respuesta DEBE ser un objeto JSON VÁLIDO y NADA MÁS.

      **Idea Inicial del Usuario:**
      "${initialIdea}"

      **Tu Tarea:**
      1.  **Analiza la Idea:** Desglosa la idea del usuario en sus componentes fundamentales.
      2.  **Genera Sugerencias Clave:** Crea una lista de 4 a 6 sugerencias de alto impacto. Cada sugerencia debe ser una característica, una mejora tecnológica o una recomendación de UX/UI.
      3.  **Estructura Cada Sugerencia:** Cada sugerencia debe tener un \`title\` (título corto y descriptivo) y una \`description\` (una explicación de 1-2 frases sobre qué es y por qué es valiosa).

      **REQUISITOS DE SALIDA CRÍTICOS Y ESTRICTOS:**
      *   **SÓLO JSON:** Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON. No añadas NINGÚN texto antes o después del JSON. No escribas "Aquí está el JSON:" ni nada similar.
      *   **SIN MARKDOWN:** NO envuelvas el objeto JSON en un bloque de código markdown (como \`\`\`json ... \`\`\`).
      *   **ESTRUCTURA EXACTA:** El objeto JSON raíz debe tener una única clave: "suggestions".
      *   **CONTENIDO de "suggestions"**: El valor de "suggestions" debe ser un array de objetos. Cada objeto debe tener exactamente dos claves: "title" (string) y "description" (string).
      *   **VALIDACIÓN:** Asegúrate de que el JSON sea sintácticamente perfecto y completo. Presta atención a las comas (no pongas comas al final de las listas) y a usar siempre comillas dobles ("). DEBES incluir todos los corchetes y llaves de cierre.

      **Ejemplo de la ÚNICA Y EXACTA SALIDA que debes producir:**
      {
        "suggestions": [
          {
            "title": "Autenticación de Usuarios",
            "description": "Implementar un sistema de registro e inicio de sesión para que los usuarios puedan tener perfiles y datos personalizados."
          },
          {
            "title": "Base de Datos Escalable",
            "description": "Utilizar una base de datos como Firestore o Supabase para almacenar los datos de la aplicación de forma segura y escalable."
          }
        ]
      }

      Ahora, genera EXCLUSIVAMENTE el objeto JSON completo con tus sugerencias, basándote en la idea inicial del usuario.
    `;
};

const getMoreSuggestionsPrompt = (context: PlanningContext): string => {
    const acceptedSuggestionsString = context.acceptedSuggestions.map(s => `- ${s.title}: ${s.description}`).join('\n');

    return `
      Eres un Arquitecto de Soluciones de IA de élite. Estás en una sesión de brainstorming para definir un proyecto. El usuario ya ha aceptado un conjunto inicial de características. Tu respuesta DEBE ser un objeto JSON VÁLIDO y NADA MÁS.

      **Idea Inicial del Usuario:**
      "${context.initialIdea}"

      **Sugerencias Ya Aceptadas:**
      ${acceptedSuggestionsString}

      **Tu Tarea:**
      1.  **Analiza el Contexto:** Revisa la idea inicial y las sugerencias ya aceptadas.
      2.  **Genera Nuevas Sugerencias:** Propón de 3 a 5 **nuevas** sugerencias que complementen o expandan el plan actual. NO repitas las ideas ya aceptadas. Piensa en el siguiente paso lógico del proyecto.
      3.  **Estructura Cada Sugerencia:** Cada nueva sugerencia debe tener un \`title\` y una \`description\`.

      **REQUISITOS DE SALIDA CRÍTICOS Y ESTRICTOS:**
      *   **SÓLO JSON:** Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON. No añadas NINGÚN texto antes o después del JSON.
      *   **SIN MARKDOWN:** NO envuelvas el objeto JSON en un bloque de código markdown (como \`\`\`json ... \`\`\`).
      *   **ESTRUCTURA EXACTA:** El objeto JSON raíz debe tener una única clave: "suggestions", que es un array de objetos.
      *   **CONTENIDO de "suggestions"**: Cada objeto en el array debe tener exactamente dos claves: "title" (string) y "description" (string).
      *   **VALIDACIÓN:** El JSON debe ser sintácticamente perfecto y completo (comillas dobles, sin comas finales, todas las llaves y corchetes de cierre).

      **Ejemplo de la ÚNICA Y EXACTA SALIDA que debes producir:**
      {
        "suggestions": [
          {
            "title": "Notificaciones Push",
            "description": "Añadir un sistema de notificaciones para mantener a los usuarios informados sobre eventos importantes."
          },
          {
            "title": "Panel de Administración",
            "description": "Crear un panel interno para que los administradores puedan gestionar usuarios y contenido."
          }
        ]
      }

      Ahora, basándote en el contexto actual del proyecto, genera EXCLUSIVAMENTE el objeto JSON completo con **nuevas** sugerencias.
    `;
};


export const SuggestionAgent = {
    getPrompt,
    getMoreSuggestionsPrompt,
};