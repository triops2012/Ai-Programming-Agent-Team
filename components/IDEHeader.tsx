import React, { useState, useRef, useEffect } from 'react';

interface IDEHeaderProps {
    onDeploy: () => void;
    onRefactor: () => void;
    onGenerateReadme: () => void;
    onDownloadZip: () => void;
    onDownloadWithDocker: () => void;
    isAutonomousMode: boolean;
    onToggleAutonomousMode: () => void;
    onResumeSprints?: () => void;
    canResumeSprints?: boolean;
    onAnalyzeFileNames: () => void;
}

export const IDEHeader: React.FC<IDEHeaderProps> = ({
    onDeploy, onRefactor, onGenerateReadme, 
    onDownloadZip, onDownloadWithDocker,
    isAutonomousMode, onToggleAutonomousMode,
    onResumeSprints, canResumeSprints,
    onAnalyzeFileNames
}) => {
    const [isAiActionsOpen, setIsAiActionsOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const aiActionsDropdownRef = useRef<HTMLDivElement>(null);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (aiActionsDropdownRef.current && !aiActionsDropdownRef.current.contains(event.target as Node)) {
                setIsAiActionsOpen(false);
            }
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
                setIsDownloadOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex-shrink-0 p-3 border-b bg-white flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Centro de Comando IDE</h2>
            <div className="flex items-center gap-2">
                {/* Autonomous Mode Toggle */}
                <div className="flex items-center gap-2 mr-4">
                    <label htmlFor="autonomous-toggle" className="text-sm font-semibold text-gray-700 cursor-pointer">Modo Autónomo</label>
                    <button
                        id="autonomous-toggle"
                        onClick={onToggleAutonomousMode}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 ${isAutonomousMode ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isAutonomousMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                {canResumeSprints && onResumeSprints && (
                     <button
                        onClick={onResumeSprints}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 flex items-center gap-2 text-sm"
                    >
                        ▶️ Reanudar Sprints
                    </button>
                )}

                {/* Download Dropdown */}
                 <div className="relative" ref={downloadDropdownRef}>
                    <button
                        onClick={() => setIsDownloadOpen(prev => !prev)}
                        className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Descargar Código
                        <svg className={`w-4 h-4 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isDownloadOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border">
                            <ul className="py-1">
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onDownloadZip(); setIsDownloadOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Descargar como .zip</a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onDownloadWithDocker(); setIsDownloadOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Descargar con archivos Docker</a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    onClick={onDeploy}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                    🚀 Desplegar
                </button>
                <div className="relative" ref={aiActionsDropdownRef}>
                    <button
                        onClick={() => setIsAiActionsOpen(prev => !prev)}
                        className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-800 flex items-center gap-2 text-sm"
                    >
                        🤖 Acciones de IA
                        <svg className={`w-4 h-4 transition-transform ${isAiActionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isAiActionsOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
                            <ul className="py-1">
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onRefactor(); setIsAiActionsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Refactorizar Proyecto</a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onGenerateReadme(); setIsAiActionsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Generar README.md</a>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onAnalyzeFileNames(); setIsAiActionsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Analizar Nombres de Archivos</a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};