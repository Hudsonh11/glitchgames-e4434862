import React from 'react';
import { Trophy, Star, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import UltraProgressBar from '@/components/UltraProgressBar';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  reward: { type: 'coins' | 'gems' | 'xp'; amount: number };
}

interface AchievementProgressProps {
  achievements: Achievement[];
  title?: string;
}

const rarityColors = {
  common: 'border-muted',
  rare: 'border-primary',
  epic: 'border-secondary',
  legendary: 'border-warning',
};

const AchievementProgress: React.FC<AchievementProgressProps> = ({ 
  achievements,
  title = "Achievements in Progress"
}) => {
  const inProgress = achievements.filter(a => a.progress > 0 && a.progress < a.maxProgress);
  const completed = achievements.filter(a => a.progress >= a.maxProgress);
  const locked = achievements.filter(a => a.progress === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          {title}
        </h3>
        <UltraBadge variant="rare" size="sm">
          {completed.length}/{achievements.length} Complete
        </UltraBadge>
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary" />
            In Progress
          </h4>
          {inProgress.map((achievement, index) => (
            <UltraCard
              key={achievement.id}
              variant="glass"
              className={cn(
                "p-4 border-l-4 animate-fade-in-up",
                rarityColors[achievement.rarity]
              )}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display font-bold">{achievement.name}</h4>
                    <UltraBadge variant={achievement.rarity} size="sm">
                      {achievement.rarity}
                    </UltraBadge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <UltraProgressBar 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        max={100} 
                        animated 
                      />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">
                      {achievement.reward.type === 'coins' ? '🪙' : achievement.reward.type === 'gems' ? '💎' : '⭐'}
                    </span>
                    <span className="font-display font-bold">{achievement.reward.amount}</span>
                  </div>
                </div>
              </div>
            </UltraCard>
          ))}
        </div>
      )}

      {/* Completed Preview */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Completed ({completed.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {completed.slice(0, 6).map((achievement) => (
              <div
                key={achievement.id}
                className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center text-2xl border border-success/30"
                title={achievement.name}
              >
                {achievement.icon}
              </div>
            ))}
            {completed.length > 6 && (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                +{completed.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locked Preview */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Lock className="w-4 h-4" />
            Locked ({locked.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {locked.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl opacity-50 grayscale"
                title={`${achievement.name} - ${achievement.description}`}
              >
                {achievement.icon}
              </div>
            ))}
            {locked.length > 4 && (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                +{locked.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementProgress;
