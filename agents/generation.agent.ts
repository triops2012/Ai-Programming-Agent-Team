import { ChatMessage, ProductBacklogItem, Epic, Team } from "../types.ts";

const getPrompt = (conversationHistory: ChatMessage[]): string => {
    const conversationString = conversationHistory.map(m => `${m.author === 'user' ? 'Usuario' : 'Agente Arquitecto'}: ${m.content}`).join('\n\n');

    return `
      Eres un equipo de ingeniería de software de IA de élite, especializado en **Gestión de Proyectos Ágil**. Tu ÚNICA tarea es tomar la siguiente conversación de planificación y generar los artefactos de gestión iniciales para el proyecto.

      **Contexto y Plan Aprobado:**
      ---
      ${conversationString}
      ---

      **Tu Tarea:**
      1.  **Analiza la conversación** y define una estructura de equipos lógica para este proyecto (ej. "Equipo Frontend", "Equipo Backend"). Usualmente 2 o 3 equipos son suficientes.
      2.  **Identifica Colaboraciones:** CRÍTICO - Si una historia requiere el trabajo de más de un equipo para completarse (ej. una feature que necesita UI y API), debes declararlo.
      3.  **Identifica Dependencias:** Si una historia no puede empezar hasta que otra esté terminada, debes declararlo.
      4.  **Genera \`PRODUCT_BACKLOG.md\`**: Este es el artefacto más importante. Desglosa CADA funcionalidad en una 'Historia de Usuario' bien formada. Asigna cada historia al equipo más apropiado. Usa el siguiente formato estricto de Markdown.

          \`\`\`markdown
          # Product Backlog

          ## Epic: [Nombre del Epic, ej: Gestión de Usuarios]

          ### HU-1: [Título de la Historia]
          - **Equipo Principal:** [Nombre del Equipo que lidera la historia]
          - **Colaboradores:** [Lista de otros equipos implicados, ej: Equipo Frontend, o "Ninguno"]
          - **Descripción:** Como [tipo de usuario], quiero [acción] para que [beneficio].
          - **Criterios de Aceptación:**
            - [ ] Criterio 1
            - [ ] Criterio 2
          - **Story Points:** [Estimación numérica, ej: 3, 5, 8]
          - **Dependencias:** [Lista de IDs de HU, ej: HU-2, HU-3, o "Ninguna"]

          ### HU-2: [Título de la Otra Historia]
          ...
          \`\`\`
          *Crea tantas historias y epics como sea necesario para cubrir TODO el plan.*

      5.  **Genera otros archivos de gestión**:
          *   **\`ROADMAP.md\`**: Un documento de alto nivel que describe la visión del producto a futuro (v1.1, v2.0).
          *   **\`CHANGELOG.md\`**: Un registro de cambios que comience con la versión 1.0.0.
          *   **\`README.md\`**: Un README.md completo con el título del proyecto y una breve descripción basada en la conversación.

      **REQUISITOS DE SALIDA ESTRICTOS:**
      *   La salida DEBE SER EXCLUSIVAMENTE un objeto JSON.
      *   No incluyas ningún texto o markdown fuera del objeto JSON.
      *   El objeto JSON raíz debe tener una única clave: "files".
      *   El valor de "files" debe ser un array de objetos FileNode: \`{ name, type, content?, children? }\`.
      *   **¡MUY IMPORTANTE! Asegúrate de que el JSON sea sintácticamente perfecto. Presta especial atención a escapar correctamente las comillas dobles (\\") y los saltos de línea (\\n) dentro de los strings de la propiedad \`content\`. Un JSON inválido romperá la aplicación.**
      *   **NO GENERES NINGÚN CÓDIGO FUENTE (HTML, CSS, JS, etc.). Tu única responsabilidad son los archivos de gestión mencionados arriba.**
      
      Genera ahora el objeto JSON completo solo con los archivos de gestión de proyecto.
    `;
};

const parseBacklog = (content: string): { pbis: ProductBacklogItem[], epics: Epic[], teams: Team[] } => {
    const pbis: ProductBacklogItem[] = [];
    const epics: Epic[] = [];
    const teamsMap = new Map<string, Team>();
    let currentEpic: Epic | null = null;

    const lines = content.split('\n');
    let currentPbi: Partial<ProductBacklogItem> & { epicId?: string } = {};
    
    const getTeamId = (teamName: string): string => {
        if (!teamsMap.has(teamName)) {
            const newId = `team-${teamsMap.size + 1}`;
            teamsMap.set(teamName, {
                id: newId,
                name: teamName,
                activeSprint: null,
                completedSprints: []
            });
            return newId;
        }
        return teamsMap.get(teamName)!.id;
    };

    for (const line of lines) {
        const epicMatch = line.match(/^## Epic: (.*)/);
        if (epicMatch) {
            const epicTitle = epicMatch[1].trim();
            currentEpic = {
                id: `epic-${Date.now()}-${epics.length}`,
                title: epicTitle,
                description: `Epic relacionado con ${epicTitle}`
            };
            epics.push(currentEpic);
            continue;
        }

        const pbiMatch = line.match(/^### (HU-\d+): (.*)/);
        if (pbiMatch) {
            if (currentPbi.id) {
                pbis.push(currentPbi as ProductBacklogItem);
            }
            currentPbi = {
                id: pbiMatch[1].trim(),
                title: pbiMatch[2].trim(),
                description: '',
                acceptanceCriteria: [],
                storyPoints: null,
                dependencies: [],
                collaboratorTeamIds: [],
                epicId: currentEpic?.id
            };
            continue;
        }
        
        const primaryTeamMatch = line.match(/^- \*\*Equipo( Principal)?:\*\* (.*)/);
        if (primaryTeamMatch && currentPbi) {
            const teamName = primaryTeamMatch[2].trim();
            currentPbi.primaryTeamId = getTeamId(teamName);
            continue;
        }

        const collaboratorsMatch = line.match(/^- \*\*Colaboradores:\*\* (.*)/);
        if (collaboratorsMatch && currentPbi) {
            const collaboratorsString = collaboratorsMatch[1].trim();
            if (collaboratorsString.toLowerCase() !== 'ninguno') {
                currentPbi.collaboratorTeamIds = collaboratorsString.split(',').map(name => getTeamId(name.trim()));
            }
            continue;
        }
        
        const descMatch = line.match(/^- \*\*Descripción:\*\* (.*)/);
        if (descMatch && currentPbi) {
            currentPbi.description = descMatch[1].trim();
            continue;
        }

        const acMatch = line.match(/^- \[\s*\] (.*)/);
        if (acMatch && currentPbi.acceptanceCriteria) {
            currentPbi.acceptanceCriteria.push({ text: acMatch[1].trim(), completed: false });
            continue;
        }

        const spMatch = line.match(/^- \*\*Story Points:\*\* (.*)/);
        if (spMatch && currentPbi) {
            currentPbi.storyPoints = parseInt(spMatch[1].trim(), 10) || null;
            continue;
        }

        const depsMatch = line.match(/^- \*\*Dependencias:\*\* (.*)/);
        if (depsMatch && currentPbi) {
            const depsString = depsMatch[1].trim();
            if (depsString.toLowerCase() !== 'ninguna') {
                currentPbi.dependencies = depsString.split(',').map(d => d.trim());
            }
            continue;
        }
    }

    if (currentPbi.id) {
        pbis.push(currentPbi as ProductBacklogItem);
    }

    return { pbis, epics, teams: Array.from(teamsMap.values()) };
};


export const GenerationAgent = {
    getPrompt,
    parseBacklog,
};