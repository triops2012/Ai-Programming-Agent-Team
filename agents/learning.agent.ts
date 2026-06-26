import { AgentName, Sprint } from "../types.ts";

const getPrompt = (retrospectiveSummary: string): string => {
    return `
      Eres un Ingeniero de Conocimiento de IA. Tu tarea es analizar el resumen de una retrospectiva de sprint y extraer lecciones clave, accionables y generalizadas que puedan ser útiles para futuros proyectos, etiquetando cada lección con el especialista más relevante.

      **Resumen de la Retrospectiva:**
      ---
      ${retrospectiveSummary}
      ---

      **Agentes Especialistas Disponibles para Etiquetado:**
      - 'TechLead': Para lecciones sobre arquitectura, patrones de diseño o decisiones tecnológicas de alto nivel.
      - 'UIUXAgent': Para lecciones sobre experiencia de usuario, diseño de interfaces o accesibilidad.
      - 'ReactAgent', 'VueAgent', 'AngularAgent': Para lecciones específicas de frameworks de frontend.
      - 'CSSAgent': Para lecciones sobre estilos, SASS, o metodologías de CSS.
      - 'NodeAPIAgent', 'GoAPIAgent', 'PythonAPIAgent': Para lecciones específicas de tecnologías de backend.
      - 'SQLDatabaseAgent', 'NoSQLDatabaseAgent': Para lecciones sobre modelado de datos, consultas o rendimiento de BBDD.
      - 'TestingAgent': Para lecciones sobre estrategias de pruebas, TDD, o herramientas de testing.
      - 'SecurityAgent': Para lecciones sobre vulnerabilidades, autenticación, o mejores prácticas de seguridad.
      - 'QualityAgent': Para lecciones sobre calidad de código, legibilidad o mantenibilidad.

      **Tu Tarea:**
      1.  **Analiza el Resumen:** Lee atentamente las secciones "Qué fue bien", "Qué se podría mejorar" y "Acciones a tomar".
      2.  **Sintetiza Lecciones:** Extrae de 2 a 4 lecciones fundamentales y generalizadas.
      3.  **Etiqueta Cada Lección:** Para cada lección, asigna el \`agent\` más relevante de la lista de especialistas. Esta etiqueta es CRUCIAL.
      4.  **Genera un JSON:** Ensambla estas lecciones etiquetadas en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "lessons".
      *   El valor de "lessons" debe ser un array de objetos, donde cada objeto sigue esta estructura:
          \`\`\`typescript
          {
              "lesson": "string", // La lección aprendida, generalizada y accionable.
              "agent": "AgentName" // El nombre EXACTO del agente especialista más relevante.
          }
          \`\`\`
      *   Ejemplo de formato de salida:
          \`\`\`json
          {
              "lessons": [
                  {
                      "lesson": "Validar siempre las entradas del usuario tanto en el cliente como en el servidor para prevenir vulnerabilidades de seguridad.",
                      "agent": "SecurityAgent"
                  },
                  {
                      "lesson": "Utilizar componentes de orden superior (HOCs) en React es una forma eficaz de reutilizar la lógica de estado entre componentes.",
                      "agent": "ReactAgent"
                  }
              ]
          }
          \`\`\`
      
      Ahora, basándote en el resumen de la retrospectiva, genera el objeto JSON con las lecciones aprendidas y etiquetadas.
    `;
};

const getErrorLearningPrompt = (
    agentName: AgentName, 
    errorCodeSnippet: string, 
    errorDescription: string, 
    suggestedFix: string
): string => {
    return `
      Eres un Ingeniero de Conocimiento de IA. Tu tarea es analizar un error de código detectado durante una revisión de pares y generalizarlo en una lección de conocimiento accionable y preventiva.

      **Contexto del Error:**
      - **Agente que cometió el error:** ${agentName}
      - **Descripción del Error:** ${errorDescription}
      - **Fragmento de Código con Error:**
        \`\`\`
        ${errorCodeSnippet}
        \`\`\`
      - **Solución Sugerida:** ${suggestedFix}

      **Tu Tarea:**
      1.  **Analiza el Error:** Comprende la causa raíz del problema. No es solo un error de sintaxis, es un error conceptual o de 'mala práctica'.
      2.  **Generaliza la Lección:** Crea una lección que no solo solucione este caso específico, sino que enseñe el principio subyacente para evitar errores similares en el futuro. La lección debe ser formulada como un 'Anti-Patrón' o una 'Mejor Práctica'.
      3.  **Genera un JSON:** Ensambla la lección en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "lesson".
      *   El valor de "lesson" debe ser un objeto con esta estructura:
          \`\`\`typescript
          {
              "lesson": "string", // La lección generalizada y accionable.
              "agent": "${agentName}" // El nombre EXACTO del agente que cometió el error.
          }
          \`\`\`
      *   Ejemplo de formato de salida:
          \`\`\`json
          {
              "lesson": {
                  "lesson": "Anti-Patrón: Evitar la mutación directa del estado en React (ej. 'state.key = value'). Utilizar siempre los setters ('setState') con técnicas de inmutabilidad (spread operator, 'map', 'filter') para prevenir bugs de renderizado.",
                  "agent": "ReactAgent"
              }
          }
          \`\`\`
      
      Ahora, basándote en el error de código, genera el objeto JSON con la lección aprendida.
    `;
};

