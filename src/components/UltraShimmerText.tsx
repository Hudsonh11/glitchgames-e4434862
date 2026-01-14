import React from 'react';
import { cn } from '@/lib/utils';

interface UltraShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'gold' | 'silver' | 'rainbow' | 'primary';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  animate?: boolean;
}

const UltraShimmerText: React.FC<UltraShimmerTextProps> = ({
  children,
  className,
  variant = 'gold',
  as: Component = 'span',
  animate = true
}) => {
  const variantStyles = {
    gold: 'bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200',
    silver: 'bg-gradient-to-r from-gray-200 via-white to-gray-200',
    rainbow: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400',
    primary: 'bg-gradient-to-r from-primary/70 via-primary to-primary/70'
  };

  return (
    <Component
      className={cn(
        'bg-clip-text text-transparent bg-[length:200%_100%]',
        variantStyles[variant],
        animate && 'animate-shimmer',
        className
      )}
      style={{
        animation: animate ? 'shimmer 3s ease-in-out infinite' : undefined
      }}
    >
      {children}
    </Component>
  );
};

export default UltraShimmerText;
