import React from 'react';
import { Sparkles, Crown, Star, Zap, Flame, Trophy, Shield, Target } from 'lucide-react';

type BadgeVariant = 'default' | 'premium' | 'legendary' | 'rare' | 'epic' | 'common' | 'hot' | 'new';

interface UltraBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: 'sparkles' | 'crown' | 'star' | 'zap' | 'flame' | 'trophy' | 'shield' | 'target';
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap = {
  sparkles: Sparkles,
  crown: Crown,
  star: Star,
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  shield: Shield,
  target: Target,
};

const UltraBadge: React.FC<UltraBadgeProps> = ({
  variant = 'default',
  children,
  icon,
  animated = false,
  size = 'md',
}) => {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground border-border',
    premium: 'bg-gradient-to-r from-primary to-secondary text-primary-foreground border-primary/50 shadow-glow',
    legendary: 'bg-gradient-to-r from-warning via-amber-400 to-warning text-warning-foreground border-warning/50 shadow-neon-gold',
    rare: 'bg-gradient-to-r from-secondary to-accent text-secondary-foreground border-secondary/50 shadow-neon-magenta',
    epic: 'bg-gradient-to-r from-accent to-primary text-accent-foreground border-accent/50',
    common: 'bg-muted/50 text-muted-foreground border-border/50',
    hot: 'bg-gradient-to-r from-destructive to-orange-500 text-destructive-foreground border-destructive/50',
    new: 'bg-gradient-to-r from-success to-emerald-400 text-success-foreground border-success/50',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <span
      className={`
        inline-flex items-center font-display font-bold uppercase tracking-wider
        rounded-full border transition-all duration-300
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${animated ? 'animate-pulse-glow hover:scale-110' : 'hover:scale-105'}
      `}
    >
      {IconComponent && (
        <IconComponent className={`${iconSizeClasses[size]} ${animated ? 'animate-spin-slow' : ''}`} />
      )}
      {children}
    </span>
  );
};

export default UltraBadge;
