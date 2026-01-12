import React, { useEffect, useState } from 'react';
import { Zap, Star, Crown } from 'lucide-react';

interface UltraXPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  showLevelBadge?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UltraXPBar: React.FC<UltraXPBarProps> = ({
  currentXP,
  maxXP,
  level,
  showLevelBadge = true,
  animated = true,
  size = 'md',
}) => {
  const [displayXP, setDisplayXP] = useState(0);
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  useEffect(() => {
    if (animated) {
      const duration = 1000;
      const steps = 60;
      const increment = currentXP / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= currentXP) {
          setDisplayXP(currentXP);
          clearInterval(interval);
        } else {
          setDisplayXP(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayXP(currentXP);
    }
  }, [currentXP, animated]);

  const sizeClasses = {
    sm: { bar: 'h-3', text: 'text-xs', badge: 'w-8 h-8 text-sm' },
    md: { bar: 'h-5', text: 'text-sm', badge: 'w-10 h-10 text-base' },
    lg: { bar: 'h-7', text: 'text-base', badge: 'w-12 h-12 text-lg' },
  };

  const getLevelIcon = () => {
    if (level >= 50) return <Crown className="w-4 h-4" />;
    if (level >= 20) return <Star className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Level badge */}
        {showLevelBadge && (
          <div className={`
            relative flex-shrink-0 ${sizeClasses[size].badge} rounded-xl
            bg-gradient-to-br from-primary to-secondary
            flex items-center justify-center font-display font-bold text-primary-foreground
            shadow-glow
          `}>
            {getLevelIcon()}
            <span className="absolute -bottom-1 -right-1 bg-background rounded-full px-1 text-xs border border-primary">
              {level}
            </span>
          </div>
        )}

        {/* XP bar container */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className={`font-display font-bold ${sizeClasses[size].text}`}>
              Level {level}
            </span>
            <span className={`${sizeClasses[size].text} text-muted-foreground`}>
              <span className="text-primary font-bold">{displayXP.toLocaleString()}</span> / {maxXP.toLocaleString()} XP
            </span>
          </div>

          <div className={`relative ${sizeClasses[size].bar} rounded-full bg-muted overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, hsl(var(--primary) / 0.1) 10px, hsl(var(--primary) / 0.1) 20px)',
              }}
            />

            {/* Progress fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient-x transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30 rounded-full" />
              
              {/* Particles */}
              {animated && percentage > 5 && (
                <>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/70 animate-pulse" />
                </>
              )}
            </div>

            {/* XP text inside bar (for larger sizes) */}
            {size === 'lg' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {Math.round(percentage)}%
                </span>
              </div>
            )}
          </div>

          {/* Next level preview */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              {(maxXP - displayXP).toLocaleString()} XP to next level
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 text-warning" />
              <span>Level {level + 1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraXPBar;
