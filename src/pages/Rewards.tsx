import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Gift, Calendar, Flame, Check, Lock, Sparkles, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import UltraParticles from '@/components/UltraParticles';
import UltraCard from '@/components/UltraCard';
import UltraProgressBar from '@/components/UltraProgressBar';
import UltraBadge from '@/components/UltraBadge';
import UltraConfetti from '@/components/UltraConfetti';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';
import SeasonPass from '@/components/SeasonPass';
import MilestoneTracker from '@/components/MilestoneTracker';

const generateReward = (day: number) => {
  const cycle = Math.floor((day - 1) / 7);
  const dayInCycle = ((day - 1) % 7) + 1;
  const baseCoins = [100, 150, 200, 250, 300, 400, 500];
  const baseGems = [0, 0, 5, 0, 10, 0, 25];
  const multiplier = 1 + (cycle * 0.1);
  return {
    day,
    coins: Math.floor(baseCoins[dayInCycle - 1] * multiplier),
    gems: Math.floor(baseGems[dayInCycle - 1] * multiplier),
    isWeeklyBonus: dayInCycle === 7,
  };
};

const Rewards: React.FC = () => {
  const { isLoggedIn, isLoading, claimDailyReward, currentStreak, lastClaimDate, coins, gems, user, gameStats, achievements } = useGame();
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const canClaim = lastClaimDate !== today;
  const nextRewardDay = currentStreak + 1;

  const displayedRewards = useMemo(() => {
    const rewards = [];
    const startDay = Math.max(1, nextRewardDay - 3);
    for (let i = 0; i < 8; i++) {
      rewards.push(generateReward(startDay + i));
    }
    return rewards;
  }, [nextRewardDay]);

  const totalGamesPlayed = useMemo(() => {
    return Object.values(gameStats).reduce((sum, s) => sum + s.gamesPlayed, 0);
  }, [gameStats]);

  const milestones = useMemo(() => [
    { id: 'games_10', title: 'Play 10 Games', description: 'Play any 10 games', target: 10, current: totalGamesPlayed, reward: { coins: 200, gems: 5 }, icon: '🎮' },
    { id: 'games_50', title: 'Play 50 Games', description: 'Play any 50 games', target: 50, current: totalGamesPlayed, reward: { coins: 500, gems: 15 }, icon: '🏅' },
    { id: 'coins_1000', title: 'Coin Collector', description: 'Earn 1,000 coins', target: 1000, current: coins, reward: { coins: 300, gems: 10 }, icon: '🪙' },
    { id: 'streak_7', title: 'Week Warrior', description: '7-day login streak', target: 7, current: currentStreak, reward: { coins: 500, gems: 25 }, icon: '🔥' },
    { id: 'streak_30', title: 'Monthly Legend', description: '30-day login streak', target: 30, current: currentStreak, reward: { coins: 2000, gems: 100 }, icon: '👑' },
    { id: 'achieve_5', title: 'Achievement Hunter', description: 'Unlock 5 achievements', target: 5, current: achievements.length, reward: { coins: 300, gems: 20 }, icon: '🏆' },
  ], [totalGamesPlayed, coins, currentStreak, achievements.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <UltraLoadingSpinner size="lg" text="Loading rewards..." />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" />;

  const handleClaim = async (day: number) => {
    if (!canClaim || day !== nextRewardDay) return;
    const reward = generateReward(day);
    const success = await claimDailyReward(day);
    if (success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast({
        title: reward.isWeeklyBonus ? '🎉 Weekly Bonus!' : 'Reward Claimed!',
        description: `+${reward.coins} coins${reward.gems ? ` +${reward.gems} gems` : ''}!`,
      });
    }
  };

  const currentCycle = Math.floor(currentStreak / 7);
  const bonusMultiplier = currentCycle * 10;
  const weekProgress = (currentStreak % 7) / 7 * 100;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <UltraConfetti active={showConfetti} />
      <UltraParticles count={20} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-success/30 to-primary/30 mb-4 animate-float relative">
              <Gift className="w-10 h-10 text-success" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning animate-pulse" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Endless Rewards</h1>
            <p className="text-muted-foreground">Log in every day for better rewards!</p>
          </div>

          {/* Streak Banner */}
          <UltraCard variant="premium" glow className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <Flame className="w-9 h-9 text-primary-foreground animate-pulse" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Current Streak</p>
                  <p className="font-display text-4xl font-bold text-gradient">{currentStreak} Days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Next Reward</p>
                <p className="font-display text-2xl font-bold">Day {nextRewardDay}</p>
                {bonusMultiplier > 0 && (
                  <UltraBadge variant="legendary" size="sm">+{bonusMultiplier}% Bonus</UltraBadge>
                )}
              </div>
            </div>
          </UltraCard>

          {/* Week Progress */}
          <UltraCard variant="glass" className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <UltraBadge variant="premium" icon="trophy" size="sm">Week {currentCycle + 1}</UltraBadge>
              <span className="text-sm text-muted-foreground">{currentStreak % 7} / 7 days</span>
            </div>
            <UltraProgressBar value={weekProgress} max={100} animated glow />
          </UltraCard>

          {/* Status */}
          {canClaim && (
            <UltraCard variant="premium" glow className="p-4 mb-6">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-success animate-pulse" />
                <span className="text-success font-medium">✨ Your daily reward is ready!</span>
              </div>
            </UltraCard>
          )}

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {displayedRewards.map((reward) => {
              const isPast = reward.day < nextRewardDay;
              const isCurrent = reward.day === nextRewardDay;
              return (
                <div
                  key={reward.day}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isPast ? 'bg-muted/50 border-border opacity-70' :
                    isCurrent ? 'bg-card border-primary shadow-neon-cyan animate-pulse-glow' :
                    'bg-card border-border opacity-60'
                  }`}
                >
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPast ? 'bg-success text-success-foreground' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : reward.day}
                  </div>
                  {reward.isWeeklyBonus && <Trophy className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-warning" />}
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Day {reward.day}</p>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-xl">🪙</span>
                      <span className="font-display font-bold text-warning">{reward.coins}</span>
                    </div>
                    {reward.gems > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg">💎</span>
                        <span className="font-display font-bold text-secondary">{reward.gems}</span>
                      </div>
                    )}
                    {isCurrent && canClaim && (
                      <Button variant="gaming" size="sm" className="w-full mt-3" onClick={() => handleClaim(reward.day)}>
                        Claim!
                      </Button>
                    )}
                    {!isPast && !isCurrent && <Lock className="w-4 h-4 text-muted-foreground mx-auto mt-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Milestones */}
          <div className="mb-8">
            <MilestoneTracker milestones={milestones} title="Milestone Rewards" />
          </div>

          {/* Season Pass */}
          <SeasonPass
            currentTier={Math.floor(totalGamesPlayed / 5) + 1}
            currentXP={(user?.xp || 0) % 500}
            xpPerTier={500}
            isPremium={false}
            seasonName="Season 1: Neon Legends"
            daysLeft={42}
          />
        </div>
      </div>
    </div>
  );
};

export default Rewards;
