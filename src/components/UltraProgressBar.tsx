import React from 'react';

interface UltraProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glow?: boolean;
}

const UltraProgressBar: React.FC<UltraProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'primary',
  size = 'md',
  animated = true,
  glow = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const colorClasses = {
    primary: 'from-primary to-primary/80',
    secondary: 'from-secondary to-accent',
    success: 'from-success to-success/80',
    warning: 'from-warning to-amber-400',
    accent: 'from-accent to-secondary',
  };

  const glowClasses = {
    primary: 'shadow-[0_0_20px_hsl(var(--primary)/0.5)]',
    secondary: 'shadow-[0_0_20px_hsl(var(--secondary)/0.5)]',
    success: 'shadow-[0_0_20px_hsl(var(--success)/0.5)]',
    warning: 'shadow-[0_0_20px_hsl(var(--warning)/0.5)]',
    accent: 'shadow-[0_0_20px_hsl(var(--accent)/0.5)]',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <span className="text-sm font-display font-bold text-primary">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      
      <div className={`relative w-full ${sizeClasses[size]} rounded-full bg-muted overflow-hidden`}>
        {/* Background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        {/* Progress fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-700 ease-out relative overflow-hidden ${glow ? glowClasses[color] : ''}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shine */}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          )}
          
          {/* Particle effect at the end */}
          {animated && percentage > 10 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 animate-pulse" />
          )}
        </div>
        
        {/* Milestone markers */}
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className={`absolute top-0 bottom-0 w-0.5 ${percentage >= milestone ? 'bg-white/20' : 'bg-white/10'}`}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default UltraProgressBar;
