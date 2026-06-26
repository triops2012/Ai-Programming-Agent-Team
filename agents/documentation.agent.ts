

import { FileNode } from "../types.ts";

// A more detailed stringify function to give the AI better context.
const stringifyFileTree = (nodes: FileNode[], indent = ''): string => {
    let result = '';
    const relevantExtensions = ['.js', '.ts', '.tsx', '.py', '.go', '.html', 'package.json', '.css', '.scss'];

    for (const node of nodes) {
        // Ignore certain files/folders to keep the prompt clean
        if (['node_modules', '.git', 'dist', 'build', 'package-lock.json'].includes(node.name)) {
            continue;
        }

        result += `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name}\n`;
        
        if (node.type === 'folder' && node.children) {
            result += stringifyFileTree(node.children, `${indent}  `);
        } else if (node.type === 'file' && node.content) {
            // Check if the file is relevant and has content to show
            if (relevantExtensions.some(ext => node.name.endsWith(ext))) {
                // Take a snippet of the code to avoid excessively long prompts
                const contentSnippet = node.content.split('\n').slice(0, 15).join('\n');
                const contentLines = contentSnippet.split('\n').map(line => `${indent}  | ${line}`).join('\n');
                result += `${contentLines}\n${indent}  | ...\n`;
            }
        }
    }
    return result;
};


const getPrompt = (fileTree: FileNode[]): string => {
    const projectContext = stringifyFileTree(fileTree);

    return `
      Eres un Agente de Documentación Técnica, un especialista en crear archivos README.md claros, concisos y completos.
      Tu tarea es analizar la estructura de archivos y el código de un proyecto para generar un README.md profesional desde cero.

      **Contexto del Proyecto Actual (Estructura y Fragmentos de Código):**
      ---
      ${projectContext}
      ---

      **Tu Tarea:**
      Genera un archivo \`README.md\` completo en formato Markdown. El documento debe ser bien estructurado y fácil de leer. Ignora cualquier README.md existente y crea uno nuevo basado en el análisis del código. Incluye las siguientes secciones:
      1.  **Título del Proyecto:** Un título adecuado derivado del contexto (ej. basado en package.json o el archivo principal).
      2.  **Descripción:** Un párrafo que resuma el propósito y la funcionalidad principal de la aplicación.
      3.  **Stack Tecnológico:** Una lista de las tecnologías, lenguajes y frameworks clave identificados en el código.
      4.  **Estructura del Proyecto:** Una breve descripción de la organización de los directorios principales (ej. \`src\`, \`components\`, \`api\`).
      5.  **Cómo Empezar:** Pasos esenciales para que otro desarrollador pueda instalar las dependencias y ejecutar el proyecto localmente (ej. \`npm install\`, \`npm start\`).
      6.  **Funcionalidades Clave:** Una lista con viñetas de las características más importantes de la aplicación.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE el contenido del archivo README.md en formato Markdown.
      *   NO incluyas ninguna explicación, introducción o texto fuera del contenido del Markdown.
      *   NO uses bloques de código con \`\`\`markdown al principio o al final.

      Ahora, genera el contenido completo del archivo README.md.
    `;
};

export const DocumentationAgent = {
    getPrompt,
};