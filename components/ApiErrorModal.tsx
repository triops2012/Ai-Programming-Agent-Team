import React from 'react';

interface ApiErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage: string;
}

export const ApiErrorModal: React.FC<ApiErrorModalProps> = ({ isOpen, onClose, errorMessage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
                        ⚠️
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Sistema en Pausa</h2>
                        <p className="text-sm text-gray-600">Se ha producido un error de comunicación con la IA.</p>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-gray-700 mb-2">El sistema no pudo conectar con el servicio de IA después de varios reintentos. El proceso se ha pausado.</p>
                    <p className="text-sm text-gray-500">Puedes intentar continuar el proceso, pero si el error persiste, considera reiniciar el proyecto.</p>
                    <details className="mt-4 text-xs bg-gray-100 p-2 rounded">
                        <summary className="cursor-pointer text-gray-600">Detalles del error</summary>
                        <p className="mt-2 text-red-700 font-mono">{errorMessage}</p>
                    </details>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Entendido, continuar
                    </button>
                </div>
            </div>
        </div>
    );
};
