
import { ChatMessage } from '../types.ts';
import { PlanningAgent } from './planning.agent.ts';
import { ProjectManagementAgent, VersionControlAgent } from './management.agent.ts';
import { DatabaseAgent, DataStructureAgent, HighPerformanceAgent } from './development.agent.ts';
import { DeploymentAgent, AutomationAgent, AIAgent, RAGAgent } from './infrastructure.agent.ts';
import { QualityReviewAgent } from './quality.agent.ts';

interface Agent {
    getPrompt: (request: string, history: ChatMessage[]) => string;
}

interface RoutedAgent {
    agent: Agent;
    agentName: string;
}

const routeRequest = (request: string): RoutedAgent => {
    const lowerCaseRequest = request.toLowerCase();

    // Management Agents
    if (lowerCaseRequest.includes('proyecto') || lowerCaseRequest.includes('roadmap') || lowerCaseRequest.includes('planificación') || lowerCaseRequest.includes('scrum') || lowerCaseRequest.includes('historia de usuario') || lowerCaseRequest.includes('sprint')) {
        return { agent: ProjectManagementAgent, agentName: 'Agente de Gestión de Proyectos' };
    }
    if (lowerCaseRequest.includes('git') || lowerCaseRequest.includes('github') || lowerCaseRequest.includes('repositorio') || lowerCaseRequest.includes('commit') || lowerCaseRequest.includes('rama') || lowerCaseRequest.includes('versión')) {
        return { agent: VersionControlAgent, agentName: 'Agente de Control de Versiones' };
    }

    // Development Agents
    if (lowerCaseRequest.includes('sql') || lowerCaseRequest.includes('database') || lowerCaseRequest.includes('base de datos') || lowerCaseRequest.includes('mariadb') || lowerCaseRequest.includes('supabase') || lowerCaseRequest.includes('firestore') || lowerCaseRequest.includes('esquema')) {
        return { agent: DatabaseAgent, agentName: 'Agente de Bases de Datos' };
    }
    if (lowerCaseRequest.includes('json') || lowerCaseRequest.includes('xml') || lowerCaseRequest.includes('api') || lowerCaseRequest.includes('restful')) {
        return { agent: DataStructureAgent, agentName: 'Agente de Estructura de Datos' };
    }
    if (lowerCaseRequest.includes('python') || lowerCaseRequest.includes('c++') || lowerCaseRequest.includes('rendimiento') || lowerCaseRequest.includes('optimización')) {
        return { agent: HighPerformanceAgent, agentName: 'Agente de Alto Rendimiento' };
    }

    // Infrastructure Agents
    if (lowerCaseRequest.includes('despliegue') || lowerCaseRequest.includes('ejecutar') || lowerCaseRequest.includes('probar') || lowerCaseRequest.includes('microservicio') || lowerCaseRequest.includes('docker')) {
        return { agent: DeploymentAgent, agentName: 'Agente de Despliegue y Ejecución' };
    }
    if (lowerCaseRequest.includes('google scripts') || lowerCaseRequest.includes('make.com') || lowerCaseRequest.includes('automatización')) {
        return { agent: AutomationAgent, agentName: 'Agente de Automatización' };
    }
    if (lowerCaseRequest.includes('ia') || lowerCaseRequest.includes('inteligencia artificial') || lowerCaseRequest.includes('gemini')) {
        return { agent: AIAgent, agentName: 'Agente de IA' };
    }
    if (lowerCaseRequest.includes('rag') || lowerCaseRequest.includes('conocimiento') || lowerCaseRequest.includes('búsqueda web')) {
        return { agent: RAGAgent, agentName: 'Agente RAG' };
    }

    // Quality Agents
    if (lowerCaseRequest.includes('revisión de código') || lowerCaseRequest.includes('análisis') || lowerCaseRequest.includes('calidad') || lowerCaseRequest.includes('seguridad')) {
        return { agent: QualityReviewAgent, agentName: 'Agente de Calidad y Revisoría' };
    }

    // Default to the Planning Agent (Architect)
    return { agent: PlanningAgent, agentName: 'Agente Arquitecto' };
};

export const AgentRouter = {
    routeRequest,
};