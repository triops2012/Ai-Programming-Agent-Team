import React, { useState, useRef, useEffect } from 'react';
// FIX: Import View type from the central types file.
import { AppPhase, FileNode, View, ApiProvider } from '../types.ts';

// FIX: Removed local View type definition. It is now imported from types.ts.

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  phase: AppPhase;
  onStartNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileTree: FileNode[];
  totalXp: number;
  globalLevel: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
  localApiEndpoint: string;
  setLocalApiEndpoint: (endpoint: string) => void;
  localModels: string[];
  selectedLocalModel: string;
  setSelectedLocalModel: (model: string) => void;
  localModelStatus: 'disconnected' | 'loading' | 'connected' | 'error';
  onLoadLocalModels: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; disabled?: boolean, isCollapsed: boolean }> = ({ icon, label, isActive, onClick, disabled = false, isCollapsed }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={isCollapsed ? label : undefined}
    className={`w-full flex items-center p-3 my-1 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center' : ''}`}
  >
    <span className={`w-6 h-6 flex items-center justify-center ${!isCollapsed ? 'mr-3' : ''}`}>{icon}</span>
    {!isCollapsed && label}
  </button>
);

const icons: Record<View | 'collaboration_active' | 'new_project' | 'expand' | 'collapse' | 'save' | 'load' | 'experience' | 'api_settings', React.ReactNode> = {
    planning: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>,
    collaboration: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72-3.72a1.05 1.05 0 0 1 0-1.487l3.72-3.72ZM3.75 8.511c-.884.284-1.5 1.128-1.5 2.097v4.286c0 1.136.847 2.1 1.98 2.193l3.72-3.72a1.05 1.05 0 0 1 0-1.487l-3.72-3.72Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5v21m-6.75-16.5v15" /><path strokeLinecap="round" strokeLinejoin="round" d="m18.75 3-15 15" /></svg>,
    ide: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    monitoring: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    statistics: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    experience: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M12 12c0-.621.504-1.125 1.125-1.125h.872c.621 0 1.125.504 1.125 1.125v3.375m0 0a3 3 0 0 0-3-3h-1.5a3 3 0 0 0-3 3m0 0h.007v.008H9.75v-.008Zm.375 0a3.004 3.004 0 0 1-2.995-2.129M15 12v3.375m0 0a3 3 0 0 1-3 3M15 12a3 3 0 0 0-3-3m0 0a3 3 0 0 0-3 3m0 0h.007v.008H9.75v-.008Zm.375 0a3.004 3.004 0 0 0 2.995-2.129m-2.995 2.129v-3.375c0-.621-.503-1.125-1.125-1.125H9.751c-.621 0-1.125.504-1.125 1.125v3.375" /></svg>,
    knowledge: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a.75.75 0 0 0 .75-.75V11.25a.75.75 0 0 0-1.5 0v6A.75.75 0 0 0 12 18ZM12 7.5h.008v.008H12V7.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>,
    console: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>,
    docs: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>,
    collaboration_active: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72-3.72a1.05 1.05 0 0 1 0-1.487l3.72-3.72ZM3.75 8.511c-.884.284-1.5 1.128-1.5 2.097v4.286c0 1.136.847 2.1 1.98 2.193l3.72-3.72a1.05 1.05 0 0 1 0-1.487l-3.72-3.72Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5v21m-6.75-16.5v15" /><path strokeLinecap="round" strokeLinejoin="round" d="m18.75 3-15 15" /></svg>,
    new_project: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    expand: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
    collapse: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
    save: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
    load: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>,
    api_settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>,
};


