import React from 'react';
import { Shield, Swords, Crown, Star, Trophy, Flame, Zap } from 'lucide-react';
import UltraCard from './UltraCard';
import UltraProgressBar from './UltraProgressBar';

interface PlayerRankProps {
  points?: number;
  compact?: boolean;
}

const ranks = [
  { name: 'Bronze', min: 0, max: 999, icon: Shield, color: 'hsl(30, 60%, 45%)' },
  { name: 'Silver', min: 1000, max: 2499, icon: Star, color: 'hsl(0, 0%, 70%)' },
  { name: 'Gold', min: 2500, max: 4999, icon: Trophy, color: 'hsl(45, 100%, 50%)' },
  { name: 'Platinum', min: 5000, max: 9999, icon: Zap, color: 'hsl(185, 80%, 55%)' },
  { name: 'Diamond', min: 10000, max: 19999, icon: Crown, color: 'hsl(280, 80%, 65%)' },
  { name: 'Master', min: 20000, max: 49999, icon: Flame, color: 'hsl(15, 100%, 55%)' },
  { name: 'Legend', min: 50000, max: Infinity, icon: Swords, color: 'hsl(320, 100%, 60%)' },
];

const PlayerRank: React.FC<PlayerRankProps> = ({ points = 0, compact = false }) => {
  const currentRank = ranks.find(r => points >= r.min && points <= r.max) || ranks[0];
  const nextRank = ranks[ranks.indexOf(currentRank) + 1];
  const progress = nextRank 
    ? ((points - currentRank.min) / (nextRank.min - currentRank.min)) * 100 
    : 100;

  const RankIcon = currentRank.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel">
        <RankIcon className="w-4 h-4" style={{ color: currentRank.color }} />
        <span className="text-sm font-bold" style={{ color: currentRank.color }}>
          {currentRank.name}
        </span>
      </div>
    );
  }

  return (
    <UltraCard variant="glass" className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${currentRank.color}, ${currentRank.color}80)` }}
        >
          <RankIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Rank</p>
          <h3 className="text-xl font-bold" style={{ color: currentRank.color }}>
            {currentRank.name}
          </h3>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-foreground">{points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Rank Points</p>
        </div>
      </div>

      {nextRank && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Next: {nextRank.name}</span>
            <span className="text-primary">{(nextRank.min - points).toLocaleString()} pts needed</span>
          </div>
          <UltraProgressBar value={progress} max={100} color="primary" size="sm" />
        </div>
      )}
    </UltraCard>
  );
};

export default PlayerRank;
