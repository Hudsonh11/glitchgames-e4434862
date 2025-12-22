import React from 'react';
import { Users, Gamepad2, Trophy, TrendingUp, Clock, Coins } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  bannedUsers: number;
  activeGames: number;
  totalScores: number;
  totalCoinsInCirculation?: number;
  totalGemsInCirculation?: number;
}

const AdminStats: React.FC<AdminStatsProps> = ({
  totalUsers,
  bannedUsers,
  activeGames,
  totalScores,
  totalCoinsInCirculation = 0,
  totalGemsInCirculation = 0,
}) => {
  const stats = [
    { 
      icon: Users, 
      label: 'Total Users', 
      value: totalUsers.toLocaleString(), 
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    { 
      icon: Users, 
      label: 'Banned', 
      value: bannedUsers.toLocaleString(), 
      color: 'text-destructive',
      bgColor: 'bg-destructive/20'
    },
    { 
      icon: Gamepad2, 
      label: 'Active Games', 
      value: activeGames.toLocaleString(), 
      color: 'text-success',
      bgColor: 'bg-success/20'
    },
    { 
      icon: Trophy, 
      label: 'Leaderboard Entries', 
      value: totalScores.toLocaleString(), 
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
    { 
      icon: Coins, 
      label: 'Coins in Circulation', 
      value: totalCoinsInCirculation.toLocaleString(), 
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
    { 
      icon: Coins, 
      label: 'Gems in Circulation', 
      value: totalGemsInCirculation.toLocaleString(), 
      color: 'text-secondary',
      bgColor: 'bg-secondary/20'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map(({ icon: Icon, label, value, color, bgColor }) => (
        <div key={label} className="p-4 rounded-xl bg-card border border-border">
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-2xl font-display font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
