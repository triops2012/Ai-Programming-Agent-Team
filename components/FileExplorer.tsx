
import React, { useState } from 'react';
import { FileNode } from '../types.ts';

interface FileExplorerProps {
    nodes: FileNode[];
    selectedFile: FileNode | null;
    onFileSelect: (file: FileNode) => void;
}

const FileNodeItem: React.FC<{ 
    node: FileNode; 
    selectedFile: FileNode | null; 
    onFileSelect: (file: FileNode) => void; 
    level: number; 
    path: string;
    expandedFolders: { [key: string]: boolean };
    onToggle: (path: string) => void;
}> = ({ node, selectedFile, onFileSelect, level, path, expandedFolders, onToggle }) => {
    const currentPath = `${path}/${node.name}`;
    const isExpanded = !!expandedFolders[currentPath];

    const isSelected = selectedFile
        ? (node === selectedFile) || (selectedFile.path !== undefined && `${selectedFile.path}/${selectedFile.name}` === currentPath)
        : false;

    const handleSelect = () => {
        if (node.type === 'file') {
            onFileSelect({ ...node, path: path });
        } else if (node.type === 'folder') {
            onToggle(currentPath);
        }
    };

    return (
        <div>
            <div 
                onClick={handleSelect}
                className={`flex items-center p-1.5 rounded-md cursor-pointer transition-colors duration-150 ${
                    isSelected ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-200 text-gray-800'
                }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                <span className="mr-2 select-none w-4 text-center text-gray-500">
                    {node.type === 'folder' ? (isExpanded ? '▼' : '►') : '📄'}
                </span>
                <span>{node.name}</span>
            </div>
            {node.type === 'folder' && isExpanded && node.children && (
                <div>
                    {node.children.map((child, index) => (
                        <FileNodeItem 
                            key={`${currentPath}-${child.name}-${index}`} 
                            node={child} 
                            selectedFile={selectedFile} 
                            onFileSelect={onFileSelect} 
                            level={level + 1} 
                            path={currentPath}
                            expandedFolders={expandedFolders}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, selectedFile, onFileSelect }) => {
    const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

    const handleToggle = (path: string) => {
        setExpandedFolders(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };
    
    return (
        <div className="space-y-1">
            {nodes.map((node, index) => (
                <FileNodeItem 
                    key={`${node.name}-${index}`} 
                    node={node} 
                    selectedFile={selectedFile} 
                    onFileSelect={onFileSelect} 
                    level={0} 
                    path=""
                    expandedFolders={expandedFolders}
                    onToggle={handleToggle}
                />
            ))}
        </div>
    );
};