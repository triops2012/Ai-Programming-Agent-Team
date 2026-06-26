
import React, { useState, useEffect } from 'react';

interface MessageBoxProps {
    text: string;
    type: 'success' | 'error';
}

export const MessageBox: React.FC<MessageBoxProps> = ({ text, type }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 2800);
        return () => clearTimeout(timer);
    }, [text, type]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div 
            className={`fixed top-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl text-white font-semibold transition-all duration-300 ease-in-out z-50 ${bgColor} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}
        >
            {text}
        </div>
    );
};
