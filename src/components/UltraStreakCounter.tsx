import React from 'react';
import { Flame, Calendar, Gift, Star } from 'lucide-react';

interface UltraStreakCounterProps {
  streak: number;
  maxStreak?: number;
  nextRewardAt?: number;
  compact?: boolean;
}

const UltraStreakCounter: React.FC<UltraStreakCounterProps> = ({
  streak,
  maxStreak = streak,
  nextRewardAt = 7,
  compact = false,
}) => {
  const streakProgress = (streak % nextRewardAt) / nextRewardAt * 100;
  const daysUntilReward = nextRewardAt - (streak % nextRewardAt);

  const getStreakTier = () => {
    if (streak >= 365) return { tier: 'Legendary', color: 'warning', icon: '🔥' };
    if (streak >= 100) return { tier: 'Epic', color: 'secondary', icon: '⚡' };
    if (streak >= 30) return { tier: 'Rare', color: 'primary', icon: '✨' };
    if (streak >= 7) return { tier: 'Common', color: 'success', icon: '🌟' };
    return { tier: 'Starter', color: 'muted-foreground', icon: '💫' };
  };

  const { tier, color, icon } = getStreakTier();

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
        <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
        <span className="font-display font-bold text-orange-500">{streak}</span>
        <span className="text-xs text-orange-400">day{streak !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-yellow-500/10 p-5">
      {/* Background flames effect */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${20 + i * 15}%`,
              bottom: '-10%',
              animationDelay: `${i * 0.2}s`,
              opacity: 0.5 - i * 0.08,
            }}
          >
            <Flame className="w-16 h-16 text-orange-500 fill-orange-500/50" />
          </div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Flame className="w-8 h-8 text-white fill-white animate-pulse" />
              </div>
              {streak >= 7 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warning flex items-center justify-center animate-bounce">
                  <Star className="w-4 h-4 text-warning-foreground fill-warning-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="font-display text-3xl font-black text-gradient-gold">
                {streak} <span className="text-lg">Days</span>
              </p>
            </div>
          </div>

          <div className={`text-right px-3 py-1 rounded-lg bg-${color}/10 border border-${color}/30`}>
            <p className="text-xs text-muted-foreground">Rank</p>
            <p className={`font-display font-bold text-${color}`}>
              {icon} {tier}
            </p>
          </div>
        </div>

        {/* Progress to next weekly reward */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Gift className="w-4 h-4 text-warning" />
              Weekly Bonus Progress
            </span>
            <span className="text-warning font-bold">{daysUntilReward} day{daysUntilReward !== 1 ? 's' : ''} left</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 transition-all duration-500 relative overflow-hidden"
              style={{ width: `${streakProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Week indicators */}
        <div className="flex justify-between gap-1">
          {[...Array(7)].map((_, i) => {
            const dayNum = i + 1;
            const isCompleted = (streak % 7) >= dayNum || streakProgress === 100;
            const isCurrent = (streak % 7) === dayNum - 1;
            
            return (
              <div
                key={i}
                className={`
                  flex-1 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' 
                    : isCurrent
                    ? 'bg-orange-500/30 border-2 border-orange-500 text-orange-500 animate-pulse'
                    : 'bg-muted/50 text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? '✓' : `D${dayNum}`}
              </div>
            );
          })}
        </div>

        {/* Best streak */}
        <div className="mt-4 pt-4 border-t border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Best Streak
          </div>
          <span className="font-display font-bold text-foreground">
            {maxStreak} Days 🏆
          </span>
        </div>
      </div>
    </div>
  );
};

export default UltraStreakCounter;
