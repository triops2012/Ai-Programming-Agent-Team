<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

---

# 🧠 Proyecto Atenea: Entorno Autónomo de Desarrollo Integrado (AIDE)

Bienvenido al repositorio oficial del **Proyecto Atenea**, una plataforma de vanguardia que materializa la visión del desarrollo de software guiado por inteligencia artificial. El sistema opera como una verdadera "fundición de software", donde el usuario interactúa con un ecosistema dinámico de agentes especializados que planifican, diseñan, codifican, revisan, aprenden y despliegan aplicaciones listas para producción.

### 👤 Creador y Diseñador Principal
*   **Autor:** Raúl Navas Montero
*   **LinkedIn Profesional:** [Raúl Navas Montero](https://www.linkedin.com/in/ra%C3%BAl-n-06b8b3101/)

---

## 🚀 ¿Qué es el Proyecto Atenea?

El **Proyecto Atenea** es un **Autonomous Integrated Development Environment (AIDE)** construido sobre un robusto stack tecnológico de **React, TypeScript y Vite**, e impulsado por los modelos más avanzados de la API de **Google Gemini** (como *Gemini 3.5 Flash* y *Gemini 3.1 Pro*). 

A diferencia de los asistentes de codificación tradicionales que solo completan líneas de código, Atenea simula la estructura completa de una empresa de desarrollo ágil de software. A través de un enjambre de agentes autónomos y especializados (Scrum Master, Product Owner, Tech Lead, Desarrolladores y Revisores), la plataforma transforma descripciones de alto nivel en lenguaje natural en proyectos con arquitecturas limpias, modulares y completamente funcionales.

---

## 🛠️ ¿Qué hace la Aplicación? (Características Clave)

El Proyecto Atenea cuenta con un conjunto de características avanzadas que lo sitúan en la frontera de la ingeniería de software asistida por IA:

### 1. 🔄 Ciclo de Desarrollo Ágil Completo
La aplicación guía el proyecto por fases lógicas y dinámicas:
*   **Fase de Planificación:** Interacción directa del usuario con el *SuggestionAgent* para refinar ideas mediante "sugerencias proactivas" interactivas.
*   **Fase de Génesis:** El *GenerationAgent* crea los artefactos ágiles del proyecto (`PRODUCT_BACKLOG.md`, `ROADMAP.md`) en formato JSON estricto, que se parsean automáticamente para poblar el backlog y crear la estructura del proyecto.
*   **Ejecución de Sprints:** Planificación estratégica y lanzamiento de sprints a través de un tablero Kanban real e interactivo.

### 2. 🧠 Memoria a Largo Plazo con RAG (Retrieval-Augmented Generation) y VectorDB Local
*   **Bucle de Automejora:** Cuando un código generado es rechazado por el comité de revisión, el *LearningAgent* extrae una "lección o mejor práctica generalizada" del error.
*   **VectorDB en IndexedDB:** Esta lección se vectoriza mediante `gemini-embedding-2-preview` y se almacena en una base de datos vectorial local basada en *IndexedDB* en el navegador.
*   **Recuperación Semántica (RAG):** En futuras tareas, el sistema busca en la VectorDB lecciones similares e inyecta estas directrices directamente en el prompt del especialista, previniendo de forma proactiva que se repitan los mismos fallos del pasado.

### 3. 🤖 Modo Autónomo Continuo
*   Un "game loop" automatizado que, al ser activado, permite al sistema autogestionarse. El *ProductOwnerAgent* analiza el backlog, selecciona las mejores historias basándose en la velocidad estimada del equipo, planifica e inicia sprints, y ejecuta las tareas de forma 100% independiente sin necesidad de intervención del usuario.

### 4. 📈 Monitorización en Tiempo Real y Consumo de API
*   **Panel de Estadísticas Integrado:** Gráficas dinámicas de barras (*BarChart*) y de dona (*DonutChart*) implementadas en D3/Recharts para el seguimiento del consumo de tokens (Input vs. Output), costes acumulados reales de la API e histórico de latencias de las peticiones de los agentes.

### 5. 🎮 Gamificación del Equipo de IA
*   Cada agente del equipo cuenta con su propia hoja de experiencia (XP), niveles y logros (*achievements*) únicos (ej. *Cazador de Bugs*, *Entrega Impecable*). Completar tareas complejas, descubrir problemas de seguridad o corregir código al primer intento otorga experiencia a los agentes, permitiendo un seguimiento lúdico y visual de la "madurez" del equipo.

### 6. 💻 IDE de Desarrollo Integrado y Sala de Colaboración
*   **Explorador de Archivos Dinámico:** Árbol virtual interactivo que muestra la estructura real del proyecto generado en tiempo real.
*   **Visor de Código:** Panel interactivo con resaltado de sintaxis para revisar cada archivo creado.
*   **Sala de Colaboración:** Un feed de chat en tiempo real donde se visualiza la "conversación" técnica y delegación de tareas entre el Orquestador y los especialistas, imitando una sala de Slack o Microsoft Teams de un equipo real.

---

## 🎯 Objetivo de la Aplicación

El **objetivo primordial** de Atenea es **demostrar que la IA generativa puede ir mucho más allá del rol de copiloto de código**, organizándose de forma sistémica y metodológica. Atenea prueba que:
1.  **La coordinación es superior a la potencia individual:** Un conjunto de agentes pequeños y especializados con roles definidos y un flujo de comunicación ágil y controlado (Scrum) genera código de mayor calidad, seguridad y consistencia que un único modelo masivo resolviendo un prompt gigante.
2.  **El auto-aprendizaje local es viable:** A través de la base de datos vectorial local (IndexedDB) y RAG, el software puede aprender de sus propios errores de ejecución y pruebas, creando un bucle de mejora continua y descentralizado en el propio navegador.
3.  **La transparencia es clave:** Los tableros Kanban, logs detallados y la Sala de Colaboración hacen que el desarrollo autónomo sea 100% auditable por un humano.

---

## 🔮 Objetivo Potencial y Futuro del Proyecto

El Proyecto Atenea se asienta sobre cimientos arquitectónicos diseñados para escalar hacia capacidades revolucionarias:

1.  **Integración con Sandboxes de Ejecución Real (WebContainers / Docker):** El objetivo potencial más inmediato es permitir que el árbol de archivos virtual se monte en entornos reales como *WebContainers* de StackBlitz, permitiendo a los agentes instalar dependencias reales de NPM, ejecutar servidores de desarrollo e iniciar suites de pruebas unitarias locales.
2.  **Pruebas Unitarias Automatizadas Deterministas:** Al tener ejecución real, el *TestingAgent* podrá ejecutar comandos como `npm run test`. Si un test falla, la salida de la consola se redirigirá al *LearningAgent* de forma 100% determinista, acelerando el bucle de RAG exponencialmente hasta conseguir la aprobación de las pruebas.
3.  **Sistemas Self-Healing en Producción:** Trasladar la arquitectura de Atenea a aplicaciones desplegadas en la nube. Si se detecta un error 500 en producción o una brecha de seguridad, un "agente centinela" clonaría el código, crearía un sprint de emergencia autónomo, solucionaría el error mediante el ciclo de revisión y desplegaría un parche en cuestión de segundos de forma totalmente automática.

---

## 🏗️ Arquitectura Multi-Agente: El Ecosistema Cognitivo

La inteligencia de Atenea reside en la especialización de sus componentes. A continuación se desglosan los principales agentes que habitan en la plataforma:

```
                               ┌─────────────────────────┐
                               │     Product Owner       │
                               └────────────┬────────────┘
                                            │ Propone Sprints
                                            v
                               ┌─────────────────────────┐
                               │  Orchestrator (Scrum M) │
                               └────────────┬────────────┘
                                            │ Descompone en HUs
                                            v
                               ┌─────────────────────────┐
                               │       Tech Lead         │
                               └────────────┬────────────┘
                                            │ Crea Plan de Tareas
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

### 📋 Los Roles y Especialidades del Equipo

| Agente | Tipo | Misión Principal |
|---|---|---|
| **ProductOwner** | Estratégico | Prioriza el backlog del proyecto, mide el cumplimiento del Roadmap y propone los sprints óptimos analizando dependencias complejas. |
| **Orchestrator** | Orquestación | El motor que ejecuta los sprints. Coordina la comunicación, gestiona la asignación de tareas, controla el flujo del Kanban y el ciclo de revisiones. |
| **TechLead** | Arquitectura | Analiza cada historia de usuario a bajo nivel técnico y genera un JSON con las subtareas de desarrollo, sus dependencias y los especialistas idóneos. |
| **ReactAgent / NodeAPIAgent / CSSAgent** | Desarrollo | Escriben el código fuente real del proyecto. Tienen acceso a la base de conocimiento (VectorDB) para inyectar mejores prácticas en sus prompts. |
| **QualityAgent** | Revisión | Evalúa el código resultante comprobando la modularidad, estándares de programación (ESLint, TypeScript), escalabilidad y limpieza. |
| **SecurityAgent** | Revisión | Analiza el código en busca de fallos lógicos, inyecciones de código, fugas de datos y asegura que no se expongan credenciales sensibles. |
| **IntegrationAgent** | Revisión | Verifica que las integraciones entre el frontend y el backend respeten los contratos de API (`ApiContract`) y esquemas definidos. |
| **LearningAgent** | Aprendizaje | Interviene ante cada rechazo de código. Destila el error técnico y el feedback de revisión en una regla abstracta, concisa y reutilizable para la VectorDB. |

---

## 🔄 Flujo de Trabajo del Desarrollo Autónomo

Cada tarea y línea de código generada en el Proyecto Atenea se rige por un estricto proceso de validación:

1.  **Planificación de Tareas:** El *Orchestrator* toma la siguiente historia de usuario activa del sprint Kanban y solicita al *TechLead* que la descomponga en subtareas lógicas acopladas con dependencias técnicas.
2.  **Asignación Inteligente:** El *Orchestrator* analiza qué tareas están "listas para ejecución" (sus dependencias están cubiertas) y las lanza en paralelo asignándolas a los especialistas correspondientes.
3.  **Recuperación de Memoria RAG:** Antes de llamar al LLM del desarrollador, el *Orchestrator* realiza una búsqueda semántica de lecciones en la VectorDB local basadas en la descripción de la tarea y se las inyecta en su prompt.
4.  **Generación de Propuesta de Código:** El desarrollador especialista genera el contenido completo del archivo de código limpio y sin explicaciones superfluas.
5.  **Comité de Revisión:** El código propuesto es analizado simultáneamente por `QualityAgent`, `SecurityAgent` e `IntegrationAgent`.
    *   **Si se aprueba:** La tarea se marca como completada y se actualiza el árbol de archivos virtual de la UI.
    *   **Si se rechaza:** Se recopila el feedback del comité. El *LearningAgent* extrae la lección y la guarda en la VectorDB para que el desarrollador especialista no vuelva a cometer el mismo error en el siguiente intento de corrección.
6.  **Cierre de HU y Finalización:** Cuando todas las subtareas técnicas de una Historia de Usuario están completas, la tarjeta se mueve visualmente al estado `DONE` en el Kanban, acumulando XP para el equipo.

---

## 💾 Instalación y Configuración del Entorno

Para ejecutar el Proyecto Atenea de forma local en tu computadora, sigue estos pasos:

### Prerrequisitos
*   **Node.js** (versión 18 o superior recomendada)
*   **NPM** o **Yarn**
*   Una clave de API de **Google Gemini** (puedes obtenerla de forma gratuita en [Google AI Studio](https://aistudio.google.com/)).

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/proyecto-atenea.git
    cd proyecto-atenea
    ```

2.  **Instala las dependencias del proyecto:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` o `.env.local` en la raíz del proyecto y añade tu clave de API de Gemini:
    ```env
    GEMINI_API_KEY=tu_clave_de_api_aqui
    ```

4.  **Inicia el servidor de desarrollo local:**
    ```bash
    npm run dev
    ```

5.  **Abre la aplicación:**
    La terminal te indicará el puerto local (usualmente `http://localhost:3000`). ¡Abre tu navegador y comienza a experimentar con el desarrollo autónomo de software!

---

<div align="center">
  <p>Proyecto diseñado y liderado con pasión por <strong>Raúl Navas Montero</strong>.</p>
  <p><em>"Uniendo la agilidad del desarrollo de software humano con el poder y la velocidad cognitiva de la inteligencia artificial."</em></p>
</div>
