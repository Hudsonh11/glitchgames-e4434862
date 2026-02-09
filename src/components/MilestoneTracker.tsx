import React from 'react';
import { Target, CheckCircle2, Lock, Gift, Sparkles } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import UltraProgressBar from '@/components/UltraProgressBar';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: { coins: number; gems: number };
  icon: string;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  title?: string;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ milestones, title = "Milestones" }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        {title}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {milestones.map((milestone) => {
          const isComplete = milestone.current >= milestone.target;
          const progress = Math.min((milestone.current / milestone.target) * 100, 100);
          
          return (
            <UltraCard
              key={milestone.id}
              variant={isComplete ? 'premium' : 'glass'}
              glow={isComplete}
              className={cn("p-4", isComplete && "border-success/30")}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                  isComplete ? "bg-success/20" : "bg-muted"
                )}>
                  {isComplete ? <CheckCircle2 className="w-6 h-6 text-success" /> : milestone.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display font-bold text-sm">{milestone.title}</h4>
                    {isComplete && <UltraBadge variant="new" size="sm">Done!</UltraBadge>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{milestone.description}</p>
                  <UltraProgressBar value={progress} max={100} animated={!isComplete} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {milestone.current.toLocaleString()}/{milestone.target.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5"><span>🪙</span>{milestone.reward.coins}</span>
                      {milestone.reward.gems > 0 && <span className="flex items-center gap-0.5"><span>💎</span>{milestone.reward.gems}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </UltraCard>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTracker;
