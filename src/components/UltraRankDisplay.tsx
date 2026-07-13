import React from 'react';
import { Crown, Medal, Star, Trophy, Zap } from 'lucide-react';

interface RankData {
  rank: number;
  username: string;
  avatar: string;
  score: number;
  isCurrentUser?: boolean;
  isPlus?: boolean;
}


interface UltraRankDisplayProps {
  data: RankData;
  showTrophy?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getRankConfig = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        icon: Crown,
        color: 'warning',
        bg: 'from-warning/30 via-amber-500/20 to-warning/10',
        border: 'border-warning/50',
        glow: 'shadow-neon-gold',
        label: '1st',
      };
    case 2:
      return {
        icon: Medal,
        color: 'muted-foreground',
        bg: 'from-slate-400/20 to-slate-500/10',
        border: 'border-slate-400/50',
        glow: '',
        label: '2nd',
      };
    case 3:
      return {
        icon: Medal,
        color: 'amber-700',
        bg: 'from-amber-700/20 to-amber-800/10',
        border: 'border-amber-700/50',
        glow: '',
        label: '3rd',
      };
    default:
      return {
        icon: Star,
        color: 'primary',
        bg: 'from-primary/10 to-primary/5',
        border: 'border-primary/30',
        glow: '',
        label: `#${rank}`,
      };
  }
};

const UltraRankDisplay: React.FC<UltraRankDisplayProps> = ({
  data,
  showTrophy = true,
  animated = true,
  size = 'md',
}) => {
  const config = getRankConfig(data.rank);
  const Icon = config.icon;

  const sizeClasses = {
    sm: { container: 'p-3', avatar: 'w-10 h-10', text: 'text-sm', rank: 'w-6 h-6 text-xs' },
    md: { container: 'p-4', avatar: 'w-12 h-12', text: 'text-base', rank: 'w-8 h-8 text-sm' },
    lg: { container: 'p-5', avatar: 'w-16 h-16', text: 'text-lg', rank: 'w-10 h-10 text-base' },
  };

  const s = sizeClasses[size];

  return (
    <div className={`
      relative overflow-hidden rounded-xl border bg-gradient-to-r ${config.bg} ${config.border}
      ${s.container} transition-all duration-300
      ${animated ? `hover:scale-[1.02] ${config.glow}` : ''}
      ${data.isCurrentUser ? 'ring-2 ring-primary' : ''}
    `}>
      {/* Shimmer effect for top 3 */}
      {data.rank <= 3 && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}

      <div className="relative flex items-center gap-4">
        {/* Rank badge */}
        <div className={`
          flex-shrink-0 ${s.rank} rounded-full flex items-center justify-center
          ${data.rank <= 3 ? `bg-${config.color}/20` : 'bg-muted'}
          font-display font-bold
        `}>
          {showTrophy && data.rank <= 3 ? (
            <Icon className={`w-4 h-4 ${data.rank === 1 ? 'text-warning fill-warning' : data.rank === 2 ? 'text-slate-400' : 'text-amber-700'} ${animated && data.rank === 1 ? 'animate-pulse' : ''}`} />
          ) : (
            <span className={`text-${config.color}`}>{data.rank}</span>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
          <img
            src={data.avatar}
            alt={data.username}
            className={`${s.avatar} rounded-full border-2 ${data.rank === 1 ? 'border-warning' : data.rank === 2 ? 'border-slate-400' : data.rank === 3 ? 'border-amber-700' : 'border-border'}`}
          />
          {data.rank === 1 && animated && (
            <Crown className="absolute -top-2 -right-2 w-5 h-5 text-warning fill-warning animate-bounce" />
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <p className={`font-display font-bold truncate ${s.text}`}>
            {data.username}
            {data.isCurrentUser && (
              <span className="ml-2 text-xs text-primary">(You)</span>
            )}
          </p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Trophy className="w-3 h-3" />
            <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {data.score.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Rank label */}
        <div className={`
          px-3 py-1 rounded-full font-display font-bold text-sm
          bg-${config.color}/10 text-${config.color}
        `}>
          {config.label}
        </div>
      </div>
    </div>
  );
};

export default UltraRankDisplay;
