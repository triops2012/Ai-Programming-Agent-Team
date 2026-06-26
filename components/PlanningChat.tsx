
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface PlanningChatProps {
    messages: ChatMessage[];
    onExampleClick: (text: string) => void;
}

const ExamplePrompt: React.FC<{text: string, onClick: (text: string) => void}> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="w-full text-left text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors"
    >
        <strong>Prueba con:</strong> "{text}"
    </button>
);

export const PlanningChat: React.FC<PlanningChatProps> = ({ messages, onExampleClick }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div 
            ref={chatContainerRef}
            className="h-full overflow-y-auto space-y-4"
        >
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-800">Panel de Planificación</h3>
                    <p>Soy el Agente Arquitecto. Describe tu idea de proyecto en el cuadro de abajo para comenzar.</p>
                    
                    <div className="mt-6 w-full max-w-2xl text-left">
                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800 rounded-r-lg">
                            <h4 className="font-bold">💡 Consejo Profesional para Proyectos Escalables</h4>
                            <p className="text-xs mt-1">Para maximizar el trabajo en paralelo de los equipos, describe tu proyecto en términos de **servicios independientes**.</p>
                            <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                                <li><strong>Define Límites Claros:</strong> En lugar de "una app de red social", prueba con "una app con servicios separados para Perfiles de Usuario, Feed de Noticias y Chat en Tiempo Real".</li>
                                <li><strong>Especifica la Comunicación:</strong> Menciona cómo se comunican. Por ejemplo, "...los servicios se comunican a través de una API REST".</li>
                                <li><strong>Usa Palabras Clave:</strong> Incluye términos como "arquitectura de microservicios" para guiar la planificación de la IA.</li>
                            </ul>
                        </div>
                    </div>

                     <div className="mt-4 w-full max-w-2xl space-y-2">
                        <ExamplePrompt text="Una app de tareas con un servicio de Usuarios y otro de Tareas, comunicados por una API REST." onClick={onExampleClick} />
                        <ExamplePrompt text="Una plataforma de blogs con un servicio para Artículos y otro para Comentarios, usando una arquitectura de microservicios." onClick={onExampleClick} />
                    </div>
                </div>
            ) : (
                messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                        {msg.author === 'agent' && (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                                A
                            </div>
                        )}
                        <div className={`max-w-2xl p-3 rounded-xl ${
                            msg.author === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-800'
                        }`}>
                            {msg.author === 'agent' ? <MarkdownRenderer content={msg.content} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
                        </div>
                         {msg.author === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                                U
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};