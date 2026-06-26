import { VectorStoreEntry, AgentName } from '../types.ts';

const DB_NAME = 'AI-Agent-VectorDB-Specialists';
const DB_VERSION = 1;

let db: IDBDatabase;

export const ALL_AGENT_STORES: AgentName[] = [
    'ReactAgent', 'VueAgent', 'AngularAgent', 'CSSAgent', 'NodeAPIAgent', 
    'GoAPIAgent', 'PythonAPIAgent', 'SQLDatabaseAgent', 'NoSQLDatabaseAgent',
    'DataStructureAgent', 'TestingAgent', 'SecurityAgent', 'QualityAgent', 'TechLead', 'UIUXAgent',
    'DockerAgent', 'JavaAPIAgent', 'KotlinAPIAgent', 'SupabaseAgent', 
    'FirestoreAgent', 'GoogleCloudAgent', 'GoogleScriptsAgent',
    'RubyAPIAgent', 'PHPAgent', 'CSharpAPIAgent', 'SwiftAPIAgent',
    'DelphiAgent', 'PascalAgent', 'CAgent'
];

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error opening IndexedDB:', request.error);
            reject('Error opening IndexedDB');
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            for (const storeName of ALL_AGENT_STORES) {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    dbInstance.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
            }
        };
    });
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const addDocument = async (text: string, embedding: number[], namespace: AgentName): Promise<void> => {
    if (!ALL_AGENT_STORES.includes(namespace)) {
        console.warn(`Attempted to add document to a non-specialist namespace: ${namespace}. Skipping.`);
        return;
    }
    const db = await initDB();
    const transaction = db.transaction(namespace, 'readwrite');
    const store = transaction.objectStore(namespace);
    
    return new Promise((resolve, reject) => {
        const request = store.add({ text, embedding });
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Error adding document to vector store [${namespace}]:`, request.error);
            reject(request.error);
        };
    });
};

export const findMostSimilar = async (queryVector: number[], namespace: AgentName): Promise<{ document: VectorStoreEntry; similarity: number } | null> => {
     if (!ALL_AGENT_STORES.includes(namespace)) {
        console.warn(`Attempted to query a non-specialist namespace: ${namespace}.`);
        return null;
    }
    const db = await initDB();
    const transaction = db.transaction(namespace, 'readonly');
    const store = transaction.objectStore(namespace);

    return new Promise((resolve, reject) => {
        const getAllRequest = store.getAll();
        
        getAllRequest.onerror = () => {
             console.error(`Error fetching from vector store [${namespace}]:`, getAllRequest.error);
             reject(getAllRequest.error);
        }

        getAllRequest.onsuccess = () => {
            const documents: VectorStoreEntry[] = getAllRequest.result;
            if (documents.length === 0) {
                return resolve(null);
            }

            let bestMatch: VectorStoreEntry | null = null;
            let highestSimilarity = -1;

            for (const doc of documents) {
                if (doc.embedding && doc.embedding.length === queryVector.length) {
                    const similarity = cosineSimilarity(queryVector, doc.embedding);
                    if (similarity > highestSimilarity) {
                        highestSimilarity = similarity;
                        bestMatch = doc;
                    }
                }
            }
            
            if (bestMatch) {
                resolve({ document: bestMatch, similarity: highestSimilarity });
            } else {
                resolve(null);
            }
        };
    });
};

export const getAllDocuments = async (namespace: AgentName): Promise<VectorStoreEntry[]> => {
    if (!ALL_AGENT_STORES.includes(namespace)) {
        console.warn(`Attempted to get all documents from a non-specialist namespace: ${namespace}.`);
        return [];
    }
    const db = await initDB();
    const transaction = db.transaction(namespace, 'readonly');
    const store = transaction.objectStore(namespace);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Error getting all documents from vector store [${namespace}]:`, request.error);
            reject(request.error);
        };
    });
};

export const updateDocument = async (id: number, newText: string, newEmbedding: number[], namespace: AgentName): Promise<void> => {
    if (!ALL_AGENT_STORES.includes(namespace)) return;
    const db = await initDB();
    const transaction = db.transaction(namespace, 'readwrite');
    const store = transaction.objectStore(namespace);
    return new Promise((resolve, reject) => {
        const request = store.put({ id, text: newText, embedding: newEmbedding });
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Error updating document in vector store [${namespace}]:`, request.error);
            reject(request.error);
        };
    });
};


export const deleteDocument = async (id: number, namespace: AgentName): Promise<void> => {
    if (!ALL_AGENT_STORES.includes(namespace)) return;
    const db = await initDB();
    const transaction = db.transaction(namespace, 'readwrite');
    const store = transaction.objectStore(namespace);
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Error deleting document from vector store [${namespace}]:`, request.error);
            reject(request.error);
        };
    });
};

export const clear = async (namespace?: AgentName): Promise<void> => {
     const db = await initDB();
     const storesToClear = namespace ? [namespace] : ALL_AGENT_STORES;
     const transaction = db.transaction(storesToClear, 'readwrite');
     
     return new Promise((resolve, reject) => {
        let completed = 0;
        for (const storeName of storesToClear) {
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => {
                completed++;
                if (completed === storesToClear.length) {
                    resolve();
                }
            };
            request.onerror = () => {
                console.error(`Error clearing vector store [${storeName}]:`, request.error);
                reject(request.error);
            }
        }
        if (storesToClear.length === 0) resolve();
     });
};