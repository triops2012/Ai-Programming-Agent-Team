import { AgentName } from '../types.ts';
import * as vectorDbService from './vectorDbService.ts';
import { embedContent } from './geminiService.ts';

const initialKnowledge: { agent: AgentName; lessons: string[] }[] = [
    {
        agent: 'TechLead',
        lessons: [
            "Distinguir el rol del Arquitecto (visión estratégica, 'qué' y 'porqué') del Líder Técnico (ejecución práctica, 'cómo').",
            "Aplicar el Principio de Responsabilidad Única (SRP): una clase o módulo debe tener una, y solo una, razón para cambiar.",
            "Aplicar el Principio Abierto/Cerrado (OCP): las entidades de software deben estar abiertas para la extensión pero cerradas para la modificación, usando abstracciones e interfaces.",
            "Aplicar el Principio de Sustitución de Liskov (LSP): los subtipos deben ser sustituibles por sus tipos base sin alterar la corrección del programa.",
            "Aplicar el Principio de Segregación de Interfaz (ISP): los clientes no deben ser forzados a depender de interfaces que no utilizan; segregar interfaces monolíticas.",
            "Aplicar el Principio de Inversión de Dependencias (DIP): los módulos de alto nivel no deben depender de los de bajo nivel; ambos deben depender de abstracciones.",
            "Evitar la duplicación de lógica aplicando el principio DRY (Don't Repeat Yourself) para lograr bases de código más limpias y mantenibles.",
            "Favorecer soluciones directas sobre las complejas para mejorar la comprensibilidad, siguiendo el principio KISS (Keep It Simple, Stupid).",
            "Evitar implementar funcionalidades hasta que sean estrictamente necesarias para prevenir la complejidad, siguiendo el principio YAGNI (You Ain't Gonna Need It).",
            "Realizar commits temprano y a menudo para facilitar la colaboración y la entrega rápida de funcionalidades a producción.",
            "Integrar pruebas en las primeras etapas del desarrollo para obtener retroalimentación rápida y evitar la depuración costosa post-despliegue.",
            "Mantener las construcciones 'en verde'. Si una construcción falla, debe ser corregida inmediatamente para mantener la confianza en el pipeline.",
            "Construir el artefacto una sola vez y usarlo en todas las etapas del pipeline (staging, producción) para garantizar la consistencia.",
            "Tratar la infraestructura como código (IaC) para crear y destruir entornos de prueba temporales a pedido, evitando la 'derivación de la configuración'.",
            "Para modelar sistemas complejos, utilizar Diseño Basado en el Dominio (DDD) para alinear el código con el lenguaje y los procesos del negocio.",
            "Al diseñar microservicios, aplicar el patrón Saga para manejar transacciones distribuidas y asegurar la consistencia de los datos entre servicios.",
            "Implementar estrategias de despliegue avanzadas como Blue/Green o Canary Deployments en los pipelines de CI/CD para minimizar el riesgo y el tiempo de inactividad durante los lanzamientos.",
            "Anti-Patrón: 'El Monolito Distribuido'. Ocurre cuando los microservicios están tan acoplados que deben desplegarse juntos. Asegurar la autonomía de cada servicio.",
            "Error Común: No establecer límites de recursos (CPU, memoria) para los contenedores, lo que puede llevar a que un servicio consuma todos los recursos del nodo."
        ]
    },
     {
        agent: 'UIUXAgent',
        lessons: [
            "La base de un buen diseño UI/UX es la empatía. Diseñar centrándose en las necesidades del usuario, no en la estética.",
            "Mantener la consistencia en la interfaz (colores, tipografía, componentes) reduce la curva de aprendizaje y crea un sentido de familiaridad.",
            "La simplicidad reduce la 'carga cognitiva'. Eliminar elementos innecesarios para que los usuarios puedan centrarse en lo que importa.",
            "Diseñar para la accesibilidad (WCAG) beneficia a todos los usuarios, no solo a los que tienen discapacidades. Usar contrastes adecuados y texto alternativo para imágenes.",
            "Proporcionar retroalimentación clara e inmediata (ej. un 'spinner' al cargar datos) hace que la experiencia sea más atractiva y menos confusa.",
            "Un buen diseño se anticipa y previene los errores, en lugar de solo manejarlos después de que ocurran (ej. deshabilitar un botón de 'enviar' hasta que el formulario sea válido).",
            "Las señales visuales ('affordances') deben sugerir cómo se debe usar un objeto, como el sombreado en un botón que lo hace parecer 'presionable'.",
            "Aplicar la Ley de Hick: el tiempo que se tarda en tomar una decisión aumenta con el número y la complejidad de las opciones. Simplificar los menús y las elecciones.",
            "Aplicar la Ley de Fitts: el tiempo para adquirir un objetivo es una función de la distancia y el tamaño del objetivo. Hacer los botones y elementos clickables lo suficientemente grandes y fáciles de alcanzar.",
            "Error Común: Formularios largos y abrumadores. Dividirlos en pasos lógicos (un 'wizard') para mejorar la tasa de finalización."
        ]
    },
    {
        agent: 'QualityAgent',
        lessons: [
            "El propósito de los principios de código limpio es crear bases de código modulares y extensibles que sean fáciles de comprender, modificar y probar.",
            "Aplicar el Principio de Responsabilidad Única (SRP) para que cada módulo tenga un propósito claro y sea más fácil de mantener.",
            "Fomentar la simplicidad en el diseño y desarrollo, favoreciendo soluciones directas sobre las complejas para mejorar la comprensibilidad (KISS).",
            "Evitar la duplicación de lógica (DRY) para tener bases de código más limpias y fáciles de mantener.",
            "Las revisiones de código (Pull Requests) son una de las herramientas más efectivas para mejorar la calidad. Deben ser constructivas, enfocadas en el código y no en la persona.",
            "Utilizar linters (como ESLint) y formateadores (como Prettier) de forma automática para mantener un estilo de código consistente en todo el equipo.",
            "La complejidad ciclomática mide el número de caminos independientes en el código. Funciones con alta complejidad son difíciles de probar y mantener; deben ser refactorizadas.",
            "Error Común: Comentarios que explican 'qué' hace el código. El código debe ser autoexplicativo; los comentarios deben explicar el 'porqué' de una decisión compleja.",
            "Anti-Patrón: 'Código Mágico'. Usar constantes o cadenas de texto directamente en el código. Definirlas en un lugar centralizado para facilitar su mantenimiento.",
            "La calidad no es solo la ausencia de errores, sino también la facilidad con la que un nuevo desarrollador puede entender y modificar el código."
        ]
    },
    {
        agent: 'ReactAgent',
        lessons: [
            "Usa la desestructuración de props ({ usuario, edad }) en lugar de props.usuario para hacer el código más legible y declarar explícitamente las dependencias del componente.",
            "Al realizar llamadas a API en useEffect, define una función async *dentro* del efecto y llámala inmediatamente. No hagas la función del useEffect directamente async porque devuelve una Promesa en lugar de una función de limpieza.",
            "Utiliza el spread operator para actualizar el estado de forma inmutable (setState(prev => ({...prev, nuevoValor}))), evitando mutaciones directas que React no puede rastrear.",
            "Anti-Patrón: Dependencias de efecto incorrectas. El array de dependencias de `useEffect` debe contener todas las variables que afectan al efecto para evitar cierres obsoletos.",
            "Anti-Patrón: Cálculo excesivo en la renderización. Utilizar `useMemo` para memorizar cálculos costosos y `useCallback` para memorizar funciones, evitando re-renders innecesarios.",
            "Error Común: Olvidar el array de dependencias en `useEffect`. Un array vacío (`[]`) ejecuta el efecto solo una vez. Sin array, se ejecuta en cada render, pudiendo causar bucles infinitos.",
            "Para estados simples, usa `useState`. Para lógica de estado compleja con múltiples acciones que dependen del estado anterior, `useReducer` es una opción más robusta y predecible.",
            "Anti-Patrón: 'Prop Drilling' (pasar props a través de múltiples niveles). Solucionar con `useContext` para datos globales, composición de componentes o una librería de estado como Zustand.",
            "Al renderizar listas, es crucial proporcionar una prop `key` única y estable a cada elemento para que React pueda rastrear, actualizar y eliminar elementos de manera eficiente.",
            "Comprender los React Server Components (RSC) es clave para la arquitectura moderna, ya que eliminan la necesidad de JavaScript del lado del cliente para componentes estáticos, reduciendo el tamaño del bundle."
        ]
    },
    {
        agent: 'VueAgent',
        lessons: [
            "Priorizar la Composition API sobre la Options API en nuevos proyectos para una mejor organización lógica, reutilización de código (composables) y tipado con TypeScript.",
            "Anti-Patrón: Ignorar el sistema de reactividad. Utilizar siempre datos definidos con `reactive` o `ref` para el estado reactivo.",
            "Error Común: Usar `v-if` y `v-for` en el mismo elemento. `v-if` tiene mayor prioridad. Aplicar `v-if` a un contenedor `<template>` o usar una propiedad computada para filtrar los datos primero.",
            "Anti-Patrón: Pérdida de la reactividad al desestructurar un objeto reactivo. En su lugar, se deben actualizar las propiedades del objeto existente o usar `toRefs`.",
            "Utilizar Pinia como la solución de gestión de estado por defecto en Vue 3. Es más simple, modular y tiene mejor soporte para TypeScript que Vuex.",
            "Los 'watchers' deben usarse con moderación. A menudo, una propiedad computada es una solución más declarativa y eficiente.",
            "Error Común: Modificar props directamente en un componente hijo. Las props son unidireccionales; el hijo debe emitir un evento (`emit`) para que el padre actualice el dato.",
            "Para la optimización, usar `v-memo` para memorizar partes de una plantilla que raramente cambian, evitando re-renders costosos."
        ]
    },
    {
        agent: 'AngularAgent',
        lessons: [
            "Los componentes autónomos ('Standalone Components') son la forma moderna de construir en Angular. Reducen el boilerplate al eliminar la necesidad de `NgModule` para cada componente.",
            "Anti-Patrón: Suscribirse a observables en el componente y no desuscribirse. Esto crea fugas de memoria. Usar el pipe `async` en la plantilla o un operador como `takeUntil` para gestionar el ciclo de vida.",
            "Utilizar la inyección de dependencias de forma jerárquica. Proveer servicios en el `root` para singletons, o en componentes específicos para instancias locales.",
            "Los 'Signals' son el nuevo sistema de reactividad en Angular. Usarlos para un manejo de estado más granular y eficiente, reduciendo la dependencia de Zone.js.",
            "Error Común: Abuso de `any` en TypeScript. Aprovechar el tipado estricto de TypeScript para crear aplicaciones más robustas y evitar errores en tiempo de ejecución.",
            "Implementar `OnPush` como estrategia de detección de cambios en los componentes para mejorar el rendimiento, especialmente en aplicaciones grandes.",
            "RxJS es poderoso pero complejo. Usar operadores como `map`, `filter`, `switchMap` y `debounceTime` para manejar flujos de datos asíncronos de forma eficiente.",
            "Para la gestión de estado, considerar soluciones como NgRx (para aplicaciones grandes y complejas) o servicios simples con `BehaviorSubject` para casos de uso más sencillos."
        ]
    },
    {
        agent: 'NodeAPIAgent',
        lessons: [
            "El modelo de un solo hilo y bucle de eventos de Node.js es ideal para cargas de trabajo intensivas en E/S, ya que delega operaciones bloqueantes a un pool de hilos subyacente.",
            "Anti-Patrón Crítico: Bloquear el bucle de eventos. Una tarea que consume mucha CPU (ej. encriptación síncrona) bloqueará el hilo principal y detendrá toda la aplicación.",
            "Utilizar Promesas y `async/await` para gestionar la asincronía y evitar el 'infierno de callbacks' (callback hell).",
            "Implementar un manejo de errores centralizado en aplicaciones Express.js a través de middleware para capturar errores de forma consistente.",
            "Utilizar variables de entorno (con paquetes como `dotenv`) para gestionar la configuración (claves de API, credenciales de BBDD), nunca codificarlas directamente.",
            "Validar siempre las entradas del usuario (payloads de request) usando librerías como `Joi` o `express-validator` para prevenir datos maliciosos o malformados.",
            "Anti-Patrón de Seguridad: Concatenar strings para construir consultas SQL. Usar siempre consultas parametrizadas o un ORM para prevenir inyección de SQL.",
            "Implementar logging (con librerías como `Winston` o `Pino`) para registrar eventos importantes y errores, lo que es crucial para la depuración en producción."
        ]
    },
     {
        agent: 'PythonAPIAgent',
        lessons: [
            "Utilizar FastAPI para nuevos proyectos de API debido a su alto rendimiento (basado en Starlette y Pydantic) y su generación automática de documentación interactiva (Swagger UI).",
            "FastAPI utiliza Pydantic para la validación de datos, lo que formaliza la validación de las entradas de una API utilizando anotaciones de tipo de Python.",
            "La validación con Pydantic ayuda a prevenir ataques como la inyección SQL o XSS al evitar que se acepten datos maliciosos o no válidos.",
            "Modularizar los modelos de Pydantic, usar validadores personalizados para la lógica compleja y manejar excepciones para devolver respuestas de error informativas.",
            "En operaciones intensivas en lectura, considerar alternativas a Pydantic como los `dataclasses` para optimizar el rendimiento.",
            "Utilizar la inyección de dependencias de FastAPI (`Depends`) para gestionar conexiones a bases de datos, autenticación y otros recursos compartidos.",
            "Anti-Patrón: Colocar toda la lógica en los endpoints de la API. Separar la lógica de negocio en una capa de servicios o repositorios para una mejor organización y capacidad de prueba.",
            "Error Común en Django: El problema N+1 en las consultas del ORM. Usar `select_related` (para claves foráneas) y `prefetch_related` (para relaciones many-to-many) para optimizar la carga de datos."
        ]
    },
    {
        agent: 'JavaAPIAgent',
        lessons: [
            "La Inyección de Dependencias (DI) en Spring Boot resuelve el problema del 'acoplamiento estrecho', permitiendo que el contenedor de Spring gestione e inyecte las dependencias.",
            "La inyección por constructor se prefiere sobre la inyección por propiedad o por campo porque crea objetos inmutables y hace que las dependencias sean explícitas y fáciles de probar.",
            "Anti-Patrón: 'Fat Controller'. Colocar toda la lógica de negocio en los controladores. La lógica debe ser delegada a una capa de servicios (`@Service`) para una mejor separación de responsabilidades.",
            "Utilizar Spring Data JPA para simplificar la capa de acceso a datos. Definir interfaces de repositorio que extiendan `JpaRepository` para obtener operaciones CRUD sin implementación manual.",
            "Asegurar los endpoints de la API con Spring Security. Configurar reglas de autorización basadas en roles o permisos para proteger los recursos.",
            "Utilizar DTOs (Data Transfer Objects) para desacoplar la representación de la API de las entidades de la base de datos, evitando exponer la estructura interna.",
            "Error Común: No manejar `NullPointerException`. Usar `Optional` para representar valores que pueden ser nulos y evitar errores en tiempo de ejecución.",
            "Configurar perfiles de Spring (`application-dev.properties`, `application-prod.properties`) para gestionar diferentes configuraciones (ej. BBDD) entre entornos."
        ]
    },
     {
        agent: 'CSharpAPIAgent',
        lessons: [
            "La Inyección de Dependencias (DI) es una característica central de ASP.NET Core para construir software con acoplamiento laxo.",
            "La inyección por constructor es la práctica recomendada para DI, ya que hace que las dependencias sean explícitas y promueve la inmutabilidad.",
            "Anti-Patrón de Rendimiento en EF Core: 'Lazy loading' puede provocar el problema N+1. Usar 'eager loading' (con `Include()`) para recuperar todas las entidades relacionadas en una sola consulta.",
            "Usar el método `AsNoTracking()` para operaciones de solo lectura en EF Core para mejorar el rendimiento al evitar el trabajo del rastreador de cambios.",
            "Al usar LINQ, preferir `IQueryable` sobre `IEnumerable` para asegurar que la consulta se ejecute en la base de datos en lugar de en la memoria del servidor.",
            "Utilizar el middleware de ASP.NET Core para manejar preocupaciones transversales como el logging, el manejo de errores y la autenticación.",
            "Implementar el patrón de repositorio para abstraer la lógica de acceso a datos, haciendo el código más testeable y desacoplado de Entity Framework.",
            "Asegurar las APIs con los mecanismos integrados de ASP.NET Core Identity y la validación de tokens JWT."
        ]
    },
    {
        agent: 'GoAPIAgent',
        lessons: [
            "El modelo de concurrencia de Go se basa en goroutines (hilos ligeros) y canales (comunicación segura entre goroutines) para minimizar la sobrecarga.",
            "Para la sincronización entre goroutines, preferir el uso de `sync.WaitGroup` sobre `time.Sleep` para una coordinación precisa.",
            "En Go, los errores son valores y deben ser manejados explícitamente. Ignorar un error con `_` debe ser una decisión consciente y justificada.",
            "Utilizar 'struct tagging' para controlar la serialización y deserialización de datos JSON de forma declarativa y segura.",
            "Anti-Patrón: Usar un `mutex` global. Los mutex deben tener el alcance más pequeño posible para proteger datos específicos y evitar cuellos de botella.",
            "La librería estándar `net/http` es robusta y suficiente para muchas APIs. Usar frameworks como Gin o Chi cuando se necesite un enrutamiento más avanzado o middleware.",
            "Error Común: Olvidar cerrar un canal. Esto puede llevar a que las goroutines que esperan en el canal se bloqueen indefinidamente (deadlock)."
        ]
    },
    {
        agent: 'RubyAPIAgent',
        lessons: [
            "El principio de 'Fat Model, Skinny Controller' es fundamental en Rails: la lógica de negocio debe residir en el modelo (o en 'Service Objects'), dejando el controlador para el enrutamiento y la interacción con la vista.",
            "Anti-Patrón de Rendimiento: El problema N+1. Usar `includes()` o `preload()` en las consultas de Active Record para cargar anticipadamente las asociaciones y evitar consultas ineficientes.",
            "Utilizar 'Service Objects' (clases de Ruby simples y con un solo propósito) para encapsular lógica de negocio compleja que no pertenece a un modelo.",
            "La 'convención sobre configuración' de Rails acelera el desarrollo, pero es crucial entender las convenciones para no luchar contra el framework.",
            "Utilizar `ActiveModel::Serializers` para controlar la salida JSON de las APIs, manteniendo las vistas desacopladas de la estructura de la base de datos.",
            "Error Común: Validaciones faltantes en los modelos. Añadir validaciones (`validates`) a los modelos de Active Record es la primera línea de defensa para la integridad de los datos."
        ]
    },
     {
        agent: 'PHPAgent',
        lessons: [
            "Utilizar Composer para gestionar las dependencias del proyecto. El archivo `composer.lock` es crucial para garantizar que todos los desarrolladores y entornos de producción utilicen las versiones exactas de las dependencias. Registrarlo en el control de versiones.",
            "Anti-Patrón: Ejecutar `composer update` en producción, ya que puede introducir cambios en las versiones que no han sido probados.",
            "Laravel es óptimo para un despliegue rápido en proyectos de tamaño pequeño a mediano, mientras que Symfony es ideal para aplicaciones empresariales a gran escala que requieren más personalización.",
            "Seguir los estándares PSR (PHP Standards Recommendations), especialmente PSR-4 para autoloading y PSR-12 para el estilo de código, para una mejor interoperabilidad.",
            "Anti-Patrón de Seguridad: No usar sentencias preparadas (prepared statements) con PDO o un ORM, lo que expone la aplicación a inyección SQL.",
            "Utilizar el motor de plantillas Blade de Laravel o Twig de Symfony para separar la lógica de la presentación y prevenir ataques XSS con el escapado automático de salida.",
            "Error Común: No configurar correctamente el `DocumentRoot` del servidor web, exponiendo archivos sensibles como `.env` o el directorio `vendor`."
        ]
    },
    {
        agent: 'SQLDatabaseAgent',
        lessons: [
            "Aplicar la normalización de bases de datos (al menos hasta 3NF) para reducir la redundancia y mejorar la integridad de los datos.",
            "Utilizar índices en las columnas consultadas con frecuencia (especialmente claves foráneas y columnas en cláusulas WHERE) para acelerar drásticamente la recuperación de datos.",
            "Anti-Patrón: Usar `SELECT *`. Especificar solo las columnas necesarias para reducir la carga de la red y de la base de datos.",
            "Evitar el uso de funciones en columnas indexadas dentro de una cláusula `WHERE` (ej. `WHERE YEAR(fecha_creacion) = 2023`), ya que esto anula el uso del índice.",
            "Considerar la desnormalización estratégica en aplicaciones con muchas lecturas para evitar uniones complejas y mejorar el rendimiento, a costa de cierta redundancia.",
            "El problema N+1 es un anti-patrón de rendimiento crítico. Ocurre al recuperar una lista y luego hacer una consulta por cada elemento. Solucionar con un JOIN o carga anticipada.",
            "Las transacciones (ACID) son cruciales para operaciones que involucran múltiples sentencias `UPDATE` o `INSERT`. Envuelve estas operaciones en una transacción para garantizar la atomicidad.",
            "Utilizar CTEs (Common Table Expressions) con la cláusula `WITH` para hacer las consultas complejas más legibles y mantenibles."
        ]
    },
    {
        agent: 'NoSQLDatabaseAgent',
        lessons: [
            "El modelado de datos en NoSQL debe ser un 'diseño impulsado por consultas', comenzando con una comprensión profunda de cómo se accederá a los datos, no por la normalización.",
            "Anti-Patrón: 'Hotspots de datos'. Nodos o particiones que manejan tráfico desproporcionado. Evitarlo eligiendo una clave primaria con alta cardinalidad para distribuir la carga uniformemente.",
            "Para cargas de trabajo intensivas en lectura, utilizar indexación y almacenamiento en caché. Para cargas intensivas en escritura, usar operaciones por lotes y sharding.",
            "Anti-Patrón: Intentar aplicar un diseño de datos relacional (muchas colecciones/tablas con joins) a una base de datos de documentos. Esto suele resultar en un rendimiento pobre y múltiples llamadas a la BBDD.",
            "Entender el Teorema CAP (Consistencia, Disponibilidad, Tolerancia a Particiones). Las bases de datos NoSQL generalmente priorizan AP (Disponibilidad) o CP (Consistencia).",
            "La estrategia de 'embedding' (incrustar sub-documentos) es buena para datos relacionados que se leen juntos, pero puede llevar a documentos muy grandes. Usar 'referencing' (guardar IDs) para relaciones de uno a muchos o muchos a muchos.",
            "Error Común: Realizar consultas ineficientes que requieren escanear toda una colección/tabla. Asegurarse de que todas las consultas comunes estén respaldadas por un índice."
        ]
    },
    {
        agent: 'TestingAgent',
        lessons: [
            "Aplicar el Desarrollo Dirigido por Pruebas (TDD) con su ciclo 'Rojo-Verde-Refactorización' para lograr alta cobertura y un diseño de código flexible.",
            "Utilizar el Desarrollo Dirigido por el Comportamiento (BDD) para centrarse en el comportamiento del sistema desde la perspectiva del usuario final, usando un lenguaje sencillo (Dado/Cuando/Entonces).",
            "Estructurar la estrategia de pruebas siguiendo la Pirámide de Pruebas: una gran base de tests unitarios (rápidos), una capa media de tests de integración, y una pequeña cima de tests de UI (lentos).",
            "TDD se alinea con la base de la pirámide (pruebas unitarias), mientras que BDD es ideal para definir los escenarios de las capas superiores (integración y UI).",
            "React Testing Library promueve escribir pruebas que se asemejen a cómo los usuarios interactúan con la aplicación, evitando probar detalles de implementación.",
            "Los 'mocks' y 'stubs' son esenciales para aislar el código que se está probando. Utilizar librerías como Jest para simular dependencias externas como llamadas a API.",
            "Error Común: Escribir pruebas frágiles que se rompen con pequeños cambios de refactorización. Centrarse en probar el 'qué' (el comportamiento) y no el 'cómo' (la implementación).",
            "La cobertura de código es una métrica útil, pero no un objetivo final. Una cobertura del 100% no garantiza la ausencia de errores; la calidad de las aserciones es más importante."
        ]
    },
    {
        agent: 'SecurityAgent',
        lessons: [
            "Aplicar el principio de 'defensa en profundidad'. La seguridad no debe depender de una sola capa; debe haber múltiples controles (validación en cliente, en servidor, en BBDD).",
            "Validar y sanitizar SIEMPRE todas las entradas del usuario para prevenir las vulnerabilidades más comunes del OWASP Top 10, como Inyección de SQL y Cross-Site Scripting (XSS).",
            "Utilizar tokens (como JWT) para la autenticación en APIs sin estado. Almacenarlos de forma segura en el cliente (ej. en cookies `HttpOnly, Secure`).",
            "Anti-Patrón: Almacenar contraseñas en texto plano. Usar siempre un algoritmo de hash fuerte y con 'salt' (como bcrypt o Argon2).",
            "Gestionar los secretos (claves de API, credenciales) fuera del control de versiones. Usar variables de entorno o un servicio de gestión de secretos (como HashiCorp Vault o AWS Secrets Manager).",
            "Implementar el principio de 'privilegio mínimo'. Cada usuario y servicio debe tener solo los permisos estrictamente necesarios para realizar su función.",
            "Error Común: Mensajes de error demasiado detallados en producción. Pueden filtrar información sensible sobre la infraestructura. Usar mensajes de error genéricos.",
            "Mantener las dependencias del proyecto actualizadas. Las vulnerabilidades en librerías de terceros son un vector de ataque común. Usar herramientas como `npm audit` o Snyk."
        ]
    },
     {
        agent: 'DockerAgent',
        lessons: [
            "Utilizar construcciones en varias etapas (multi-stage builds) en los Dockerfiles para separar el entorno de construcción del de ejecución, reduciendo drásticamente el tamaño de la imagen y la superficie de ataque.",
            "Nombrar las etapas de construcción (`AS <NOMBRE>`) para hacer el Dockerfile más legible y resiliente a cambios en el orden de las etapas.",
            "Usar la bandera `--target` al construir una imagen para detenerse en una etapa específica, lo cual es útil para depuración o para crear imágenes de prueba.",
            "Utilizar un archivo `.dockerignore` para excluir archivos innecesarios (como `node_modules`, `.git`) y así optimizar el tamaño de la imagen y el tiempo de construcción.",
            "Anti-Patrón de Seguridad: Ejecutar el contenedor como usuario 'root'. Crear un usuario sin privilegios en el Dockerfile (`RUN addgroup... && adduser...`) y ejecutar la aplicación con él (`USER nonrootuser`).",
            "Optimizar el orden de las capas en el Dockerfile. Colocar las instrucciones que cambian con menos frecuencia (como la instalación de dependencias) antes de las que cambian a menudo (como `COPY . .`) para aprovechar la caché de Docker.",
            "Utilizar imágenes base oficiales y específicas (ej. `node:18-alpine` en lugar de `node:latest`) para tener construcciones más predecibles y seguras.",
            "Error Común: No especificar versiones de las dependencias en el Dockerfile (ej. `RUN apt-get install -y some-package`). Esto puede llevar a construcciones no reproducibles."
        ]
    },
    {
        agent: 'GoogleCloudAgent',
        lessons: [
            "Elegir entre Cloud Run y GKE es una decisión estratégica: Cloud Run para simplicidad y cargas sin estado; GKE para control profundo y arquitecturas complejas.",
            "Aplicar el principio de 'privilegio mínimo' en IAM: evitar roles básicos (owner, editor) en producción y otorgar los roles predefinidos o personalizados más limitados posibles.",
            "Crear una cuenta de servicio dedicada para cada componente de la aplicación, tratando cada uno como un límite de confianza separado.",
            "Evitar el uso de claves de cuenta de servicio si es posible. Si son necesarias, nunca registrarlas en el código fuente y rotarlas regularmente.",
            "Auditar regularmente los cambios en las políticas de IAM y el acceso a las claves utilizando Cloud Audit Logs.",
            "Utilizar Secret Manager para almacenar y gestionar de forma segura los secretos de la aplicación (claves de API, contraseñas de BBDD).",
            "Utilizar Terraform o Google Cloud Deployment Manager para gestionar la infraestructura como código (IaC), lo que permite tener entornos reproducibles y versionados.",
            "Anti-Patrón de Costos: Dejar recursos de desarrollo o prueba encendidos innecesariamente. Usar scripts de apagado automático o alertas de presupuesto."
        ]
    },
    {
        agent: 'DataStructureAgent',
        lessons: [
            "Utilizar un contenedor de datos (ej. una clave 'data') en las respuestas de la API JSON para separar los datos del negocio de los metadatos (paginación, estado).",
            "Diseñar APIs RESTful usando sustantivos en plural para los recursos (ej. `/users`) y los métodos HTTP para las acciones (`GET`, `POST`, `PUT`, `DELETE`).",
            "Incluir un esquema de versionado en la API (ej. `/api/v1/users`) desde el principio para permitir futuras actualizaciones sin romper la compatibilidad con los clientes.",
            "Utilizar los códigos de estado HTTP correctos para comunicar el resultado de una solicitud (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error).",
            "Validar la estructura y los tipos de datos de los JSON entrantes utilizando un esquema (como JSON Schema) para garantizar la consistencia de los datos.",
            "Anti-Patrón: Usar verbos en las URLs de los recursos (ej. `/getUserById`). La acción debe estar definida por el método HTTP.",
            "Error Común: Devolver errores como un `200 OK` con un cuerpo de error. Un error del cliente (4xx) o del servidor (5xx) debe reflejarse en el código de estado HTTP."
        ]
    },
    {
        agent: 'CSSAgent',
        lessons: [
            "Utilizar Flexbox para layouts en una dimensión (filas o columnas) y CSS Grid para layouts complejos en dos dimensiones.",
            "Adoptar un enfoque 'mobile-first' en el diseño responsivo. Diseñar primero para pantallas pequeñas y luego añadir estilos para pantallas más grandes con 'media queries' (`min-width`).",
            "Utilizar Custom Properties (variables CSS) para gestionar valores reutilizables como colores y espaciados, lo que facilita el mantenimiento y la creación de temas.",
            "Seguir una metodología de nomenclatura como BEM (Bloque, Elemento, Modificador) para escribir CSS modular, mantenible y evitar conflictos de especificidad.",
            "Anti-Patrón: Selectores de CSS demasiado específicos (ej. `#main .sidebar ul li a`). Esto aumenta la especificidad y hace que el CSS sea difícil de sobrescribir y mantener.",
            "Evitar el uso de `!important`, ya que es una señal de una mala estructura de CSS y dificulta la depuración.",
            "Optimizar el rendimiento del renderizado evitando animar propiedades que causan 'reflow' (como `width`, `height`, `left`). Priorizar la animación de `transform` y `opacity`.",
            "Error Común: Usar unidades de píxeles (`px`) para la tipografía. Usar unidades relativas como `rem` permite que el tamaño de la fuente se escale según las preferencias del usuario."
        ]
    }
];

let hasSeedingBeenAttempted = false;

export const seedInitialKnowledge = async () => {
    if (hasSeedingBeenAttempted) {
        return;
    }
    hasSeedingBeenAttempted = true;
    
    console.log("Checking if initial knowledge needs to be seeded...");
    for (const seed of initialKnowledge) {
        if (!vectorDbService.ALL_AGENT_STORES.includes(seed.agent)) {
            console.warn(`Agent ${seed.agent} not found in official store list. Skipping seed.`);
            continue;
        }

        try {
            const existingDocs = await vectorDbService.getAllDocuments(seed.agent);
            if (existingDocs.length === 0) {
                console.log(`Seeding knowledge for ${seed.agent}...`);
                for (const lesson of seed.lessons) {
                    const embedding = await embedContent(lesson);
                    await vectorDbService.addDocument(lesson, embedding, seed.agent);
                }
                console.log(`Successfully seeded ${seed.lessons.length} lessons for ${seed.agent}.`);
            } else {
                 console.log(`Knowledge for ${seed.agent} already exists. Skipping.`);
            }
        } catch (error) {
            console.error(`Failed to seed knowledge for ${seed.agent}:`, error);
        }
    }
};