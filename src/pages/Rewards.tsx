import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Gift, Calendar, Flame, Check, Lock, Sparkles, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

// Generate infinite rewards based on the day number
const generateReward = (day: number) => {
  const cycle = Math.floor((day - 1) / 7); // Which week cycle
  const dayInCycle = ((day - 1) % 7) + 1; // Day within the cycle (1-7)
  
  const baseCoins = [100, 150, 200, 250, 300, 400, 500];
  const baseGems = [0, 0, 5, 0, 10, 0, 25];
  
  // Scale rewards by cycle (10% bonus per completed week)
  const multiplier = 1 + (cycle * 0.1);
  
  return {
    day,
    coins: Math.floor(baseCoins[dayInCycle - 1] * multiplier),
    gems: Math.floor(baseGems[dayInCycle - 1] * multiplier),
    isWeeklyBonus: dayInCycle === 7,
  };
};

const Rewards: React.FC = () => {
  const { isLoggedIn, isLoading, claimDailyReward, currentStreak, lastClaimDate, addCoins, addGems } = useGame();
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const canClaim = lastClaimDate !== today;
  const nextRewardDay = currentStreak + 1;

  // Generate rewards dynamically based on current streak
  const displayedRewards = useMemo(() => {
    const rewards = [];
    const startDay = Math.max(1, nextRewardDay - 3);
    for (let i = 0; i < 8; i++) {
      rewards.push(generateReward(startDay + i));
    }
    return rewards;
  }, [nextRewardDay]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const handleClaim = async (day: number) => {
    if (!canClaim) {
      toast({
        title: 'Already Claimed',
        description: 'Come back tomorrow for your next reward!',
        variant: 'destructive',
      });
      return;
    }

    if (day !== nextRewardDay) {
      toast({
        title: 'Not Available',
        description: `You need to claim Day ${nextRewardDay} first!`,
        variant: 'destructive',
      });
      return;
    }

    const reward = generateReward(day);
    const success = await claimDailyReward(day);
    if (success) {
      toast({
        title: reward.isWeeklyBonus ? '🎉 Weekly Bonus Claimed!' : 'Reward Claimed!',
        description: `You received ${reward.coins} coins${reward.gems ? ` and ${reward.gems} gems` : ''}!`,
      });
    }
  };

  const currentCycle = Math.floor(currentStreak / 7);
  const bonusMultiplier = Math.floor((currentCycle) * 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-success/30 to-primary/30 mb-4 animate-float relative">
              <Gift className="w-10 h-10 text-success" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning animate-pulse" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Endless Rewards</h1>
            <p className="text-muted-foreground">
              Log in every day for better and better rewards! No limit!
            </p>
          </div>

          {/* Streak Banner */}
          <div className="p-6 rounded-2xl bg-gradient-hero mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center relative">
                  <Flame className="w-9 h-9 text-primary-foreground animate-pulse" />
                  {currentStreak >= 7 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                      <Star className="w-4 h-4 text-warning-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Current Streak</p>
                  <p className="font-display text-4xl font-bold text-primary-foreground">
                    {currentStreak} Days
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/80 text-sm">Next Reward</p>
                <p className="font-display text-2xl font-bold text-primary-foreground">
                  Day {nextRewardDay}
                </p>
                {bonusMultiplier > 0 && (
                  <p className="text-xs text-success font-bold mt-1">
                    +{bonusMultiplier}% Bonus Active!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="p-4 rounded-xl bg-card border border-border mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Week {currentCycle + 1} Progress</span>
              <span className="text-sm text-muted-foreground">{(currentStreak % 7)} / 7 days</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500 rounded-full"
                style={{ width: `${((currentStreak % 7) / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Complete week {currentCycle + 1} to unlock +{(currentCycle + 1) * 10}% bonus rewards!
            </p>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-xl mb-6 transition-all ${canClaim ? 'bg-success/20 border border-success/30 shadow-neon-cyan' : 'bg-muted border border-border'}`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${canClaim ? 'text-success animate-pulse' : 'text-muted-foreground'}`} />
              <span className={canClaim ? 'text-success font-medium' : 'text-muted-foreground'}>
                {canClaim ? '✨ Your daily reward is ready!' : 'Come back tomorrow for your next reward!'}
              </span>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {displayedRewards.map((reward) => {
              const isPast = reward.day < nextRewardDay;
              const isCurrent = reward.day === nextRewardDay;
              const isFuture = reward.day > nextRewardDay;

              return (
                <div
                  key={reward.day}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    isPast
                      ? 'bg-muted/50 border-border scale-95 opacity-70'
                      : isCurrent
                      ? 'bg-card border-primary shadow-neon-cyan scale-105 animate-pulse-glow'
                      : 'bg-card border-border opacity-60 hover:opacity-80'
                  }`}
                >
                  {/* Day Badge */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isPast ? 'bg-success text-success-foreground' : isCurrent ? 'bg-primary text-primary-foreground animate-bounce' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : reward.day}
                  </div>

                  {/* Weekly Bonus Indicator */}
                  {reward.isWeeklyBonus && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Trophy className="w-5 h-5 text-warning animate-float" />
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Day {reward.day}</p>
                    
                    {/* Coins */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-xl">🪙</span>
                      <span className="font-display font-bold text-warning">{reward.coins}</span>
                    </div>

                    {/* Gems */}
                    {reward.gems > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg">💎</span>
                        <span className="font-display font-bold text-secondary">{reward.gems}</span>
                      </div>
                    )}

                    {/* Claim Button */}
                    {isCurrent && canClaim && (
                      <Button
                        variant="gaming"
                        size="sm"
                        className="w-full mt-3 animate-pulse"
                        onClick={() => handleClaim(reward.day)}
                      >
                        Claim!
                      </Button>
                    )}

                    {isFuture && (
                      <div className="mt-3 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bonus Info */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              Streak Milestones
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Every 7-Day Streak</span>
                <span className="text-success font-bold">+10% Bonus to all rewards!</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Day 7 Weekly Bonus</span>
                <span className="text-warning font-bold">500+ Coins + 25+ Gems!</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/20 to-success/20">
                <span className="text-foreground font-medium">Rewards never stop!</span>
                <span className="text-primary font-bold">∞ Endless Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
