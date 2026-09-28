import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import './UITooltip.css';

/**
 * Modern floating glassmorphism tooltip using React Portal & Fixed Positioning.
 * Guarantees that tooltips never get clipped by overflow or hidden under other DOM layers/cards.
 */
export const UITooltip = ({ 
    text, 
    content, 
    children, 
    position = 'top', 
    delay = 80,
    className = '' 
}) => {
    const tooltipContent = content || text;
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, actualPos: position });
    const triggerRef = useRef(null);
    const timeoutRef = useRef(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        
        let actualPos = position;
        let top = 0;
        let left = 0;

        const spaceTop = rect.top;
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        // Auto flip if not enough space
        if (position === 'top' && spaceTop < 70 && spaceBottom > spaceTop) {
            actualPos = 'bottom';
        } else if (position === 'bottom' && spaceBottom < 70 && spaceTop > spaceBottom) {
            actualPos = 'top';
        } else if (position === 'right' && spaceRight < 200 && spaceLeft > spaceRight) {
            actualPos = 'left';
        } else if (position === 'left' && spaceLeft < 200 && spaceRight > spaceLeft) {
            actualPos = 'right';
        }

        if (actualPos === 'top') {
            top = rect.top - 8;
            left = rect.left + rect.width / 2;
        } else if (actualPos === 'bottom') {
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2;
        } else if (actualPos === 'left') {
            top = rect.top + rect.height / 2;
            left = rect.left - 8;
        } else if (actualPos === 'right') {
            top = rect.top + rect.height / 2;
            left = rect.right + 8;
        }

        // Clamp horizontal coordinate inside window
        const safeMargin = 140;
        if (actualPos === 'top' || actualPos === 'bottom') {
            left = Math.max(safeMargin, Math.min(window.innerWidth - safeMargin, left));
        }

        setCoords({ top, left, actualPos });
    };

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            updatePosition();
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
            const handleScroll = () => updatePosition();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!tooltipContent) return children;

    return (
        <span 
            ref={triggerRef}
            className={`ui-tooltip-wrapper ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
        >
            {children}
            {isVisible && createPortal(
                <div 
                    className={`ui-tooltip-bubble ui-tooltip-${coords.actualPos} animate-tooltipPop`}
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        zIndex: 99999999,
                        pointerEvents: 'none'
                    }}
                >
                    <div className="ui-tooltip-text">{tooltipContent}</div>
                    <div className="ui-tooltip-arrow" />
                </div>,
                document.body
            )}
        </span>
    );
};

/**
 * Mini Info Icon with Floating Tooltip
 */
export const InfoTooltip = ({ text, content, size = 14, className = '', position = 'top' }) => {
    return (
        <UITooltip text={text} content={content} position={position} className={className}>
            <span className="ui-info-trigger" tabIndex={0} role="button" aria-label="Ko'proq ma'lumot">
                <Info size={size} />
            </span>
        </UITooltip>
    );
};

export default UITooltip;
