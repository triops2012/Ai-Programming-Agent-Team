# Proyecto Atenea: Manifiesto de Arquitectura y Especificación Técnica

**Versión:** 1.0
**Estado:** Borrador

## 1. Visión y Principios Fundamentales

### 1.1. Visión del Producto

El **Proyecto Atenea** es un entorno de desarrollo integrado y autónomo (AIDE - Autonomous Integrated Development Environment) diseñado para transformar ideas de alto nivel en aplicaciones de software funcionales y listas para producción. Actúa como una "fundición de software" donde un usuario proporciona la visión del producto, y un ecosistema de agentes de IA colaborativos se encarga de todo el ciclo de vida del desarrollo: planificación, diseño de arquitectura, codificación, revisión, pruebas y despliegue.

### 1.2. Principios de Diseño Arquitectónico

1.  **Autonomía Orquestada:** El sistema opera de forma autónoma una vez que se inicia un sprint, pero sus acciones son transparentes y pueden ser guiadas por la intervención humana (el usuario como Product Owner).
2.  **Especialización y Colaboración:** Al igual que un equipo de desarrollo humano, el sistema se compone de agentes especializados, cada uno con un dominio de conocimiento definido. El éxito surge de su colaboración estructurada.
3.  **Modularidad y Extensibilidad:** La arquitectura de agentes permite añadir, eliminar o actualizar especialistas sin afectar al resto del sistema.
4.  **Aprendizaje Continuo (Memoria Persistente):** El sistema aprende de sus errores. Los fallos en las revisiones de código no son solo bugs, son oportunidades de aprendizaje que se almacenan y se recuperan para mejorar el rendimiento futuro.
5.  **Transparencia Total:** Todas las comunicaciones, decisiones y acciones de los agentes son visibles en tiempo real, proporcionando una trazabilidad completa del proceso de desarrollo.

---

## 2. Arquitectura de Agentes: El Núcleo Cognitivo

La base de Atenea es su arquitectura de agentes, que define cómo se estructuran, operan y evolucionan las entidades de IA.

### 2.1. El Agente como Entidad de Software

Un **Agente** es una **clase de TypeScript** que encapsula una especialidad de ingeniería de software. No es una única entidad monolítica, sino una plantilla para crear "trabajadores" de IA.

- **Clase Base (Conceptual):** Todos los agentes derivan de un concepto de clase base que define una interfaz común para la ejecución de tareas.
- **Instanciación:** Se pueden crear múltiples instancias de cualquier clase de Agente. Ejemplo: `const reactDev1 = new ReactAgent(config1); const reactDev2 = new ReactAgent(config2);`

### 2.2. Perfiles de Agente (`agent.profiles.ts`)

La "personalidad", misión y capacidades de cada tipo de agente no están codificadas en su lógica, sino definidas en un objeto de configuración centralizado (`agentProfiles`). Esto permite modificar el comportamiento de un agente sin cambiar su código.

**Estructura de un Perfil:**

```typescript
interface AgentProfile {
    name: AgentName;
    motto: string;
    mission: string;
    personality: string;
    capabilities: string[];
}
```

Este perfil se inyecta en el prompt de sistema de cada agente, asegurando que actúe de acuerdo a su rol definido.

### 2.3. Instanciación y Configuración Dinámica

Cada instancia de un agente se configura en su creación, permitiendo una gran flexibilidad:

- **Modelo de IA:** La instancia puede ser configurada para usar un modelo de nube (ej. `gemini-3-flash-preview`) o un modelo local a través de un endpoint compatible con OpenAI (ej. LM Studio).
- **Parámetros del Modelo:** Se pueden especificar parámetros como `temperature`, `topK`, etc., para cada instancia. Esto permite crear agentes "conservadores" (baja temperatura) o "creativos" (alta temperatura) del mismo tipo.

**Ejemplo Conceptual de Instanciación:**

```typescript
// En la lógica de creación de equipos
const equipoFrontend = new Team("Frontend");
equipoFrontend.addMember(new ReactAgent({
    model: 'gemini-3-flash-preview',
    temperature: 0.2 // Un desarrollador React senior, preciso y conservador
}));
equipoFrontend.addMember(new ReactAgent({
    model: 'local/Mistral-7B',
    temperature: 0.8 // Un desarrollador React junior, más experimental
}));
```

### 2.4. Arquitectura de la Memoria (Corto y Largo Plazo)

#### 2.4.1. Memoria a Corto Plazo

Es el contexto inmediato de la tarea. Se construye dinámicamente para cada llamada a la API y es volátil. Incluye:

