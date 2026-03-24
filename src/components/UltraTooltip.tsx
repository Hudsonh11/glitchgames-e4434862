import React, { useState, useRef } from 'react';

interface UltraTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'premium' | 'dark';
  delay?: number;
}

const UltraTooltip: React.FC<UltraTooltipProps> = ({
  content,
  children,
  position = 'top',
  variant = 'default',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent',
  };

  const variantClasses = {
    default: 'bg-popover border-border text-popover-foreground',
    premium: 'bg-gradient-to-r from-card via-primary/10 to-card border-primary/30 text-foreground shadow-glow',
    dark: 'bg-background border-border/50 text-foreground',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          className={`
            absolute z-50 ${positionClasses[position]}
            px-3 py-2 rounded-lg border backdrop-blur-sm
            text-sm font-medium whitespace-nowrap
            ${variantClasses[variant]}
            animate-scale-in
            shadow-lg
          `}
        >
          {/* Gradient border effect for premium */}
          {variant === 'premium' && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 -z-10" />
          )}
          
          {content}
          
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            style={{
              borderTopColor: variant === 'premium' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UltraTooltip;
