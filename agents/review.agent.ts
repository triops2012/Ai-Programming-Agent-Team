import { FileNode } from "../types.ts";

const stringifyFileTree = (nodes: FileNode[], indent = ''): string => {
    let result = '';
    for (const node of nodes) {
        result += `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
        if (node.type === 'folder' && node.children) {
            result += stringifyFileTree(node.children, `${indent}  `);
        } else if (node.type === 'file' && node.content) {
            const contentLines = node.content.split('\n').map(line => `${indent}  | ${line}`).join('\n');
            result += `${contentLines}\n`;
        }
    }
    return result;
};

const getPrompt = (fileTree: FileNode[], author: 'AI' | 'User' = 'AI'): string => {
    const projectContext = stringifyFileTree(fileTree);
    const authorContext = author === 'User' 
        ? "El siguiente código ha sido escrito o modificado por un desarrollador humano." 
        : "El siguiente código ha sido generado por el equipo de IA.";

    return `
      Eres un equipo de revisión de software de IA de élite, compuesto por:
      1.  **Experto en Seguridad:** Analizas en busca de vulnerabilidades (XSS, inyección de SQL, etc.).
      2.  **Ingeniero de Rendimiento:** Buscas cuellos de botella, código ineficiente y optimizaciones.
      3.  **Especialista en UX/UI:** Evalúas si la interfaz es intuitiva y accesible.

      ${authorContext}

      **Contexto del Proyecto Actual (Código y Estructura):**
      ---
      ${projectContext}
      ---

      **Tu Tarea:**
      1.  **Analiza Colectivamente:** Cada especialista debe revisar el proyecto desde su perspectiva.
      2.  **Genera Sugerencias:** Cread una lista de 3 a 5 sugerencias de mejora concretas y accionables. Cada sugerencia debe ser clara y explicar el "porqué" de la mejora.
      3.  **Empaqueta en JSON:** Ensamblad vuestras sugerencias en un único objeto JSON.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto, explicación o formato de markdown (como \`\`\`json) fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "suggestions".
      *   El valor de "suggestions" debe ser un array de objetos, donde cada objeto tiene una única clave "text" que contiene la sugerencia.
      *   Ejemplo de formato de salida:
          \`\`\`json
          {
              "suggestions": [
                  { "text": "Mejora de seguridad: Sanitizar la entrada del usuario en el formulario de contacto para prevenir ataques XSS." },
                  { "text": "Optimización de rendimiento: Implementar carga diferida (lazy loading) para las imágenes de la galería para acelerar el tiempo de carga inicial." },
                  { "text": "Mejora de UX: Añadir un indicador de carga más visible durante las llamadas a la API para mejorar la retroalimentación al usuario." }
              ]
          }
          \`\`\`
      
      Ahora, basándote en el análisis del proyecto, genera el objeto JSON con vuestras sugerencias.
    `;
};

export const ReviewAgent = {
    getPrompt,
};