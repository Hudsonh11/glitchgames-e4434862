import React from 'react';
import { cn } from '@/lib/utils';

interface UltraPulseRingProps {
  children: React.ReactNode;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  ringCount?: number;
}

const UltraPulseRing: React.FC<UltraPulseRingProps> = ({
  children,
  className,
  color = 'primary',
  size = 'md',
  active = true,
  ringCount = 3
}) => {
  const colorStyles = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-warning',
    danger: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const sizeStyles = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {children}
      
      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(ringCount)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute rounded-full opacity-75',
                colorStyles[color]
              )}
              style={{
                width: '100%',
                height: '100%',
                animation: `pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UltraPulseRing;