const getConsolidatedLearningPrompt = (completedSprints: Sprint[]): string => {
    const sprintHistory = completedSprints.map(s => `
      - Sprint: ${s.name}
        - Objetivo: ${s.goal}
        - Resumen de la Retrospectiva: ${s.retrospectiveSummary || 'No hay resumen disponible.'}
    `).join('\n');

    return `
      Eres un Coach de Mejora Continua de IA. Tu misión es analizar el historial de retrospectivas de un proyecto para identificar **patrones de problemas recurrentes** y proponer de forma proactiva nuevas Historias de Usuario para mejorar el proceso de desarrollo.

      **Historial de Sprints Completados y sus Retrospectivas:**
      ---
      ${sprintHistory}
      ---

      **Tu Tarea:**
      1.  **Analiza el Historial:** Lee todas las retrospectivas y busca temas o problemas que se repiten. ¿Hay una tendencia a subestimar tareas de un tipo específico? ¿Problemas de comunicación recurrentes? ¿Dificultades técnicas consistentes?
      2.  **Identifica un Patrón Clave:** Si encuentras un patrón significativo, identifícalo. Si no hay patrones claros, puedes indicarlo.
      3.  **Propón Historias de Mejora:** Si identificaste un patrón, crea 1 o 2 nuevas Historias de Usuario (HU) accionables que, de ser implementadas, podrían mitigar este problema en el futuro. Estas HU deben ser agregadas al Product Backlog.
          -   Ejemplo de HU de mejora: "Como desarrollador, quiero una plantilla de tareas estandarizada para historias de API para asegurar que no se olviden los pasos de documentación y pruebas."
      4.  **Genera un JSON:** Empaqueta tu análisis y las nuevas historias de usuario en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener dos claves: "analysis" (string) y "improvementStories" (un array de objetos).
      *   La estructura de cada objeto en "improvementStories" debe ser: \`{ "title": "string", "description": "string" }\`.
      *   Si no se encuentran patrones, "analysis" debe indicarlo y "improvementStories" debe ser un array vacío.

      **Ejemplo de formato de salida:**
      \`\`\`json
      {
          "analysis": "He notado un patrón recurrente de subestimación en las historias de usuario que involucran integraciones de API de terceros. Esto ha causado retrasos en los dos últimos sprints.",
          "improvementStories": [
              {
                  "title": "Investigar y documentar un proceso estándar para integraciones de API de terceros",
                  "description": "Como desarrollador, quiero una guía clara y una checklist para abordar integraciones con APIs externas, para poder estimar el esfuerzo de forma más precisa y reducir los imprevistos."
              }
          ]
      }
      \`\`\`

      Ahora, basándote en el historial de retrospectivas, genera el objeto JSON con tu análisis y las posibles historias de mejora.
    `;
};

const getTechLeadInterventionLearningPrompt = (
    subTask: { agent: AgentName, task: string },
    failedCode: string,
    reviewFeedback: string,
    techLeadSolution: string
): string => {
    return `
      Eres un Ingeniero de Conocimiento de IA de élite. Tu tarea es analizar una intervención experta de un Líder Técnico y destilarla en una lección de conocimiento ("Lesson RAG") de alto impacto, generalizada y preventiva.

      **Contexto Completo del Fallo y Resolución:**
      - **Agente Original:** ${subTask.agent}
      - **Tarea Original:** ${subTask.task}
      - **Feedback de Revisión (que causó el fallo):**
        ---
        ${reviewFeedback}
        ---
      - **Solución Experta del Líder Técnico:**
        ---
        ${techLeadSolution}
        ---

      **Tu Tarea:**
      1.  **Analiza la Situación Completa:** Tienes el problema y la solución definitiva. Identifica el principio fundamental que el agente junior no entendió.
      2.  **Generaliza la Lección:** Crea una lección que vaya más allá de este caso específico. Debe ser una 'Mejor Práctica' o un 'Anti-Patrón' que el \`${subTask.agent}\` pueda usar en el futuro para evitar errores similares. La lección debe ser atemporal y conceptual.
      3.  **Genera un JSON:** Ensambla la lección en un objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "lesson".
      *   El valor de "lesson" debe ser un objeto con esta estructura:
          \`\`\`typescript
          {
              "lesson": "string", // La lección de alto impacto, generalizada y accionable.
              "agent": "${subTask.agent}" // El nombre EXACTO del agente original.
          }
          \`\`\`
      *   **Ejemplo de Lección de Alto Impacto:**
          "Anti-Patrón: Evitar la mutación directa del estado en React. Utilizar siempre los setters ('setState') con técnicas de inmutabilidad (spread operator) para prevenir bugs de renderizado. La intervención del Tech Lead sobre el estado obsoleto refuerza este principio."

      Ahora, basándote en la intervención del Líder Técnico, genera el objeto JSON con la lección de alto impacto.
    `;
};


export const LearningAgent = {
    getPrompt,
    getErrorLearningPrompt,
    getConsolidatedLearningPrompt,
    getTechLeadInterventionLearningPrompt,
};