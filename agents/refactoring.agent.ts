import { FileNode } from "../types.ts";

const stringifyFileTreeForAnalysis = (nodes: FileNode[], indent = ''): string => {
    let result = '';
    const relevantExtensions = ['.js', '.ts', '.tsx', '.py', '.go', '.java', '.cs', '.css', '.scss', '.sql'];

    for (const node of nodes) {
        if (['node_modules', '.git', 'dist', 'build'].includes(node.name) || node.name.includes('.ole_')) {
            continue;
        }

        result += `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
        
        if (node.type === 'folder' && node.children) {
            result += stringifyFileTreeForAnalysis(node.children, `${indent}  `);
        } else if (node.type === 'file' && node.content) {
            if (relevantExtensions.some(ext => node.name.endsWith(ext))) {
                const contentLines = node.content.split('\n').map(line => `${indent}  | ${line}`).join('\n');
                result += `${contentLines}\n`;
            }
        }
    }
    return result;
};

const getPrompt = (fileTree: FileNode[]): string => {
    const projectContext = stringifyFileTreeForAnalysis(fileTree);

    return `
      Eres un Ingeniero de Software Senior especializado en Calidad de Código y Refactorización. Tu misión es analizar una base de código completa en busca de "deuda técnica", "code smells" y oportunidades de mejora para hacer el código más limpio, mantenible y eficiente.

      **Contexto del Proyecto Actual (Código y Estructura):**
      ---
      ${projectContext}
      ---

      **Tu Tarea:**
      1.  **Analiza Holísticamente:** Revisa todo el proyecto en busca de problemas comunes de calidad de código:
          *   **Código Duplicado (DRY):** ¿Hay bloques de código idénticos o muy similares que puedan ser abstraídos en una función o componente?
          *   **Funciones/Métodos Largos:** ¿Hay funciones que hacen demasiadas cosas? (Violación del Principio de Responsabilidad Única - SRP).
          *   **Nombres Poco Claros:** ¿Son los nombres de las variables, funciones y clases descriptivos?
          *   **Complejidad Ciclomática Alta:** ¿Hay funciones con demasiadas sentencias anidadas \`if/else/switch\` que sean difíciles de entender y probar?
          *   **Acoplamiento Fuerte:** ¿Hay módulos o componentes que dependen demasiado unos de otros?
      2.  **Genera Sugerencias Accionables:** Crea una lista de 3 a 5 sugerencias de refactorización concretas. Cada sugerencia debe explicar claramente el problema y proponer una solución.
      3.  **Empaqueta en JSON:** Ensambla tus sugerencias en un único objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "suggestions".
      *   El valor de "suggestions" debe ser un array de objetos, donde cada objeto tiene una única clave "text".
      *   Ejemplo de formato de salida:
          \`\`\`json
          {
              "suggestions": [
                  { "text": "Refactorización (DRY): Las funciones 'getUserData' y 'getAdminData' tienen lógica duplicada de manejo de errores. Abstraerla a una función 'handleApiError' reutilizable." },
                  { "text": "Código Limpio (SRP): El componente 'UserProfile.tsx' maneja la lógica de la API y la renderización. Separar la lógica de la API en un custom hook 'useUserProfile'." },
                  { "text": "Mantenibilidad: La función 'calculateTotal' tiene una complejidad ciclomática alta. Refactorizar usando un patrón de estrategia o un 'map' para simplificar la lógica." }
              ]
          }
          \`\`\`
      
      Ahora, basándote en el análisis del proyecto, genera el objeto JSON con tus sugerencias de refactorización.
    `;
};

export const RefactoringAgent = {
    getPrompt,
};