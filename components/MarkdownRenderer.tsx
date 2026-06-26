import React, { useRef, useEffect } from 'react';

declare const hljs: any;

const showCopiedFeedback = (button: HTMLButtonElement) => {
    const originalText = button.textContent;
    button.textContent = 'Copiado!';
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1500);
};

const renderTextWithFormatting = (text: string) => {
    const lines = text.split('\n').map((line, index) => {
        if (line.trim().startsWith('* ')) {
            const content = line.trim().substring(2);
            return (
                <li key={index} className="ml-5 list-disc">
                    {content.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => 
                        part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part
                    )}
                </li>
            );
        }
        // Return paragraph only for non-empty lines to avoid extra space
        if (line.trim() === '') return null;
        return (
            <p key={index} className="my-1">
                {line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => 
                    part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part
                )}
            </p>
        );
    }).filter(Boolean); // Filter out nulls from empty lines

    // Check if there are any list items to wrap them in a <ul>
    const listItems = lines.filter(el => el?.type === 'li');
    if (listItems.length > 0) {
        return <ul>{lines}</ul>;
    }

    return <>{lines}</>;
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(```[\s\S]*?```)/g).filter(part => part);

    return (
        <>
            {parts.map((part, index) => {
                const codeBlockMatch = part.match(/^```(\w*)\n([\s\S]*?)```$/);

                if (codeBlockMatch) {
                    const language = codeBlockMatch[1] || 'plaintext';
                    const code = codeBlockMatch[2];
                    const codeRef = useRef<HTMLElement>(null);

                    useEffect(() => {
                        if (codeRef.current && typeof hljs !== 'undefined') {
                            try {
                                hljs.highlightElement(codeRef.current);
                            } catch (error) {
                                console.error("Error no crítico durante el resaltado de código:", error);
                                // Se captura el error para evitar que la aplicación se bloquee.
                                // El bloque de código simplemente no se resaltará.
                            }
                        }
                    }, [code]);

                    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
                        navigator.clipboard.writeText(code);
                        showCopiedFeedback(e.currentTarget);
                    };

                    return (
                        <div key={index} className="my-3 bg-gray-800 rounded-lg shadow-inner relative text-left">
                            <div className="bg-gray-700 p-2 rounded-t-lg text-white font-mono text-sm border-b border-gray-600 flex justify-between items-center">
                                <span className="text-gray-300">{language}</span>
                                <button onClick={handleCopy} className="text-gray-200 hover:text-white text-xs font-sans bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors">
                                    Copiar
                                </button>
                            </div>
                            <pre className="text-gray-200 p-4 w-full overflow-auto whitespace-pre-wrap break-words text-sm">
                                <code ref={codeRef} className={`language-${language}`}>
                                    {code}
                                </code>
                            </pre>
                        </div>
                    );
                }
                
                return <div key={index}>{renderTextWithFormatting(part)}</div>;
            })}
        </>
    );
};