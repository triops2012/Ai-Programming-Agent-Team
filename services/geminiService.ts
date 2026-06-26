import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatEntry, ApiProvider } from '../types.ts';

// The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
// It is assumed to be pre-configured and available in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 2000; // Start with 2 seconds

// This variable is no longer needed for embeddings but is kept for context if other provider-specific logic is added.
let currentApiProvider: ApiProvider = 'gemini';

export const setApiProvider = (provider: ApiProvider) => {
    currentApiProvider = provider;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const callGeminiAPI = async (prompt: string, chatHistory: ChatEntry[], options: { requestJson: boolean, apiSettings: { provider: ApiProvider, model: string, endpoint: string } }): Promise<GenerateContentResponse> => {
    let lastError: Error | null = null;
    const { apiSettings, requestJson } = options;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (apiSettings.provider === 'local') {
                const endpoint = apiSettings.endpoint.replace(/\/$/, '') + '/chat/completions';
                const body = {
                    model: apiSettings.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    stream: false,
                    max_tokens: 4096, // Aumentar el límite de tokens para evitar truncamiento
                    // FIX: The 'response_format' with 'json_object' is not universally supported
                    // by all models/servers via LM Studio, causing a 400 error. The prompts are already
                    // explicit about requiring JSON output, which is a more compatible method.
                    // The parameter is therefore removed for local calls.
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`LM Studio API Error: ${response.status} - ${errorBody}`);
                }

                const data = await response.json();
                const textContent = data.choices[0]?.message?.content || '';

                // Adapt OpenAI-compatible response to GenerateContentResponse format
                return {
                    text: textContent,
                    usageMetadata: {
                        promptTokenCount: data.usage?.prompt_tokens || 0,
                        candidatesTokenCount: data.usage?.completion_tokens || 0,
                        totalTokenCount: data.usage?.total_tokens || 0,
                    },
                    // Mock other properties to satisfy the type
                    candidates: [{
                        content: { parts: [{ text: textContent }], role: 'model' },
                        finishReason: 'STOP',
                        index: 0,
                        safetyRatings: [],
                        tokenCount: data.usage?.completion_tokens || 0,
                    }],
                    promptFeedback: {
                        blockReason: 'UNKNOWN',
                        safetyRatings: [],
                    },
                    functionCalls: undefined, 
                } as unknown as GenerateContentResponse;
            } else {
                // Original Gemini Logic
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        ...(requestJson && { responseMimeType: "application/json" }),
                    }
                });
                const text = response.text; 
                return response;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error en la API (Intento ${attempt}/${MAX_RETRIES}):`, error);
            lastError = new Error(`Error en la llamada a la API: ${errorMessage}`);
            
            if (errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('503')) {
                if (attempt < MAX_RETRIES) {
                    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    console.log(`Reintentando en ${Math.round(delay / 1000)} segundos...`);
                    await sleep(delay);
                }
            } else {
                break;
            }
        }
    }
    
    throw lastError;
};

export const embedContent = async (text: string): Promise<number[]> => {
    // FIX: This function will now always use the Google Gemini API for embeddings,
    // ensuring high-quality RAG capabilities regardless of the selected generation model.
    // The previous check for 'local' provider has been removed.
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.embedContent({
                model: "gemini-embedding-2-preview",
                contents: text
            });
            
            const embedding = response.embeddings?.[0]?.values;

            if (!embedding || embedding.length === 0) {
                throw new Error("La API no devolvió un vector de embedding.");
            }
            return embedding;

        } catch (error) {
            console.error(`Error en la API de embedding de Gemini (Intento ${attempt}/${MAX_RETRIES}):`, error);
            lastError = new Error(`Error al generar el embedding: ${error instanceof Error ? error.message : String(error)}`);

            if (attempt < MAX_RETRIES) {
                const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
                console.log(`Reintentando embedding en ${Math.round(delay / 1000)} segundos...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}