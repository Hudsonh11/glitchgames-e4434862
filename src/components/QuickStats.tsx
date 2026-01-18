import React from 'react';
import { Gamepad2, Clock, Trophy, Flame, TrendingUp, Target } from 'lucide-react';
import UltraCard from './UltraCard';
import { useGame } from '@/contexts/GameContext';

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, color, trend }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
    <div 
      className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-success text-sm">
        <TrendingUp className="w-3 h-3" />
        <span>{trend}</span>
      </div>
    )}
  </div>
);

const QuickStats: React.FC = () => {
  const { user, currentStreak, gameStats } = useGame();

  const totalGamesPlayed = user?.gamesPlayed || Object.values(gameStats).reduce((sum, s) => sum + s.gamesPlayed, 0);
  const totalTimePlayed = Object.values(gameStats).reduce((sum, s) => sum + s.timePlayed, 0);
  const highestScore = Object.values(gameStats).reduce((max, s) => Math.max(max, s.highScore), 0);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <UltraCard variant="glass" className="p-4">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Your Stats
      </h3>
      
      <div className="space-y-1">
        <StatItem
          icon={Gamepad2}
          label="Games Played"
          value={totalGamesPlayed}
          color="hsl(var(--primary))"
          trend="+12"
        />
        <StatItem
          icon={Clock}
          label="Time Played"
          value={formatTime(totalTimePlayed)}
          color="hsl(var(--secondary))"
        />
        <StatItem
          icon={Target}
          label="Best Score"
          value={highestScore.toLocaleString()}
          color="hsl(var(--warning))"
        />
        <StatItem
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} days`}
          color="hsl(15, 100%, 55%)"
          trend={currentStreak > 0 ? '🔥' : undefined}
        />
      </div>
    </UltraCard>
  );
};

export default QuickStats;