-   La descripción de la tarea actual.
-   El código del archivo a modificar.
-   El historial de chat relevante de la `Sala de Colaboración`.
-   La estructura del árbol de archivos del proyecto.
-   Feedback de una revisión fallida (si aplica).

#### 2.4.2. Memoria a Largo Plazo (RAG - Retrieval-Augmented Generation)

Es la base de conocimiento persistente del sistema, implementada como una **base de datos vectorial en IndexedDB**. Este es el mecanismo de aprendizaje.

-   **Flujo de Almacenamiento (Aprendizaje):**
    1.  Un agente (`ReactAgent`) genera código que es rechazado por el `SecurityAgent`.
    2.  El `OrchestratorAgent` detecta el fallo y pasa el código erróneo, el feedback y el agente responsable al `LearningAgent`.
    3.  El `LearningAgent` genera una "lección" generalizada (ej. "Anti-Patrón: Nunca renderizar directamente la entrada del usuario sin sanitizarla para prevenir XSS en React.").
    4.  Esta lección de texto se envía al `geminiService` para ser convertida en un **vector de embedding** (una representación numérica).
    5.  El `vectorDbService` almacena el texto de la lección y su vector asociado en la "tabla" (ObjectStore) correspondiente al `ReactAgent`.

-   **Flujo de Recuperación (Aplicación de Conocimiento):**
    1.  El `OrchestratorAgent` asigna una nueva tarea al `ReactAgent`.
    2.  Antes de generar el prompt para el `ReactAgent`, el orquestador toma la descripción de la nueva tarea.
    3.  La convierte en un vector de embedding.
    4.  Utiliza el `vectorDbService` para buscar en la "tabla" del `ReactAgent` las lecciones almacenadas cuyos vectores sean más similares semánticamente (usando similitud de coseno).
    5.  Si se encuentran lecciones con una similitud por encima de un umbral, se inyectan en el prompt del `ReactAgent` bajo la sección "Lecciones Relevantes de tu Base de Conocimiento", ayudándole a no cometer el mismo error.

-   **Niveles de Memoria RAG:**
    1.  **Memoria de Instancia/Tarea:** El feedback específico de una corrección se guarda en la memoria a corto plazo para el siguiente intento.
    2.  **Memoria de Clase (VectorDB por Agente):** La lección generalizada se almacena en la base de datos vectorial, compartida por todas las instancias de esa clase de agente.
    3.  **Memoria Global (Seeding):** La base de datos se siembra inicialmente con un conjunto de "mejores prácticas" de ingeniería de software para cada especialidad (`knowledgeSeedingService.ts`).

### 2.5. Mecanismos de Razonamiento

-   **CoT (Chain of Thought):** Se instruye a los agentes (`TechLead`, `Orchestrator`) en sus prompts para que "piensen paso a paso" antes de dar una respuesta final, especialmente al descomponer tareas complejas.
-   **ToT (Tree of Thoughts):** Utilizado principalmente por el `ProductOwnerAgent` al generar opciones de sprint. Se le pide que genere múltiples planes candidatos (diferentes estrategias) y los presente para su evaluación.
-   **Autocrítica (Self-Critique):** Después de que un agente especialista genera código, se le puede pedir en un segundo paso que "actúe como un revisor senior" y critique su propio código, generando una versión refinada.
-   **CoD (Chain of Density):** El `LearningAgent` utiliza este principio para tomar un contexto de error detallado (código, feedback, trazas) y comprimirlo en una lección única, densa y reutilizable.

### 2.6. Tecnología `GridAgent`

Un `GridAgent` es una meta-clase que orquesta un enjambre de instancias de un agente base para abordar problemas complejos.

-   **Instanciación:** `const reactGrid = new GridAgent({ baseAgentClass: ReactAgent, gridSize: 5, paramRanges: { temperature: [0.2, 0.9] } });`
-   **Funcionamiento:**
    1.  Al recibir una tarea, el `GridAgent` la clona y la asigna a cada una de sus `N` sub-instancias.
    2.  Cada sub-instancia se inicializa con parámetros de modelo aleatorios dentro de los rangos definidos, creando un espectro de "personalidades".
    3.  Todas las sub-instancias generan una solución en paralelo.
    4.  Un "agente de consenso" interno recibe todas las `N` soluciones.
    5.  Evalúa las soluciones basándose en métricas predefinidas (ej. ¿cumple los requisitos?, ¿pasa un linter estático?, ¿es conciso?).
    6.  Elige la solución con la puntuación más alta o intenta fusionar las mejores partes de varias soluciones.
    7.  Devuelve una única solución consolidada como si fuera un solo agente.

