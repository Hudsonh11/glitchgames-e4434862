import React from 'react';
import { Zap } from 'lucide-react';

interface UltraAvatarProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'rainbow' | 'plus';
  status?: 'online' | 'offline' | 'away' | 'playing';
  level?: number;
  animated?: boolean;
  isPlus?: boolean;
}

const UltraAvatar = React.forwardRef<HTMLDivElement, UltraAvatarProps & React.HTMLAttributes<HTMLDivElement>>(({
  src,
  alt = 'Avatar',
  size = 'md',
  border = 'default',
  status,
  level,
  animated = true,
  isPlus = false,
  ...rest
}, ref) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const borderClasses = {
    default: 'border-border',
    primary: 'border-primary',
    secondary: 'border-secondary',
    warning: 'border-warning',
    success: 'border-success',
    rainbow: 'border-transparent',
    plus: 'border-transparent',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    away: 'bg-warning',
    playing: 'bg-primary animate-pulse',
  };

  const statusSize = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  // If isPlus flag is true, upgrade border to plus visual.
  const effectiveBorder = isPlus ? 'plus' : border;

  return (
    <div ref={ref} {...rest} className="relative inline-block">
      {/* Rainbow border wrapper */}
      {effectiveBorder === 'rainbow' && (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-warning ${animated ? 'animate-spin-slow' : ''} p-0.5`}>
          <div className={`${sizeClasses[size]} rounded-full bg-background`} />
        </div>
      )}

      {/* Plus animated frame — conic gold/cyan sweep */}
      {effectiveBorder === 'plus' && (
        <div
          className={`absolute -inset-1 rounded-full ${animated ? 'animate-spin-slow' : ''}`}
          style={{
            background:
              'conic-gradient(from 0deg, hsl(var(--warning)), hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--warning)))',
            filter: 'drop-shadow(0 0 6px hsl(var(--warning) / 0.7))',
          }}
          aria-hidden
        >
          <div className={`${sizeClasses[size]} rounded-full bg-background m-0.5`} />
        </div>
      )}

      {/* Avatar image */}
      <img
        src={src}
        alt={alt}
        className={`
          ${sizeClasses[size]} rounded-full border-2 ${borderClasses[effectiveBorder]}
          object-cover transition-all duration-300
          ${animated ? 'hover:scale-110 hover:shadow-glow' : ''}
          ${effectiveBorder === 'rainbow' || effectiveBorder === 'plus' ? 'relative z-10' : ''}
        `}
      />

      {/* Plus zap emblem */}
      {effectiveBorder === 'plus' && (
        <div className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-gradient-to-br from-warning to-primary flex items-center justify-center border-2 border-background shadow-neon-gold">
          <Zap className="w-3 h-3 text-background fill-background" />
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <div className={`
          absolute bottom-0 right-0 z-20 ${statusSize[size]} rounded-full
          ${statusColors[status]} border-2 border-background
        `} />
      )}

      {/* Level badge */}
      {level && (
        <div className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2 z-20
          px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground
          text-xs font-display font-bold border border-background
          ${animated ? 'animate-bounce' : ''}
        `}>
          {level}
        </div>
      )}
    </div>
  );
};

export default UltraAvatar;

