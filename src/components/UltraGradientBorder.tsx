import React from 'react';
import { cn } from '@/lib/utils';

interface UltraGradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  variant?: 'rainbow' | 'gold' | 'primary' | 'cyber';
  animate?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const UltraGradientBorder: React.FC<UltraGradientBorderProps> = ({
  children,
  className,
  borderWidth = 2,
  variant = 'rainbow',
  animate = true,
  rounded = 'xl'
}) => {
  const gradients = {
    rainbow: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
    gold: 'from-yellow-300 via-yellow-500 to-yellow-300',
    primary: 'from-primary via-accent to-primary',
    cyber: 'from-cyan-400 via-purple-500 to-pink-500'
  };

  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={cn(
        'relative p-[2px]',
        roundedStyles[rounded],
        className
      )}
      style={{ padding: borderWidth }}
    >
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r',
          gradients[variant],
          roundedStyles[rounded],
          animate && 'bg-[length:200%_100%]'
        )}
        style={{
          animation: animate ? 'shimmer 3s linear infinite' : undefined
        }}
      />
      
      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r opacity-50 blur-md',
          gradients[variant],
          roundedStyles[rounded]
        )}
      />
      
      {/* Inner content */}
      <div className={cn('relative bg-background', roundedStyles[rounded])}>
        {children}
      </div>
    </div>
  );
};

export default UltraGradientBorder;
