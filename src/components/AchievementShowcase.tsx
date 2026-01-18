import React from 'react';
import { Trophy, Star, Zap, Target, Crown, Flame, Medal, Award } from 'lucide-react';
import UltraCard from './UltraCard';
import UltraBadge from './UltraBadge';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
}

const achievements: Achievement[] = [
  { id: 'first_win', name: 'First Victory', description: 'Win your first game', icon: Trophy, rarity: 'common', unlocked: true },
  { id: 'high_scorer', name: 'High Scorer', description: 'Score over 10,000 points', icon: Star, rarity: 'rare', unlocked: true },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a game in under 1 minute', icon: Zap, rarity: 'epic', unlocked: false },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Achieve a perfect score', icon: Target, rarity: 'legendary', unlocked: false },
  { id: 'champion', name: 'Champion', description: 'Reach #1 on any leaderboard', icon: Crown, rarity: 'legendary', unlocked: false },
  { id: 'streak_master', name: 'Streak Master', description: 'Maintain a 30-day login streak', icon: Flame, rarity: 'epic', unlocked: false },
  { id: 'collector', name: 'Collector', description: 'Play all 50 games', icon: Medal, rarity: 'rare', unlocked: false },
  { id: 'veteran', name: 'Veteran', description: 'Play 100 games total', icon: Award, rarity: 'common', unlocked: true },
];

const rarityColors = {
  common: 'from-muted to-muted/60',
  rare: 'from-primary to-primary/60',
  epic: 'from-secondary to-secondary/60',
  legendary: 'from-warning to-destructive/60',
};

const AchievementShowcase: React.FC = () => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <UltraCard variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Achievements
        </h3>
        <UltraBadge variant="rare" size="sm">
          {unlockedCount}/{achievements.length}
        </UltraBadge>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={`relative group cursor-pointer transition-all duration-300 ${
                achievement.unlocked ? 'opacity-100' : 'opacity-40 grayscale'
              }`}
            >
              <div 
                className={`w-full aspect-square rounded-xl bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                <p className="text-sm font-bold text-foreground">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                <UltraBadge variant={achievement.rarity} size="sm">
                  {achievement.rarity}
                </UltraBadge>
              </div>
              
              {achievement.unlocked && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </UltraCard>
  );
};

export default AchievementShowcase;