export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
      activeView, setActiveView, phase, onStartNewProject, onSaveProject, onLoadProject,
      fileTree, totalXp, globalLevel, xpInCurrentLevel, xpForNextLevel,
      apiProvider, setApiProvider, localApiEndpoint, setLocalApiEndpoint, localModels,
      selectedLocalModel, setSelectedLocalModel, localModelStatus, onLoadLocalModels
  } = props;
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const isProjectGenerated = phase === 'collaboration' || fileTree.length > 0;
  const loadInputRef = useRef<HTMLInputElement>(null);
  const progressPercentage = xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;

  const handleLoadClick = () => {
    loadInputRef.current?.click();
  };
  
  const statusIndicator = {
      disconnected: { text: 'Desconectado', color: 'bg-gray-400' },
      loading: { text: 'Cargando...', color: 'bg-yellow-400 animate-pulse' },
      connected: { text: 'Conectado', color: 'bg-green-500' },
      error: { text: 'Error', color: 'bg-red-500' },
  }[localModelStatus];

  return (
    <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 p-2' : 'w-64 p-4'}`}>
      <div className={`flex ${isCollapsed ? 'items-center justify-center' : 'items-start justify-start'} h-12`}>
        {isCollapsed ? (
            <div className="text-3xl font-bold">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" /></svg>
            </div>
        ) : (
            <div>
                <h1 className="text-2xl font-bold">MultiDevAgent</h1>
                <p className="text-orange-500 text-xs font-semibold">by Raúl Navas Montero</p>
            </div>
        )}
      </div>

       {!isCollapsed && (
          <div className="my-2 py-2">
            <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-blue-400">Nivel General {globalLevel}</span>
                <span className="text-xs text-slate-400 font-mono">{totalXp} XP Total</span>
            </div>
             <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
             <div className="text-right text-xs text-slate-400 mt-1 font-mono">
                {xpInCurrentLevel} / {xpForNextLevel} XP
            </div>
          </div>
      )}
      
      <nav className="flex-grow">
        <NavItem
          icon={icons.planning}
          label="Planificación"
          isActive={activeView === 'planning'}
          onClick={() => setActiveView('planning')}
          disabled={phase === 'collaboration'}
          isCollapsed={isCollapsed}
        />
        {phase === 'collaboration' && (
             <NavItem
              icon={icons.collaboration_active}
              label="Sala de Colaboración"
              isActive={activeView === 'collaboration'}
              onClick={() => setActiveView('collaboration')}
              isCollapsed={isCollapsed}
            />
        )}
        <NavItem
          icon={icons.ide}
          label="IDE de Desarrollo"
          isActive={activeView === 'ide'}
          onClick={() => setActiveView('ide')}
          disabled={!isProjectGenerated}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={icons.monitoring}
          label="Monitor de Proyecto"
          isActive={activeView === 'monitoring'}
          onClick={() => setActiveView('monitoring')}
          disabled={!isProjectGenerated}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={icons.statistics}
          label="Estadísticas API"
          isActive={activeView === 'statistics'}
          onClick={() => setActiveView('statistics')}
          disabled={!isProjectGenerated}
          isCollapsed={isCollapsed}
        />
         <NavItem
          icon={icons.experience}
          label="Experiencia y Logros"
          isActive={activeView === 'experience'}
          onClick={() => setActiveView('experience')}
          disabled={!isProjectGenerated}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={icons.knowledge}
          label="Monitor de Conocimiento"
          isActive={activeView === 'knowledge'}
          onClick={() => setActiveView('knowledge')}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={icons.console}
          label="Consola de Agente"
          isActive={activeView === 'console'}
          onClick={() => setActiveView('console')}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={icons.docs}
          label="Documentación"
          isActive={activeView === 'docs'}
          onClick={() => setActiveView('docs')}
          isCollapsed={isCollapsed}
        />
      </nav>
      
      <div className="mt-auto">
        <div className={`pt-4 ${!isCollapsed ? 'border-t border-slate-700' : ''}`}>
             {!isCollapsed && (
                <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-slate-300">Configuración de API</h4>
                    <select
                        value={apiProvider}
                        onChange={(e) => setApiProvider(e.target.value as ApiProvider)}
                        className="w-full p-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                    >
                        <option value="gemini">Google Gemini API</option>
                        <option value="local">Local (LM Studio)</option>
                    </select>
                    {apiProvider === 'local' && (
                        <div className="mt-2 space-y-2">
                             <div className="flex items-center gap-2">
                                 <input
                                    type="text"
                                    value={localApiEndpoint}
                                    onChange={(e) => setLocalApiEndpoint(e.target.value)}
                                    placeholder="http://localhost:1234/v1"
                                    className="w-full p-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                                />
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusIndicator.color}`} title={statusIndicator.text}></div>
                             </div>
                             <button onClick={onLoadLocalModels} disabled={localModelStatus === 'loading'} className="w-full text-xs bg-blue-600 hover:bg-blue-700 rounded p-1.5 disabled:bg-blue-400">
                                {localModelStatus === 'loading' ? 'Cargando...' : 'Cargar Modelos'}
                            </button>
                             <select
                                value={selectedLocalModel}
                                onChange={(e) => setSelectedLocalModel(e.target.value)}
                                disabled={localModels.length === 0}
                                className="w-full p-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                            >
                                {localModels.length > 0 ? (
                                    localModels.map(model => <option key={model} value={model}>{model}</option>)
                                ) : (
                                    <option>Carga modelos primero</option>
                                )}
                            </select>
                        </div>
                    )}
                </div>
            )}
             <div className="space-y-2">
                 <button
                    onClick={onSaveProject}
                    title={isCollapsed ? 'Guardar Proyecto' : undefined}
                    disabled={fileTree.length === 0}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
                 >
                    <span className={!isCollapsed ? 'mr-2' : ''}>{icons.save}</span>
                    {!isCollapsed && 'Guardar Proyecto'}
                 </button>
                 <button
                    onClick={handleLoadClick}
                    title={isCollapsed ? 'Cargar Proyecto' : undefined}
                    className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                 >
                    <span className={!isCollapsed ? 'mr-2' : ''}>{icons.load}</span>
                    {!isCollapsed && 'Cargar Proyecto'}
                 </button>
                 <input
                    type="file"
                    ref={loadInputRef}
                    onChange={onLoadProject}
                    className="hidden"
                    accept=".json,application/json"
                 />
                 <button
                  onClick={onStartNewProject}
                  title={isCollapsed ? 'Iniciar Nuevo Proyecto' : undefined}
                  className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center mt-4"
                >
                  <span className={!isCollapsed ? 'mr-2' : ''}>{icons.new_project}</span>
                  {!isCollapsed && 'Nuevo Proyecto'}
                </button>
             </div>
        </div>
        
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-3 mt-4 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg"
            title={isCollapsed ? 'Expandir barra lateral' : 'Replegar barra lateral'}
        >
             {isCollapsed ? icons.expand : icons.collapse}
        </button>
      </div>
    </aside>
  );
};