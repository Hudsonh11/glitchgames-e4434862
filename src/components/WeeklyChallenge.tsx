import React from 'react';
import { Calendar, Trophy, Clock, Target, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from './UltraCard';
import UltraProgressBar from './UltraProgressBar';
import UltraBadge from './UltraBadge';

interface WeeklyChallengeProps {
  onJoin?: () => void;
}

const WeeklyChallenge: React.FC<WeeklyChallengeProps> = ({ onJoin }) => {
  const challenge = {
    title: 'Puzzle Master Week',
    description: 'Score 50,000 total points in puzzle games',
    game: 'Puzzle Games',
    currentProgress: 32450,
    target: 50000,
    daysLeft: 4,
    participants: 1247,
    rewards: { coins: 2500, gems: 50 },
    joined: true,
  };

  const progress = (challenge.currentProgress / challenge.target) * 100;

  return (
    <UltraCard variant="gradient" glow className="p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <UltraBadge variant="epic" size="sm">Weekly Challenge</UltraBadge>
              <h3 className="text-lg font-bold text-foreground">{challenge.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{challenge.daysLeft}d left</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-bold">
              {challenge.currentProgress.toLocaleString()} / {challenge.target.toLocaleString()}
            </span>
          </div>
          <UltraProgressBar value={progress} max={100} color="primary" size="md" animated />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-warning">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-bold">{challenge.rewards.coins}</span>
            </div>
            <div className="flex items-center gap-1 text-secondary">
              <span className="text-sm">+{challenge.rewards.gems} gems</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Target className="w-4 h-4" />
              <span>{challenge.participants.toLocaleString()} players</span>
            </div>
            
            {challenge.joined ? (
              <Button variant="outline" size="sm" disabled>
                <Calendar className="w-4 h-4 mr-1" />
                Joined
              </Button>
            ) : (
              <Button variant="gaming" size="sm" onClick={onJoin}>
                Join Challenge
              </Button>
            )}
          </div>
        </div>
      </div>
    </UltraCard>
  );
};

export default WeeklyChallenge;