---

## 3. Flujo de Trabajo Completo del Proyecto

### 3.1. Fase 1: Planificación (Vista: `Planificación`)

1.  **Entrada del Usuario:** El usuario describe la idea del proyecto en lenguaje natural.
2.  **Lluvia de Ideas Inicial:** El `SuggestionAgent` analiza la idea y genera un conjunto de 4-6 funcionalidades clave o mejoras, presentadas como tarjetas seleccionables.
3.  **Ciclo Iterativo de Refinamiento:**
    a. El usuario selecciona las tarjetas que le gustan.
    b. El `SuggestionAgent` recibe las sugerencias aceptadas como nuevo contexto.
    c. Genera un nuevo conjunto de sugerencias más detalladas o que expanden las ideas ya aceptadas.
    d. Este ciclo continúa hasta que el usuario decide que el plan está completo.
4.  **Confirmación Final:** El usuario finaliza la fase de planificación, consolidando todas las sugerencias aceptadas en un plan de proyecto final.

### 3.2. Fase 2: Génesis del Proyecto (Transición de Fase)

1.  **Invocación del `GenerationAgent`:** El plan final se pasa al `GenerationAgent`.
2.  **Creación de Artefactos Ágiles:** Este agente no escribe código de aplicación. Su única tarea es generar los documentos de gestión del proyecto en formato Markdown:
    -   `PRODUCT_BACKLOG.md`: Desglosa el plan en Historias de Usuario (HU) con el formato "Como [rol], quiero [acción], para [beneficio]", criterios de aceptación, estimación de Story Points, y dependencias.
    -   `ROADMAP.md`: Visión a alto nivel del producto.
    -   `README.md`: Básico inicial.
3.  **Análisis del Backlog:** El sistema analiza el `PRODUCT_BACKLOG.md` para:
    -   Definir los **Equipos** necesarios (ej. "Equipo Frontend", "Equipo API").
    -   Poblar el **Product Backlog** en el estado de la aplicación.
    -   Crear las **instancias de agentes** necesarias para cada equipo.
4.  **Transición de Estado:** La `AppPhase` cambia de `planning` a `collaboration`. La vista activa cambia a `Monitor de Proyecto`.

### 3.3. Fase 3: Colaboración y Ejecución de Sprints

1.  **Planificación del Sprint (Vista: `Monitor de Proyecto`):**
    -   El usuario, actuando como Product Owner, abre el modal de planificación de sprint para un equipo.
    -   El `ProductOwnerAgent` se invoca, analiza el backlog priorizado y la velocidad del equipo, y propone 3 opciones estratégicas de sprint.
    -   El usuario selecciona una opción y lanza el sprint.

2.  **Inicio del `OrchestratorAgent`:**
    -   Se crea una instancia del `OrchestratorAgent` específica para ese equipo y ese sprint.
    -   El orquestador es una clase de TypeScript que se ejecuta en segundo plano, comunicándose con la UI a través de callbacks (`updateCollaborationUI`, `updateFileTreeUI`).

3.  **Ciclo de Vida de una Historia de Usuario (HU):**
    a. **Descomposición:** El `Orchestrator` toma la primera HU del sprint y se la pasa al `TechLead`. El `TechLead` devuelve un plan JSON de subtareas técnicas, incluyendo `filePath`, `agent` especialista y `dependencies`.
    b. **Ejecución del Plan:** El `Orchestrator` gestiona un bucle, identificando las subtareas cuyas dependencias ya están completas y ejecutándolas en paralelo.
    c. **Ciclo de Vida de una Subtarea:**
        i. **Asignación:** Se asigna a una instancia de agente especialista.
        ii. **Recuperación de Conocimiento (RAG):** El orquestador busca en la VectorDB lecciones relevantes para la tarea y las inyecta en el prompt.
        iii. **Generación de Código:** El agente especialista genera el contenido completo del archivo.
        iv. **Ciclo de Revisión en Paralelo:** El código se envía simultáneamente a `QualityAgent`, `SecurityAgent` y `IntegrationAgent`.
        v. **Feedback y Aprendizaje:** Si alguna revisión falla, se recopila el feedback. El `LearningAgent` lo procesa para crear y almacenar una nueva lección. La tarea vuelve al agente especialista con el feedback para una corrección (hasta un máximo de reintentos).
        vi. **Aprobación y Fusión:** Si todas las revisiones pasan, la tarea se marca como completada.
    d. **Escalada:** Si una tarea falla repetidamente, se escala al `TechLead`, quien interviene con una solución definitiva. Esta intervención también se convierte en una lección de alta prioridad.
    e. **Finalización de la HU:** Una vez que todas las subtareas de una HU están completas, se marca como `done` en el tablero Kanban.

