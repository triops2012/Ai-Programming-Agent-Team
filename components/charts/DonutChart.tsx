import React, { useMemo, useState } from 'react';

interface DonutChartProps {
    title: string;
    data: { label: string; value: number; color: string }[];
}

const DonutSegment: React.FC<{
    radius: number;
    startAngle: number;
    endAngle: number;
    color: string;
    onMouseOver: (e: React.MouseEvent) => void;
    onMouseOut: () => void;
}> = ({ radius, startAngle, endAngle, color, onMouseOver, onMouseOut }) => {
    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    const endX = radius * Math.cos(endAngle);
    const endY = radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

    const pathData = [
        `M ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    ].join(' ');

    return (
        <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="20"
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            className="transition-all duration-300 hover:stroke-[22px] cursor-pointer"
        />
    );
};


export const DonutChart: React.FC<DonutChartProps> = ({ title, data }) => {
    const total = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
    const [tooltip, setTooltip] = useState<{ visible: boolean, content: string, x: number, y: number } | null>(null);

    let cumulativeAngle = -Math.PI / 2;

    return (
        <div className="bg-white p-4 rounded-lg shadow border h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex items-center justify-center gap-8">
                <div className="relative">
                    <svg viewBox="-60 -60 120 120" width="160" height="160">
                         <circle cx="0" cy="0" r="50" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                        {data.map((item) => {
                            const angle = total > 0 ? (item.value / total) * 2 * Math.PI : 0;
                            const startAngle = cumulativeAngle;
                            cumulativeAngle += angle;
                            const endAngle = cumulativeAngle;

                            const handleMouseOver = (e: React.MouseEvent) => {
                                 const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                                 setTooltip({
                                    visible: true,
                                    content: `${item.label}: ${item.value.toLocaleString()} (${percentage}%)`,
                                    x: e.clientX,
                                    y: e.clientY - 15,
                                });
                            };

                            return (
                                <DonutSegment
                                    key={item.label}
                                    radius={50}
                                    startAngle={startAngle}
                                    endAngle={endAngle}
                                    color={item.color}
                                    onMouseOver={handleMouseOver}
                                    onMouseOut={() => setTooltip(null)}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</span>
                         <span className="text-xs text-gray-500">Tokens</span>
                    </div>
                </div>
                <div className="text-sm space-y-2">
                    {data.map(item => (
                         <div key={item.label} className="flex items-center">
                            <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="font-semibold text-gray-700">{item.label}</span>
                            <span className="ml-auto text-gray-500 font-mono">
                                {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%
                            </span>
                        </div>
                    ))}
                </div>
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