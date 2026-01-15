import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, Medal, Crown, Sparkles, X, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward?: number;
}

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  onViewAll?: () => void;
  autoHideDuration?: number;
}

const rarityConfig = {
  common: {
    gradient: 'from-gray-500 to-slate-600',
    glow: 'shadow-gray-500/50',
    border: 'border-gray-500/50',
    icon: <Star className="w-8 h-8" />,
    label: 'Common',
  },
  rare: {
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'shadow-blue-500/50',
    border: 'border-blue-500/50',
    icon: <Medal className="w-8 h-8" />,
    label: 'Rare',
  },
  epic: {
    gradient: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-500/50',
    icon: <Trophy className="w-8 h-8" />,
    label: 'Epic',
  },
  legendary: {
    gradient: 'from-amber-400 to-orange-600',
    glow: 'shadow-amber-500/50',
    border: 'border-amber-500/50',
    icon: <Crown className="w-8 h-8" />,
    label: 'Legendary',
  },
};

const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
  onViewAll,
  autoHideDuration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = rarityConfig[achievement.rarity];

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    // Entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-hide
    const hideTimer = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDuration, handleDismiss]);

  const toast = (
    <div className="fixed top-4 right-4 z-[100] pointer-events-auto">
      <div
        className={`relative overflow-hidden rounded-2xl border ${config.border} bg-background/95 backdrop-blur-xl shadow-2xl ${config.glow} transition-all duration-300 ${
          isVisible && !isLeaving
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
        style={{ width: '380px' }}
      >
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        {/* Header */}
        <div className={`relative px-4 py-2 bg-gradient-to-r ${config.gradient} flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider">
              Achievement Unlocked!
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4 flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-lg ${config.glow}`}>
            {achievement.icon || config.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                {config.label}
              </span>
            </div>
            <h4 className="font-display text-lg font-bold mb-1 truncate">
              {achievement.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>

            {/* Rewards */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                +{achievement.xpReward} XP
              </div>
              {achievement.coinReward && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold">
                  +{achievement.coinReward} Coins
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {onViewAll && (
          <button
            onClick={() => {
              onViewAll();
              handleDismiss();
            }}
            className="relative w-full px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border-t border-border/50 transition-colors group"
          >
            View All Achievements
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${config.gradient} transition-all ease-linear`}
            style={{ 
              width: '100%',
              animation: `shrink ${autoHideDuration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );

  return createPortal(toast, document.body);
};

// Achievement Toast Manager Hook
export const useAchievementToast = () => {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  const showAchievement = useCallback((achievement: Achievement) => {
    setQueue(prev => [...prev, achievement]);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  const handleDismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  const AchievementToastComponent = current ? (
    <AchievementToast
      achievement={current}
      onDismiss={handleDismiss}
      onViewAll={() => console.log('View all achievements')}
    />
  ) : null;

  return { showAchievement, AchievementToastComponent };
};

export default AchievementToast;
