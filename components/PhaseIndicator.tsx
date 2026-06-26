import React from 'react';
import { AppPhase } from '../types.ts';

interface PhaseIndicatorProps {
    currentPhase: AppPhase;
}

const phases: { id: AppPhase | 'reviewing', label: string }[] = [
    { id: 'planning', label: 'Planificación' },
    { id: 'generating', label: 'Generación' },
    { id: 'reviewing', label: 'Revisión' },
];

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
    let activeIndex = phases.findIndex(p => p.id === currentPhase);
    
    // 'suggesting' is part of the 'reviewing' phase visually.
    if (currentPhase === 'suggesting') {
        activeIndex = 2;
    }
    // If we're generating, we consider the planning phase as complete.
    if (currentPhase === 'generating') {
        activeIndex = 1; 
    }
     // If we're reviewing, both planning and generation are complete.
    if (currentPhase === 'reviewing' || currentPhase === 'suggesting') {
        activeIndex = 2;
    }


    return (
        <div className="w-full bg-white p-3 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
                {phases.map((phase, index) => (
                    <React.Fragment key={phase.id}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                                index <= activeIndex ? 'bg-blue-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
                            }`}>
                                {index < activeIndex ? '✔' : index + 1}
                            </div>
                            <span className={`ml-3 font-semibold transition-colors duration-300 ${
                                index <= activeIndex ? 'text-gray-800' : 'text-gray-400'
                            }`}>{phase.label}</span>
                        </div>
                        {index < phases.length - 1 && (
                             <div className="flex-1 h-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-600 transition-all duration-500`} style={{ width: index < activeIndex ? '100%' : '0%' }}></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};