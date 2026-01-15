import React, { useState, useEffect } from 'react';
import { Target, Clock, Coins, CheckCircle2, Flame, Zap, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import UltraCard from './UltraCard';

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: { coins: number; xp: number };
  icon: React.ReactNode;
  type: 'daily' | 'weekly';
  completed: boolean;
}

interface DailyQuestsProps {
  onClaimReward?: (questId: string, reward: { coins: number; xp: number }) => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ onClaimReward }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: 'play_games',
      title: 'Game Explorer',
      description: 'Play 3 different games',
      progress: 2,
      target: 3,
      reward: { coins: 150, xp: 50 },
      icon: <Gamepad2 className="w-5 h-5" />,
      type: 'daily',
      completed: false,
    },
    {
      id: 'earn_score',
      title: 'Score Chaser',
      description: 'Earn 5,000 total points',
      progress: 3250,
      target: 5000,
      reward: { coins: 200, xp: 75 },
      icon: <Trophy className="w-5 h-5" />,
      type: 'daily',
      completed: false,
    },
    {
      id: 'win_streak',
      title: 'On Fire',
      description: 'Win 5 games in a row',
      progress: 3,
      target: 5,
      reward: { coins: 300, xp: 100 },
      icon: <Flame className="w-5 h-5" />,
      type: 'daily',
      completed: false,
    },
    {
      id: 'quick_play',
      title: 'Speed Demon',
      description: 'Complete a game under 60 seconds',
      progress: 1,
      target: 1,
      reward: { coins: 100, xp: 25 },
      icon: <Zap className="w-5 h-5" />,
      type: 'daily',
      completed: true,
    },
  ]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (quest: Quest) => {
    if (quest.progress >= quest.target && !quest.completed) {
      setQuests(quests.map(q => 
        q.id === quest.id ? { ...q, completed: true } : q
      ));
      onClaimReward?.(quest.id, quest.reward);
    }
  };

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <UltraCard variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Daily Quests</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount}/{quests.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          <Clock className="w-4 h-4 text-warning" />
          <span className="text-sm font-mono font-bold">{timeLeft}</span>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-3">
        {quests.map((quest) => {
          const isComplete = quest.progress >= quest.target;
          const progressPercent = Math.min((quest.progress / quest.target) * 100, 100);

          return (
            <div 
              key={quest.id}
              className={`relative p-4 rounded-xl border transition-all duration-300 ${
                quest.completed 
                  ? 'bg-success/10 border-success/30' 
                  : isComplete 
                    ? 'bg-primary/10 border-primary/30 animate-pulse' 
                    : 'bg-muted/30 border-border/50 hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${
                  quest.completed 
                    ? 'bg-success/20 text-success' 
                    : isComplete 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {quest.completed ? <CheckCircle2 className="w-5 h-5" /> : quest.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${quest.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {quest.title}
                    </h4>
                    {quest.type === 'daily' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                        DAILY
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                  
                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium min-w-[60px] text-right">
                      {quest.progress.toLocaleString()}/{quest.target.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Reward & Claim */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-warning">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{quest.reward.coins}</span>
                    </div>
                    <span className="text-muted-foreground">+{quest.reward.xp} XP</span>
                  </div>
                  
                  {isComplete && !quest.completed && (
                    <Button 
                      size="sm" 
                      variant="gaming"
                      onClick={() => handleClaim(quest)}
                      className="animate-glow-pulse"
                    >
                      Claim
                    </Button>
                  )}
                  {quest.completed && (
                    <span className="text-xs text-success font-medium">Claimed!</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Progress */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Complete all quests for bonus reward!</span>
          <div className="flex items-center gap-1 text-warning font-bold">
            <Coins className="w-4 h-4" />
            500
          </div>
        </div>
        <Progress value={(completedCount / quests.length) * 100} className="h-3" />
      </div>
    </UltraCard>
  );
};

export default DailyQuests;
