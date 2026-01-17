import React from 'react';
import { Trophy, Medal, Crown, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraAvatar from '@/components/UltraAvatar';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar?: string;
  score: number;
  level: number;
}

interface MiniLeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  gameId?: string;
}

const rankIcons = {
  1: Crown,
  2: Medal,
  3: Trophy,
};

const rankColors = {
  1: 'text-warning bg-warning/20',
  2: 'text-muted-foreground bg-muted',
  3: 'text-amber-700 bg-amber-700/20',
};

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ 
  entries, 
  title = "Top Players",
  gameId 
}) => {
  return (
    <UltraCard variant="glass" className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          {title}
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/leaderboard">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <div className="space-y-2">
        {entries.slice(0, 5).map((entry, index) => {
          const RankIcon = rankIcons[entry.rank as keyof typeof rankIcons];
          const rankColor = rankColors[entry.rank as keyof typeof rankColors];
          
          return (
            <div
              key={entry.username}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-muted/50",
                entry.rank <= 3 && "bg-muted/30"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm",
                rankColor || "bg-muted text-muted-foreground"
              )}>
                {RankIcon ? (
                  <RankIcon className="w-4 h-4" />
                ) : (
                  entry.rank
                )}
              </div>
              
              <UltraAvatar 
                src={entry.avatar || ''} 
                size="sm" 
                level={entry.level}
                border={entry.rank === 1 ? 'warning' : entry.rank <= 3 ? 'secondary' : undefined}
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.username}</p>
                <p className="text-xs text-muted-foreground">Level {entry.level}</p>
              </div>
              
              <div className="text-right">
                <p className="font-display font-bold text-warning">
                  {entry.score.toLocaleString()}
                </p>
                {entry.rank <= 3 && (
                  <TrendingUp className="w-3 h-3 text-success ml-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </UltraCard>
  );
};

export default MiniLeaderboard;
