import React, { useEffect, useRef } from 'react';
import { LogEntry, LogType } from '../types.ts';

interface LogWidgetProps {
    logs: LogEntry[];
}

const logDetails: Record<LogType, { icon: string; color: string }> = {
    [LogType.Info]: { icon: '⚙️', color: 'text-gray-800' },
    [LogType.Success]: { icon: '✅', color: 'text-green-600' },
    [LogType.Warning]: { icon: '⚠️', color: 'text-yellow-600' },
    [LogType.Error]: { icon: '❌', color: 'text-red-600' },
    [LogType.Delegation]: { icon: '➡️', color: 'text-blue-600' }
};


export const LogWidget: React.FC<LogWidgetProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Registro de Actividad del Agente</h2>
            <div ref={logContainerRef} className="bg-gray-50 p-4 rounded-lg overflow-y-auto font-mono text-sm space-y-2 border border-gray-200 shadow-inner flex-grow">
                {logs.length > 0 ? logs.map((log) => {
                    const { icon, color } = logDetails[log.type];
                    return (
                        <p key={`${log.timestamp.toISOString()}-${log.message}`} className="flex items-start">
                            <span className="font-bold mr-2 select-none">{icon}</span>
                            <span className={color}>{log.message}</span>
                        </p>
                    )
                }) : <p className="text-gray-500">El registro de actividad del agente aparecerá aquí...</p>}
            </div>
        </div>
    );
};