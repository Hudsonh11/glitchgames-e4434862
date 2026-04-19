import React, { useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
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
import StreakFreezeShield from '@/components/StreakFreezeShield';
import { supabase } from '@/integrations/supabase/client';

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
  const [isPremium, setIsPremium] = useState(false);
  const [searchParams] = useSearchParams();

  // Verify premium status from server. When returning from Stripe checkout
  // (?purchase=success&session_id=cs_...) we hit the `verify-purchase` edge
  // function, which asks Stripe directly whether the session was paid and
  // grants the pass via the service role. The DB has UNIQUE(stripe_session_id)
  // so retries / replays cannot grant twice.
  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const justPurchased = searchParams.get('purchase') === 'success';
    const sessionId = searchParams.get('session_id');

    const checkExistingPurchase = async () => {
      const { data } = await supabase
        .from('battle_pass_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('season', 'season_1')
        .eq('status', 'completed')
        .maybeSingle();
      if (cancelled) return;
      setIsPremium(!!data);
      return !!data;
    };

    const run = async () => {
      // Always read current state first.
      const owned = await checkExistingPurchase();

      // Only attempt to verify a payment if Stripe redirected with a session id.
      // Without it, no amount of URL tampering can grant the pass.
      if (justPurchased && sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-purchase', {
            body: { session_id: sessionId },
          });
          if (cancelled) return;

          if (!error && data?.ok) {
            setIsPremium(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
            toast({
              title: '🎉 Premium Unlocked!',
              description: 'Welcome to the Premium Battle Pass! Enjoy your exclusive rewards + 1000 coins & 50 gems bonus!',
            });
          } else if (!owned) {
            toast({
              title: 'Payment not confirmed',
              description: 'We could not verify your purchase. If you completed payment, please refresh in a moment.',
              variant: 'destructive',
            });
          }
        } catch (e) {
          console.error('verify-purchase failed', e);
        }
      } else if (justPurchased && !sessionId && !owned) {
        // Someone tried to spoof success without a real session id.
        toast({
          title: 'Invalid checkout return',
          description: 'No valid payment session was provided.',
          variant: 'destructive',
        });
      }
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id, searchParams]);

  // Realtime: when a Battle Pass is granted to this user (by Stripe webhook OR
  // by an admin via admin-grant-pass), flip the UI to Premium instantly and
  // notify them with a celebratory toast — no refresh required.
  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`bp-purchases-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_pass_purchases',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { status?: string; amount_cents?: number };
          if (row?.status !== 'completed') return;
          setIsPremium(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
          const wasGift = (row.amount_cents ?? 0) === 0;
          toast({
            title: wasGift ? '🎁 Premium Battle Pass Granted!' : '🎉 Premium Unlocked!',
            description: wasGift
              ? 'An admin gifted you the Premium Battle Pass. All exclusive rewards are now unlocked!'
              : 'Welcome to Premium! Enjoy your exclusive rewards.',
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, toast]);

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
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-gradient break-words">Endless Rewards</h1>
            <p className="text-muted-foreground">Log in every day for better rewards!</p>
          </div>

          {/* Streak Banner */}
          <UltraCard variant="premium" glow className="p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                  <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-primary-foreground animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm">Current Streak</p>
                  <p className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-gradient truncate">{currentStreak} Days</p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-muted-foreground text-xs sm:text-sm">Next Reward</p>
                <p className="font-display text-lg sm:text-2xl font-bold">Day {nextRewardDay}</p>
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

          {/* Streak Freeze */}
          <div className="mb-6">
            <StreakFreezeShield freezesAvailable={currentStreak >= 7 ? 1 : 0} currentStreak={currentStreak} />
          </div>

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
            isPremium={isPremium}
            seasonName="Season 1: Neon Legends"
            daysLeft={42}
          />

        </div>
      </div>
    </div>
  );
};

export default Rewards;
