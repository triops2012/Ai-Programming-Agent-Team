import React, { useState } from 'react';

interface BarChartProps {
    title: string;
    data: { label: string; subLabel?: string; value: number }[];
    maxValue: number;
    color: 'blue' | 'indigo' | 'purple';
}

export const BarChart: React.FC<BarChartProps> = ({ title, data, maxValue, color }) => {
    const colorClass = {
        blue: 'fill-blue-500',
        indigo: 'fill-indigo-500',
        purple: 'fill-purple-500',
    }[color];

    const [tooltip, setTooltip] = useState<{ visible: boolean, content: string, x: number, y: number } | null>(null);

    const handleMouseOver = (e: React.MouseEvent, item: { label: string, value: number }) => {
        setTooltip({
            visible: true,
            content: `${item.label}: ${item.value.toLocaleString()} tokens`,
            x: e.clientX + 10,
            y: e.clientY - 10
        });
    };

    const handleMouseOut = () => {
        setTooltip(null);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex-grow relative">
                <svg width="100%" height="100%" className="overflow-visible">
                    {/* Y-Axis Labels */}
                    <text x="0" y="100%" dy="-5" textAnchor="start" className="text-xs fill-gray-500">{0}</text>
                    <text x="0" y="0" dy="12" textAnchor="start" className="text-xs fill-gray-500">{maxValue.toLocaleString()}</text>

                    {/* Y-Axis Lines */}
                    <line x1="20" y1="0" x2="20" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="20" y1="100%" x2="100%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                    
                    {data.map((item, index) => {
                        const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        const yOffset = 100 - barHeight;
                        const barWidth = data.length > 0 ? (100 - (data.length -1) * 10) / data.length : 0;
                        const xOffset = index * (barWidth + 10);

                        return (
                            <g key={item.label + item.subLabel}>
                                <rect
                                    x={`${xOffset}%`}
                                    y={`${yOffset}%`}
                                    width={`${barWidth}%`}
                                    height={`${barHeight}%`}
                                    className={`${colorClass} transition-all duration-500`}
                                    onMouseOver={(e) => handleMouseOver(e, item)}
                                    onMouseOut={handleMouseOut}
                                >
                                     <animate attributeName="height" from="0" to={`${barHeight}%`} dur="0.5s" fill="freeze" />
                                     <animate attributeName="y" from="100%" to={`${yOffset}%`} dur="0.5s" fill="freeze" />
                                </rect>
                            </g>
                        );
                    })}
                </svg>
            </div>
             {tooltip && tooltip.visible && (
                <div 
                    className="absolute bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};