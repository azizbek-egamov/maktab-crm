import React from 'react';
import './CustomChartTooltip.css';

/**
 * Premium glassmorphism tooltip for Recharts charts
 */
export const CustomChartTooltip = ({ active, payload, label, formatter, valuePrefix = '', valueSuffix = '' }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="custom-chart-tooltip animate-scaleUp">
            {label && <div className="tooltip-header">{label}</div>}
            <div className="tooltip-body">
                {payload.map((item, index) => {
                    const color = item.color || item.fill || item.stroke || '#6366f1';
                    const name = item.name || item.dataKey;
                    const val = formatter
                        ? formatter(item.value, name, item)
                        : `${valuePrefix}${typeof item.value === 'number' ? item.value.toLocaleString('uz-UZ') : item.value}${valueSuffix}`;

                    return (
                        <div key={`item-${index}`} className="tooltip-item">
                            <span className="tooltip-dot" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
                            <span className="tooltip-name">{name}:</span>
                            <span className="tooltip-value" style={{ color: color }}>{val}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomChartTooltip;
