import React from 'react';
import { cn } from '@/lib/utils';

interface UltraGlitchTextProps {
  children: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'primary' | 'danger' | 'cyber';
}

const UltraGlitchText: React.FC<UltraGlitchTextProps> = ({
  children,
  className,
  intensity = 'medium',
  color = 'primary'
}) => {
  const intensityStyles = {
    low: 'animate-glitch-low',
    medium: 'animate-glitch-medium',
    high: 'animate-glitch-high'
  };

  const colorStyles = {
    primary: {
      main: 'text-primary',
      shadow1: 'text-cyan-400',
      shadow2: 'text-pink-500'
    },
    danger: {
      main: 'text-red-500',
      shadow1: 'text-red-300',
      shadow2: 'text-red-700'
    },
    cyber: {
      main: 'text-cyan-400',
      shadow1: 'text-purple-500',
      shadow2: 'text-pink-500'
    }
  };

  return (
    <span className={cn('relative inline-block', className)}>
      {/* Main text */}
      <span className={cn('relative z-10', colorStyles[color].main)}>
        {children}
      </span>
      
      {/* Glitch layers */}
      <span
        className={cn(
          'absolute inset-0 opacity-70',
          colorStyles[color].shadow1,
          intensityStyles[intensity]
        )}
        style={{ clipPath: 'inset(0 0 50% 0)' }}
        aria-hidden="true"
      >
        {children}
      </span>
      
      <span
        className={cn(
          'absolute inset-0 opacity-70',
          colorStyles[color].shadow2,
          intensityStyles[intensity]
        )}
        style={{ 
          clipPath: 'inset(50% 0 0 0)',
          animationDelay: '0.1s'
        }}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  );
};

export default UltraGlitchText;
