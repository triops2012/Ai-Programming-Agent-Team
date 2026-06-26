import React from 'react';

interface CodeEditorProps {
    content: string;
    onContentChange: (newContent: string) => void;
    fileName: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onContentChange, fileName }) => {
    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-inner">
            <div className="bg-gray-700 p-2.5 rounded-t-lg text-white font-mono text-sm border-b border-gray-600">
                {fileName}
            </div>
            <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full p-4 bg-gray-900 text-gray-200 font-mono text-sm border-none rounded-b-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck="false"
            />
        </div>
    );
};
