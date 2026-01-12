import React from 'react';
import { Coins, Gem, Sparkles, TrendingUp } from 'lucide-react';

interface UltraCurrencyDisplayProps {
  coins: number;
  gems: number;
  showChange?: { coins?: number; gems?: number };
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const UltraCurrencyDisplay: React.FC<UltraCurrencyDisplayProps> = ({
  coins,
  gems,
  showChange,
  size = 'md',
  animated = true,
}) => {
  const sizeClasses = {
    sm: { container: 'gap-2', text: 'text-sm', icon: 'w-4 h-4', padding: 'px-2 py-1' },
    md: { container: 'gap-3', text: 'text-base', icon: 'w-5 h-5', padding: 'px-3 py-1.5' },
    lg: { container: 'gap-4', text: 'text-lg', icon: 'w-6 h-6', padding: 'px-4 py-2' },
  };

  const s = sizeClasses[size];

  return (
    <div className={`flex items-center ${s.container}`}>
      {/* Coins */}
      <div className={`
        relative flex items-center gap-1.5 ${s.padding} rounded-full
        bg-gradient-to-r from-warning/20 to-amber-500/10
        border border-warning/30 hover:border-warning/50
        transition-all duration-300 hover:scale-105
        ${animated ? 'hover:shadow-neon-gold' : ''}
      `}>
        <div className="relative">
          <span className={`${s.text}`}>🪙</span>
          {animated && (
            <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-warning animate-ping" />
          )}
        </div>
        <span className={`font-display font-bold text-warning ${s.text}`}>
          {coins.toLocaleString()}
        </span>
        
        {/* Change indicator */}
        {showChange?.coins && showChange.coins > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success text-xs font-bold text-success-foreground animate-bounce">
            <TrendingUp className="w-3 h-3" />
            +{showChange.coins}
          </span>
        )}
      </div>

      {/* Gems */}
      <div className={`
        relative flex items-center gap-1.5 ${s.padding} rounded-full
        bg-gradient-to-r from-secondary/20 to-purple-500/10
        border border-secondary/30 hover:border-secondary/50
        transition-all duration-300 hover:scale-105
        ${animated ? 'hover:shadow-neon-magenta' : ''}
      `}>
        <div className="relative">
          <span className={`${s.text}`}>💎</span>
          {animated && (
            <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-secondary animate-ping" />
          )}
        </div>
        <span className={`font-display font-bold text-secondary ${s.text}`}>
          {gems.toLocaleString()}
        </span>
        
        {/* Change indicator */}
        {showChange?.gems && showChange.gems > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success text-xs font-bold text-success-foreground animate-bounce">
            <TrendingUp className="w-3 h-3" />
            +{showChange.gems}
          </span>
        )}
      </div>
    </div>
  );
};

export default UltraCurrencyDisplay;
