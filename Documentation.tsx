import React from 'react';

// THIS FILE IS DEPRECATED AND NO LONGER IN USE.
// The new documentation can be found at /components/Documentation.tsx
// This file is slated for removal in a future cleanup.

export const Documentation: React.FC = () => (
    <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400">
        <h2 className="text-xl font-bold text-yellow-800">Componente Obsoleto</h2>
        <p className="text-yellow-700 mt-2">
            Esta versión de la documentación ya no está en uso y ha sido reemplazada por el nuevo Manual de Ingeniería interactivo.
            Por favor, asegúrate de que la aplicación esté importando el componente desde <strong>/components/Documentation.tsx</strong>.
        </p>
    </div>
);
