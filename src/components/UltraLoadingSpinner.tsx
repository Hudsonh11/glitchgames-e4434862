import React from 'react';

interface UltraLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const UltraLoadingSpinner: React.FC<UltraLoadingSpinnerProps> = ({ 
  size = 'md',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-secondary animate-spin" />
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground font-display animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default UltraLoadingSpinner;
