# 🤖 AI Programming Agent

Un entorno autónomo y avanzado de desarrollo de software diseñado para transformar ideas en lenguaje natural en aplicaciones completamente funcionales mediante la orquestación inteligente de agentes expertos de IA.

Este proyecto ha sido desarrollado con el apoyo y asistencia de asistentes de código de Inteligencia Artificial de última generación, permitiendo crear una arquitectura ágil, modular y altamente reactiva.

### 👤 Creador y Diseñador Principal
*   **Autor:** Raúl Navas Montero
*   **LinkedIn Profesional:** [Raúl Navas Montero](https://www.linkedin.com/in/ra%C3%BAl-n-06b8b3101/)

---

## 🚀 ¿Qué es AI Programming Agent?

**AI Programming Agent** es un **Autonomous Integrated Development Environment (AIDE)** (Entorno Autónomo de Desarrollo Integrado) construido sobre un stack de **React, TypeScript y Vite**, y potenciado por los últimos modelos de lenguaje (como *Gemini 3.5 Flash* y *Gemini 3.1 Pro*).

A diferencia de las herramientas de autocompletado convencionales, esta plataforma simula un departamento completo de desarrollo de software ágil. Mediante un enjambre de agentes especializados (Product Owner, Scrum Master, Tech Lead, Desarrolladores y Revisores), la plataforma orquesta de forma interactiva y en tiempo real todo el ciclo de vida de desarrollo de una aplicación web: planificación de requisitos, diseño arquitectónico, generación del backlog, codificación y revisiones rigurosas de seguridad y calidad de código.

---

## 🛠️ ¿Qué hace la Aplicación? (Características Clave)

La aplicación ofrece una simulación inmersiva e interactiva de desarrollo autónomo:

### 1. 🔄 Ciclo de Desarrollo Ágil Completo
La aplicación guía el proyecto por fases lógicas y dinámicas:
*   **Fase de Planificación:** El usuario interactúa con un *SuggestionAgent* para proponer e iterar sobre funcionalidades sugeridas dinámicamente mediante tarjetas interactivas.
*   **Fase de Génesis:** El *GenerationAgent* traduce los requerimientos finales en un backlog estructurado (`PRODUCT_BACKLOG.md`) y un roadmap técnico en formato JSON estricto, que poblará automáticamente las tareas del tablero del proyecto.
*   **Gestión de Sprints:** Se pueden planificar y lanzar sprints estratégicos para distintos equipos de desarrollo a través de un panel Scrum interactivo.

### 2. 🧠 Memoria a Largo Plazo con RAG y VectorDB en IndexedDB
*   **Bucle de Aprendizaje:** Cada vez que el código generado por un desarrollador especialista es rechazado por el comité de revisión, el *LearningAgent* extrae una lección o mejor práctica abstracta de la corrección realizada.
*   **VectorDB Local:** Esta lección se vectoriza mediante `gemini-embedding-2-preview` y se persiste de manera local en el navegador del usuario utilizando *IndexedDB*.
*   **Recuperación Semántica (RAG):** Ante futuras tareas similares, el sistema recupera automáticamente las lecciones relevantes de la base de conocimiento del agente especialista y las inyecta en su prompt, evitando de forma proactiva cometer el mismo error técnico.

### 3. 🤖 Modo Autónomo Continuo
*   Al activar el "modo autónomo", el sistema entra en un bucle cerrado autogestionado. El *ProductOwnerAgent* prioriza historias de usuario pendientes basándose en la velocidad del equipo, define metas, lanza sprints de forma independiente y supervisa todo el ciclo de codificación y revisión sin requerir clics del usuario.

### 4. 📈 Análisis de Uso y Consumo de la API (Estadísticas)
*   Un monitor detallado (*StatisticsView*) que extrae la información en tiempo real de cada llamada a la API de IA.
*   Gráficos interactivos de barras (*BarChart*) y dona (*DonutChart*) construidos en D3/Recharts para visualizar el consumo exacto de tokens (Input vs. Output), latencia media de respuesta, llamadas por minuto e incluso un cálculo estimado del coste de ejecución por historia de usuario y por agente.

### 5. 🎮 Gamificación del Equipo de IA
*   Cada agente de IA posee su propio perfil dinámico con una hoja de personaje que acumula puntos de experiencia (XP), niveles y logros desbloqueables (*achievements*) de ingeniería (como *Cazador de Bugs*, *Defensor de la Calidad* o *Entrega Impecable*).

### 6. 💻 IDE Virtual y Sala de Colaboración
*   **Explorador de Archivos Dinámico:** Muestra en tiempo real el árbol de directorios virtual creado por el agente de generación y modificado por los especialistas.
*   **Visor de Código:** Permite explorar cada archivo individual con resaltado de sintaxis integrado.
*   **Sala de Colaboración:** Feed interactivo que simula una sala de chat de equipo, mostrando en tiempo real los diálogos técnicos, solicitudes de cambio y aprobaciones cruzadas entre el Orquestador y los desarrolladores especialistas.

---

## 🎯 Objetivo de la Aplicación

El **objetivo central** de este proyecto es demostrar la viabilidad y la eficiencia de los **sistemas de agentes de IA coordinados y auto-mejorables**. Busca probar que:
1.  **La coordinación supera al tamaño:** Un enjambre de modelos de lenguaje especializados e independientes, operando bajo flujos de trabajo de metodologías ágiles humanos (Scrum), produce software de mayor modularidad, robustez y calidad que una sola consulta monolítica a un LLM masivo.
2.  **El auto-aprendizaje local en el cliente es viable:** Gracias a IndexedDB y RAG local, el sistema acumula experiencia práctica real y optimiza sus propios prompts dinámicamente sin necesidad de reentrenamientos complejos de modelos.
3.  **Trazabilidad total:** El desarrollo de software asistido por IA debe ser auditable y explicable, proporcionando un historial completo de por qué se tomó una decisión arquitectónica o se escribió una línea de código determinada.

---

## 🔮 Objetivo Potencial (Impacto y Escabilidad)

AI Programming Agent está diseñado bajo una arquitectura de abstracción que le permitirá escalar hacia los siguientes horizontes en el corto plazo:

1.  **Integración con Sandboxes Reales (WebContainers):** Permitir que el árbol virtual de archivos sea montado y ejecutado en un entorno de desarrollo web en el cliente como *WebContainers* de StackBlitz, posibilitando a los agentes autónomos ejecutar comandos de terminal, instalar dependencias reales de npm, lanzar servidores de pruebas e interactuar con el código en vivo.
2.  **Pruebas Unitarias Automatizadas de Bucle Cerrado:** El *TestingAgent* podrá ejecutar suites de tests (como Jest o Vitest). Si una prueba falla, la salida detallada del error de la consola se redirige de forma determinista al *LearningAgent* y al especialista, refinando el código de manera autónoma hasta que todas las pruebas pasen al 100%.
3.  **Mantenimiento de Sistemas Autónomos en Producción (Self-Healing):** Extender esta arquitectura a servicios reales en la nube. Al recibir reportes de errores en producción o alertas de seguridad, un centinela autónomo podrá crear un sprint de emergencia aislado, localizar el error en el código, revisarlo a través de agentes expertos, aplicar la solución y desplegar el parche automáticamente.

---

## 🏗️ Arquitectura de Agentes y Roles

El núcleo del sistema es un ecosistema cognitivo con roles estrictamente delimitados:

```
                               ┌─────────────────────────┐
                               │     Product Owner       │
                               └────────────┬────────────┘
                                            │ Planifica Sprints
                                            v
                               ┌─────────────────────────┐
                               │  Orchestrator (Scrum M) │
                               └────────────┬────────────┘
                                            │ Descompone Historias
                                            v
                               ┌─────────────────────────┐
                               │       Tech Lead         │
                               └────────────┬────────────┘
                                            │ Crea Plan Técnico
                                            v
                      ┌─────────────────────┴─────────────────────┐
                      │                                           │
         ┌────────────┴────────────┐                 ┌────────────┴────────────┐
         │ Desarrolladores Experto  │                 │   Comité de Revisión    │
         ├─────────────────────────┤                 ├─────────────────────────┤
         │ • ReactAgent            │                 │ • QualityAgent          │
         │ • NodeAPIAgent          │                 │ • SecurityAgent         │
         │ • CSSAgent / UIUXAgent  │                 │ • IntegrationAgent      │
         │ • SQLDatabaseAgent      │                 │ • CICDAgent             │
         └────────────┬────────────┘                 └────────────┬────────────┘
                      │                                           │
                      └─────────────────────┬─────────────────────┘
                                            │ Revisa & Valida Código
                                            v
                               ┌─────────────────────────┐
                               │      LearningAgent      │
                               └────────────┬────────────┘
                                            │ Genera Lecciones
                                            v
                               ┌─────────────────────────┐
                               │ VectorDB (IndexedDB RAG)│
                               └─────────────────────────┘
```

### 📋 Perfiles Clave del Ecosistema

*   **ProductOwner:** El agente estratégico que analiza el backlog global, estima capacidades del equipo basándose en la velocidad histórica y propone las opciones más óptimas de sprint.
*   **Orchestrator (Scrum Master):** El director de orquesta que controla el bucle del sprint, gestiona el tablero Kanban virtual, recopila las métricas del equipo y convoca a los comités de revisión.
*   **TechLead:** El arquitecto encargado de desglosar cada Historia de Usuario en tareas técnicas independientes con dependencias y asignar el especialista ideal para su codificación.
*   **Desarrolladores Especialistas (ReactAgent, NodeAPIAgent, CSSAgent, etc.):** Escriben el código fuente real de los archivos siguiendo las lecciones inyectadas por el sistema RAG semántico.
*   **QualityAgent:** Revisa la calidad, estructura y estilo del código ( TypeScript, modularidad y legibilidad).
*   **SecurityAgent:** Audita el código generado buscando inyecciones de dependencias vulnerables, fugas de seguridad, fallas lógicas o exposición de datos sensibles.
*   **IntegrationAgent:** Verifica el cumplimiento estricto de los contratos de comunicación entre componentes o APIs (*ApiContracts*).
*   **LearningAgent:** Interviene tras un código rechazado por el comité de revisión. Generaliza la falla y los feedbacks en una directriz abstracta de ingeniería para ser inyectada en la VectorDB local.

---

## 💾 Instalación y Configuración del Entorno Local

Para ejecutar el proyecto de forma local en tu computadora, sigue los pasos a continuación:

### Prerrequisitos
*   **Node.js** (versión 18 o superior recomendada)
*   **NPM** o **Yarn**
*   Una API Key de Gemini.

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/ai-programming-agent.git
    cd ai-programming-agent
    ```

2.  **Instala las dependencias del proyecto:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` o `.env.local` en el directorio raíz del proyecto e ingresa tu API Key:
    ```env
    GEMINI_API_KEY=tu_clave_de_api_aqui
    ```

4.  **Inicia el servidor de desarrollo local:**
    ```bash
    npm run dev
    ```

5.  **Abre la aplicación:**
    Accede mediante tu navegador a la dirección indicada por la terminal (usualmente `http://localhost:3000`). ¡Explora el futuro del desarrollo de software multi-agente!

---

<div align="center">
  <p>Diseñado y desarrollado con pasión por <strong>Raúl Navas Montero</strong> con asistencia de Inteligencia Artificial.</p>
  <p><em>"Uniendo la agilidad del desarrollo humano con el poder y el auto-aprendizaje de los agentes inteligentes."</em></p>
</div>
