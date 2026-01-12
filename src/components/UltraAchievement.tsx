import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';

interface UltraAchievementProps {
  title: string;
  description: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  onClose?: () => void;
  autoClose?: number;
}

const rarityConfig = {
  common: {
    bg: 'from-muted to-muted/50',
    border: 'border-border',
    glow: '',
    label: 'Common',
    labelColor: 'text-muted-foreground',
  },
  rare: {
    bg: 'from-primary/20 to-primary/5',
    border: 'border-primary/50',
    glow: 'shadow-glow',
    label: 'Rare',
    labelColor: 'text-primary',
  },
  epic: {
    bg: 'from-secondary/20 via-accent/10 to-secondary/5',
    border: 'border-secondary/50',
    glow: 'shadow-neon-magenta',
    label: 'Epic',
    labelColor: 'text-secondary',
  },
  legendary: {
    bg: 'from-warning/30 via-amber-500/20 to-warning/10',
    border: 'border-warning/50',
    glow: 'shadow-neon-gold',
    label: 'Legendary',
    labelColor: 'text-warning',
  },
};

const UltraAchievement: React.FC<UltraAchievementProps> = ({
  title,
  description,
  icon = '🏆',
  rarity = 'common',
  onClose,
  autoClose = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = rarityConfig[rarity];

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 500);
  };

  return (
    <div className={`
      fixed top-20 left-1/2 -translate-x-1/2 z-[150]
      transition-all duration-500
      ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
    `}>
      {/* Particle burst for legendary */}
      {rarity === 'legendary' && isVisible && (
        <div className="absolute inset-0 -z-10">
          {[...Array(12)].map((_, i) => (
            <Star
              key={i}
              className="absolute text-warning fill-warning animate-ping"
              style={{
                left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 60}%`,
                top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 60}%`,
                width: 12,
                height: 12,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-xl
        bg-gradient-to-r ${config.bg} ${config.border} ${config.glow}
        p-5 min-w-[350px] max-w-md
      `}>
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

        {/* Top label */}
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <span className={`
            px-4 py-1 text-xs font-display font-bold uppercase tracking-wider
            bg-background/80 backdrop-blur-sm rounded-b-lg border-x border-b ${config.border}
            ${config.labelColor}
          `}>
            <Trophy className="inline w-3 h-3 mr-1" />
            {config.label} Achievement
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-4 pt-4">
          <div className={`
            w-16 h-16 rounded-xl flex items-center justify-center text-3xl
            bg-gradient-to-br ${config.bg} border ${config.border}
            ${rarity === 'legendary' ? 'animate-bounce' : 'animate-pulse'}
          `}>
            {icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={`w-4 h-4 ${config.labelColor} animate-spin-slow`} />
              <h4 className="font-display font-bold text-lg">{title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraAchievement;
