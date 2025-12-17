import React from 'react';
import { Navigate } from 'react-router-dom';
import { Gift, Calendar, Flame, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

const Rewards: React.FC = () => {
  const { isLoggedIn, dailyRewards, claimDailyReward, currentStreak, lastClaimDate, addCoins, addGems } = useGame();
  const { toast } = useToast();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const today = new Date().toDateString();
  const canClaim = lastClaimDate !== today;
  const nextRewardDay = currentStreak < 7 ? currentStreak + 1 : 1;

  const handleClaim = (day: number) => {
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

    const success = claimDailyReward(day);
    if (success) {
      const reward = dailyRewards.find(r => r.day === day);
      toast({
        title: '🎉 Reward Claimed!',
        description: `You received ${reward?.coins} coins${reward?.gems ? ` and ${reward.gems} gems` : ''}!`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/20 mb-4 animate-float">
              <Gift className="w-8 h-8 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Daily Rewards</h1>
            <p className="text-muted-foreground">
              Log in every day to claim amazing rewards!
            </p>
          </div>

          {/* Streak Banner */}
          <div className="p-6 rounded-2xl bg-gradient-hero mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Current Streak</p>
                  <p className="font-display text-3xl font-bold text-primary-foreground">
                    {currentStreak} Days
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/80 text-sm">Next Reward</p>
                <p className="font-display text-xl font-bold text-primary-foreground">
                  Day {nextRewardDay}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-xl mb-8 ${canClaim ? 'bg-success/20 border border-success/30' : 'bg-muted border border-border'}`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${canClaim ? 'text-success' : 'text-muted-foreground'}`} />
              <span className={canClaim ? 'text-success font-medium' : 'text-muted-foreground'}>
                {canClaim ? 'You can claim your daily reward!' : 'Come back tomorrow for your next reward!'}
              </span>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {dailyRewards.map((reward) => {
              const isClaimed = reward.day <= currentStreak && lastClaimDate === today;
              const isPast = reward.day < nextRewardDay;
              const isCurrent = reward.day === nextRewardDay;
              const isFuture = reward.day > nextRewardDay;

              return (
                <div
                  key={reward.day}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isPast
                      ? 'bg-muted/50 border-border'
                      : isCurrent
                      ? 'bg-card border-primary shadow-neon-cyan'
                      : 'bg-card border-border opacity-70'
                  }`}
                >
                  {/* Day Badge */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPast ? 'bg-success text-success-foreground' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : reward.day}
                  </div>

                  <div className="text-center">
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
                        className="w-full mt-3"
                        onClick={() => handleClaim(reward.day)}
                      >
                        Claim
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
            <h3 className="font-display font-bold mb-4">Streak Bonuses</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">7-Day Streak</span>
                <span className="text-success font-bold">500 Coins + 25 Gems!</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Keep your streak going!</span>
                <span className="text-primary font-bold">Better rewards daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
