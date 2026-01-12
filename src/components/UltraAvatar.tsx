import React from 'react';

interface UltraAvatarProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'rainbow';
  status?: 'online' | 'offline' | 'away' | 'playing';
  level?: number;
  animated?: boolean;
}

const UltraAvatar: React.FC<UltraAvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  border = 'default',
  status,
  level,
  animated = true,
}) => {
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

  return (
    <div className="relative inline-block">
      {/* Rainbow border wrapper */}
      {border === 'rainbow' && (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-warning ${animated ? 'animate-spin-slow' : ''} p-0.5`}>
          <div className={`${sizeClasses[size]} rounded-full bg-background`} />
        </div>
      )}

      {/* Avatar image */}
      <img
        src={src}
        alt={alt}
        className={`
          ${sizeClasses[size]} rounded-full border-2 ${borderClasses[border]}
          object-cover transition-all duration-300
          ${animated ? 'hover:scale-110 hover:shadow-glow' : ''}
          ${border === 'rainbow' ? 'relative z-10' : ''}
        `}
      />

      {/* Status indicator */}
      {status && (
        <div className={`
          absolute bottom-0 right-0 ${statusSize[size]} rounded-full
          ${statusColors[status]} border-2 border-background
        `} />
      )}

      {/* Level badge */}
      {level && (
        <div className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
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
