import React from 'react';
import { Trophy, Gamepad2, Clock, Flame, Target, Star, TrendingUp, Award } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  totalGamesPlayed: number;
  totalScore: number;
  totalTimePlayed: number;
  achievements: number;
  currentStreak: number;
  level: number;
  favoriteGame?: string;
  winRate?: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalGamesPlayed,
  totalScore,
  totalTimePlayed,
  achievements,
  currentStreak,
  level,
  favoriteGame,
  winRate,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const stats = [
    { icon: Gamepad2, label: 'Games Played', value: totalGamesPlayed.toLocaleString(), color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Trophy, label: 'Total Score', value: totalScore.toLocaleString(), color: 'text-warning', bg: 'bg-warning/10' },
    { icon: Clock, label: 'Time Played', value: formatTime(totalTimePlayed), color: 'text-secondary', bg: 'bg-secondary/10' },
    { icon: Award, label: 'Achievements', value: achievements.toString(), color: 'text-success', bg: 'bg-success/10' },
    { icon: Flame, label: 'Day Streak', value: `${currentStreak}🔥`, color: 'text-error', bg: 'bg-error/10' },
    { icon: Star, label: 'Level', value: level.toString(), color: 'text-accent', bg: 'bg-accent/10' },
    { icon: Target, label: 'Favorite', value: favoriteGame || 'N/A', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: TrendingUp, label: 'Win Rate', value: winRate ? `${winRate}%` : 'N/A', color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color, bg }) => (
        <UltraCard key={label} variant="glass" className="p-4 hover:scale-[1.02] transition-transform">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <p className="font-display font-bold text-lg">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </UltraCard>
      ))}
    </div>
  );
};

export default StatsOverview;
