import React, { useState, useEffect } from 'react';
import { FileNode } from '../types.ts';
import { FileExplorer } from './FileExplorer.tsx';
import { CodeEditor } from './CodeViewer.tsx';

interface OutputDisplayProps {
    fileTree: FileNode[];
    selectedFile: FileNode | null;
    onFileSelect: (file: FileNode) => void;
    onSaveFile: (file: FileNode, newContent: string) => void;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ fileTree, selectedFile, onFileSelect, onSaveFile }) => {
    const [editedContent, setEditedContent] = useState<string | null>(null);

    useEffect(() => {
        setEditedContent(selectedFile?.content ?? null);
    }, [selectedFile]);

    if (fileTree.length === 0) {
        return (
            <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center">
                La estructura de tu proyecto aparecerá aquí una vez generada.
            </div>
        );
    }

    const hasChanges = selectedFile && editedContent !== null && selectedFile.content !== editedContent;

    const handleSave = () => {
        if (hasChanges && selectedFile && editedContent !== null) {
            onSaveFile(selectedFile, editedContent);
        }
    };
    
    return (
        // Main container: No padding, allows parent to control spacing.
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* --- File Explorer Pane --- */}
            <div className="flex flex-col md:flex-shrink-0 md:w-1/3 lg:w-1/4 h-full bg-gray-50 rounded-md border">
                <h3 className="text-lg font-semibold text-gray-800 p-2 border-b flex-shrink-0">Explorador de Archivos</h3>
                <div className="overflow-y-auto p-2">
                    <FileExplorer 
                        nodes={fileTree} 
                        selectedFile={selectedFile} 
                        onFileSelect={onFileSelect} 
                    />
                </div>
            </div>
            
            {/* --- Code Viewer Pane --- */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {selectedFile ? (
                    <>
                        <CodeEditor 
                            fileName={selectedFile.name}
                            content={editedContent ?? ''} 
                            onContentChange={setEditedContent}
                        />
                        {hasChanges && (
                            <div className="mt-2 flex justify-end">
                                <button onClick={handleSave} className="button bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 text-sm">
                                    Guardar Cambios
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 bg-white rounded-lg p-4">
                        Selecciona un archivo para ver o editar su contenido.
                    </div>
                )}
            </div>
        </div>
    );
};