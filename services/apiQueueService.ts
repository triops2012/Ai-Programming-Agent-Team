import { GenerateContentResponse } from '@google/genai';
import { callGeminiAPI } from './geminiService.ts';
import { ApiUsageLog, AgentName, ApiCallContext, ApiProvider } from '../types.ts';

const RATE_LIMIT_RPM = 55; // Requests per minute (set slightly below the 60 RPM limit for safety)
const QUEUE_PROCESS_INTERVAL_MS = 200; // Check the queue every 200ms

interface ApiSettings {
    provider: ApiProvider;
    model: string;
    endpoint: string;
}

interface QueueItem {
    prompt: string;
    options: { requestJson: boolean; apiSettings: ApiSettings };
    context: ApiCallContext;
    resolve: (response: GenerateContentResponse) => void;
    reject: (error: Error) => void;
}

let requestQueue: QueueItem[] = [];
let requestTimestamps: number[] = [];
let isProcessing = false;
let logApiUsageCallback: ((log: Omit<ApiUsageLog, 'id'>) => void) | null = null;

const processQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(ts => now - ts < 60000);

    if (requestTimestamps.length < RATE_LIMIT_RPM && requestQueue.length > 0) {
        const item = requestQueue.shift()!;
        requestTimestamps.push(Date.now());
        
        const startTime = Date.now();
        try {
            const response = await callGeminiAPI(item.prompt, [], { 
                requestJson: item.options.requestJson,
                apiSettings: item.options.apiSettings
            });
            const latencyMs = Date.now() - startTime;
            
            if (logApiUsageCallback) {
                logApiUsageCallback({
                    timestamp: new Date().toISOString(),
                    agentName: item.context.agentName,
                    sprintId: item.context.sprintId,
                    storyId: item.context.storyId,
                    inputTokens: response.usageMetadata?.promptTokenCount || 0,
                    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
                    status: 'success',
                    latencyMs,
                });
            }
            item.resolve(response);
        } catch (error) {
             const latencyMs = Date.now() - startTime;
             if (logApiUsageCallback) {
                logApiUsageCallback({
                    timestamp: new Date().toISOString(),
                    agentName: item.context.agentName,
                    sprintId: item.context.sprintId,
                    storyId: item.context.storyId,
                    inputTokens: 0,
                    outputTokens: 0,
                    status: 'failure',
                    latencyMs,
                });
            }
            item.reject(error as Error);
        }
    }

    isProcessing = false;
};

setInterval(processQueue, QUEUE_PROCESS_INTERVAL_MS);

export const initialize = (logCallback: (log: Omit<ApiUsageLog, 'id'>) => void) => {
    logApiUsageCallback = logCallback;
};

export const enqueueRequest = (
    prompt: string,
    options: { requestJson: boolean; apiSettings: ApiSettings },
    context: ApiCallContext
): Promise<GenerateContentResponse> => {
    return new Promise((resolve, reject) => {
        // Fix: Changed the type of 'response' to 'GenerateContentResponse | null' to handle potential null returns from the API call.
        requestQueue.push({ prompt, options, context, resolve: resolve as (response: GenerateContentResponse) => void, reject });
    });
};