4.  **Finalización del Sprint:** Cuando todas las HU del sprint están `done`, el `Orchestrator` finaliza su ejecución y notifica a la UI. El sistema está listo para la Revisión y Retrospectiva del Sprint.

---

## 4. Desglose Técnico de Vistas del Layout

-   **Planificación:** Interfaz de chat (`PlanningChat.tsx`) que gestiona el diálogo con el `SuggestionAgent`. Muestra un modal (`PlanningSuggestionsModal.tsx`) para la selección de funcionalidades.
-   **IDE de Desarrollo:** Contiene un `FileExplorer.tsx` y un `CodeEditor.tsx`. Su estado (`fileTree`, `selectedFile`) es gestionado en `App.tsx` y actualizado por el callback `updateFileTreeUI` del `OrchestratorAgent`. El `IDEHeader.tsx` contiene botones para invocar agentes de alto nivel como `RefactoringAgent` y `DocumentationAgent`.
-   **Monitor de Proyecto:** Vista principal post-planificación. Muestra un `DashboardMosaic.tsx` (vista general), un `ProgramBoard.tsx` (vista de dependencias) y vistas de `TeamSprintView.tsx` que contienen el `KanbanColumn.tsx`. Es la interfaz para la planificación de sprints (`SprintPlanningModal.tsx`).
-   **Estadísticas API:** Vista de solo lectura (`StatisticsView.tsx`) que consume los `apiUsageLogs` del estado global, que son poblados por el `apiQueueService.ts` en cada llamada.
-   **Experiencia y Logros:** Vista de solo lectura (`StatsAndAchievementsView.tsx`) que renderiza los `stats` y `achievements` del `ProjectManagementState`. Estos datos son actualizados por el callback `onAgentXpGain` del `OrchestratorAgent`.
-   **Monitor de Conocimiento:** Interfaz (`KnowledgeMonitor.tsx`) que interactúa directamente con el `vectorDbService.ts`. Permite leer todas las entradas de un agente, así como añadir, editar y eliminar lecciones manualmente.
-   **Sala de Colaboración:** Un log de chat en tiempo real (`AgentCollaborationRoom.tsx`) que renderiza el array `collaborationMessages` del estado. Es actualizado constantemente por el callback `updateCollaborationUI` del `OrchestratorAgent`.
-   **Guardar / Cargar Proyecto:** Funciones en `App.tsx` que serializan/deserializan el `AppState` completo a/desde un archivo JSON, utilizando `file-saver` y la API de archivos del navegador.
-   **Consola de Agente:** Un `LogWidget.tsx` que muestra los logs de bajo nivel para depuración.

---

## 5. Entidades de Datos Clave (`types.ts`)

-   **`WorkItem` / `ProductBacklogItem` / `KanbanCard`:** Representan una unidad de trabajo. Contienen `id`, `title`, `description`, `acceptanceCriteria`, `storyPoints`, `dependencies`. La `KanbanCard` extiende la `WorkItem` con un `status`.
-   **`Sprint`:** Representa un ciclo de trabajo. Contiene un array de `KanbanCard` (`workItems`), `startDate`, `endDate`, `goal`, etc.
-   **`Team`:** Representa un equipo de desarrollo. Contiene un `activeSprint` y un array de `completedSprints`.
-   **`AgentStats`:** Almacena las métricas de gamificación para una instancia de agente: `xp`, `level`, `tasksCompleted`, etc.
-   **`VectorStoreEntry`:** Define el esquema de un documento en la base de datos de conocimiento: `id`, `text` (la lección), `embedding` (el vector).
-   **`ApiContract`:** Define la interfaz entre dos servicios o equipos, incluyendo `endpoint`, `method`, `requestSchema`, y `responseSchema`.
-   **`AppState` / `ProjectManagementState`:** Los objetos de estado principales que contienen toda la información de la aplicación, diseñados para ser serializables.

---
## 6. Conclusión

Este documento sirve como la fuente de verdad para el diseño y la implementación del Proyecto Atenea. Define una arquitectura desacoplada y basada en eventos donde la lógica de los agentes (el "cerebro") opera de forma independiente de la interfaz de usuario, comunicándose a través de un sistema de callbacks bien definido. Este enfoque garantiza la robustez, testabilidad y extensibilidad del sistema.