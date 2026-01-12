import React from 'react';
import { Gamepad2, Clock, Trophy, TrendingUp, Zap } from 'lucide-react';

interface UltraGameStatsProps {
  gameName: string;
  highScore: number;
  gamesPlayed: number;
  timePlayed: number; // in seconds
  rank?: number;
  trending?: boolean;
}

const UltraGameStats: React.FC<UltraGameStatsProps> = ({
  gameName,
  highScore,
  gamesPlayed,
  timePlayed,
  rank,
  trending = false,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-glow group">
      {/* Shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer" />

      {/* Trending badge */}
      {trending && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 border border-success/30">
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="text-xs font-bold text-success">Hot</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold capitalize group-hover:text-primary transition-colors">
            {gameName.replace('-', ' ')}
          </h3>
          {rank && (
            <p className="text-xs text-muted-foreground">
              Rank #{rank} globally
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Trophy className="w-4 h-4 text-warning mx-auto mb-1" />
          <p className="font-display font-bold text-warning">{highScore.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">High Score</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-display font-bold text-primary">{gamesPlayed}</p>
          <p className="text-xs text-muted-foreground">Games</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Clock className="w-4 h-4 text-secondary mx-auto mb-1" />
          <p className="font-display font-bold text-secondary">{formatTime(timePlayed)}</p>
          <p className="text-xs text-muted-foreground">Time</p>
        </div>
      </div>

      {/* Progress bar (visual flair) */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Mastery</span>
          <span className="text-primary font-bold">{Math.min(gamesPlayed * 5, 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${Math.min(gamesPlayed * 5, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UltraGameStats;
