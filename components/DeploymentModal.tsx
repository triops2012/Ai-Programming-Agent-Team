import React from 'react';
import { DeploymentStatus } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeployWebContainer: () => void;
    onDeployNetlify: () => void;
    status: DeploymentStatus;
    logs: string[];
    url: string | null;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({
    isOpen, onClose, onDeployWebContainer, onDeployNetlify, status, logs, url
}) => {
    if (!isOpen) return null;

    const isDeploying = status === 'deploying';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Desplegar Proyecto</h2>
                </header>

                <main className="p-6 flex-grow overflow-y-auto">
                    {status === 'idle' && (
                        <div className="space-y-4">
                            <p className="text-gray-600">Elige un método de despliegue para probar tu aplicación.</p>
                            <button
                                onClick={onDeployWebContainer}
                                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex items-start gap-4"
                            >
                                <div className="text-2xl mt-1">⚡</div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Staging Privado (Instantáneo)</h3>
                                    <p className="text-sm text-gray-500">Usa WebContainers para ejecutar la aplicación de forma segura en tu navegador. Ideal para pruebas rápidas y privadas.</p>
                                </div>
                            </button>
                            <button
                                onClick={onDeployNetlify}
                                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex items-start gap-4"
                            >
                                <div className="text-2xl mt-1">🌍</div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Compartir en Netlify (Público)</h3>
                                    <p className="text-sm text-gray-500">Despliega una versión en una URL pública y temporal de Netlify para compartir con otros. (Actualmente simulado)</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {(status === 'deploying' || status === 'success' || status === 'error') && (
                        <div>
                            <div className="bg-gray-900 text-white font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto">
                                {logs.map((log, i) => (
                                    <p key={i} className={`whitespace-pre-wrap ${log.toLowerCase().startsWith('error') ? 'text-red-400' : 'text-gray-300'}`}>
                                        <span className="text-gray-500 mr-2">$</span>{log}
                                    </p>
                                ))}
                                {isDeploying && <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span>En progreso...</span></div>}
                            </div>
                            
                            {status === 'success' && url && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="font-bold text-green-800">¡Despliegue Exitoso!</h3>
                                    <p className="text-sm text-green-700">Tu aplicación está disponible en:</p>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                                </div>
                            )}

                             {status === 'error' && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h3 className="font-bold text-red-800">Fallo en el Despliegue</h3>
                                    <p className="text-sm text-red-700">Ocurrió un error. Revisa los logs para más detalles.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} disabled={isDeploying} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Cerrar</button>
                </footer>
            </div>
        </div>
    );
};