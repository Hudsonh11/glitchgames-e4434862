import React from 'react';
import { Sparkles, Star, Zap, Crown, Flame, Trophy } from 'lucide-react';

interface UltraRewardCardProps {
  day: number;
  coins: number;
  gems?: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isWeeklyBonus?: boolean;
  onClaim?: () => void;
  canClaim?: boolean;
}

const UltraRewardCard: React.FC<UltraRewardCardProps> = ({
  day,
  coins,
  gems = 0,
  isUnlocked,
  isCurrent,
  isWeeklyBonus = false,
  onClaim,
  canClaim = false,
}) => {
  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-500
      ${isUnlocked
        ? 'bg-muted/30 border-success/30 opacity-70 scale-95'
        : isCurrent
        ? 'bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 border-primary shadow-glow scale-105'
        : 'bg-card border-border opacity-60 hover:opacity-80'
      }
    `}>
      {/* Shimmer for current */}
      {isCurrent && canClaim && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Day badge */}
      <div className={`
        absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold
        ${isUnlocked 
          ? 'bg-success text-success-foreground' 
          : isCurrent 
          ? 'bg-primary text-primary-foreground animate-pulse' 
          : 'bg-muted text-muted-foreground'
        }
      `}>
        {isUnlocked ? '✓' : day}
      </div>

      {/* Weekly bonus crown */}
      {isWeeklyBonus && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Crown className="w-6 h-6 text-warning fill-warning animate-bounce" />
        </div>
      )}

      <div className="relative z-10 text-center pt-2">
        <p className="text-xs text-muted-foreground mb-3">Day {day}</p>

        {/* Reward icon */}
        <div className={`
          w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center
          ${isCurrent ? 'bg-primary/20 animate-pulse' : 'bg-muted/50'}
        `}>
          {isWeeklyBonus ? (
            <Trophy className="w-6 h-6 text-warning" />
          ) : gems > 0 ? (
            <Sparkles className="w-6 h-6 text-secondary" />
          ) : (
            <Star className="w-6 h-6 text-warning" />
          )}
        </div>

        {/* Coins */}
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-lg">🪙</span>
          <span className={`font-display font-bold ${isCurrent ? 'text-warning text-lg' : 'text-warning'}`}>
            {coins}
          </span>
        </div>

        {/* Gems */}
        {gems > 0 && (
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm">💎</span>
            <span className={`font-display font-bold ${isCurrent ? 'text-secondary' : 'text-secondary text-sm'}`}>
              {gems}
            </span>
          </div>
        )}

        {/* Claim button */}
        {isCurrent && canClaim && onClaim && (
          <button
            onClick={onClaim}
            className="
              mt-3 w-full py-2 rounded-lg font-display font-bold text-sm
              bg-gradient-to-r from-primary to-secondary text-primary-foreground
              hover:shadow-glow transition-all duration-300 hover:scale-105
              animate-pulse
            "
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Claim!
          </button>
        )}

        {/* Locked indicator */}
        {!isUnlocked && !isCurrent && (
          <div className="mt-3 flex items-center justify-center opacity-50">
            <span className="text-xs text-muted-foreground">🔒</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltraRewardCard;
