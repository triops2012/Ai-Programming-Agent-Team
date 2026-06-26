import React from 'react';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, placeholder }) => {
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <textarea 
                className="w-full h-24 sm:h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm resize-none bg-slate-100 text-gray-900"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button
                onClick={onSend}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 h-auto sm:h-24 flex-shrink-0"
            >
                Enviar
            </button>
        </div>
    );
};