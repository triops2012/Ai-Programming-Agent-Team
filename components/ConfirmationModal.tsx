import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    children: React.ReactNode;
    confirmButtonText?: string;
    confirmButtonColor?: 'red' | 'blue';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    title, 
    children,
    confirmButtonText = 'Confirmar',
    confirmButtonColor = 'red'
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-600">{children}</p>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-6 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-6 py-2 rounded-md text-white font-semibold focus:outline-none focus:ring-2 ${colorClasses[confirmButtonColor]}`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};