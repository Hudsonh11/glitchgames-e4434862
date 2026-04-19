import React from 'react';
import { Crown, Lock, Star, Gift, Sparkles, ChevronRight, Zap, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import UltraProgressBar from '@/components/UltraProgressBar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SeasonReward {
  tier: number;
  freeReward: { type: 'coins' | 'gems' | 'title' | 'border'; amount?: number; name?: string };
  premiumReward: { type: 'coins' | 'gems' | 'title' | 'border' | 'avatar'; amount?: number; name?: string };
}

interface SeasonPassProps {
  currentTier: number;
  currentXP: number;
  xpPerTier: number;
  isPremium: boolean;
  seasonName: string;
  daysLeft: number;
}

const rewards: SeasonReward[] = [
  { tier: 1, freeReward: { type: 'coins', amount: 100 }, premiumReward: { type: 'coins', amount: 500 } },
  { tier: 2, freeReward: { type: 'coins', amount: 150 }, premiumReward: { type: 'gems', amount: 10 } },
  { tier: 3, freeReward: { type: 'title', name: 'Newcomer' }, premiumReward: { type: 'border', name: 'Flame' } },
  { tier: 4, freeReward: { type: 'coins', amount: 200 }, premiumReward: { type: 'coins', amount: 750 } },
  { tier: 5, freeReward: { type: 'gems', amount: 5 }, premiumReward: { type: 'avatar', name: 'Pro Gamer' } },
];

const rewardIcons = {
  coins: '🪙',
  gems: '💎',
  title: '📜',
  border: '🖼️',
  avatar: '👤',
};

const SeasonPass: React.FC<SeasonPassProps> = ({
  currentTier,
  currentXP,
  xpPerTier,
  isPremium,
  seasonName,
  daysLeft,
}) => {
  const tierProgress = (currentXP % xpPerTier) / xpPerTier * 100;
  const [purchasing, setPurchasing] = React.useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          season: 'season_1',
          returnUrl: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.error === 'Already purchased') {
        toast({ title: 'Already Owned!', description: 'You already have the Premium Battle Pass! Refresh to see it.' });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      toast({ title: 'Error', description: 'Could not start checkout. Please try again.', variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <UltraCard variant="premium" glow className="overflow-hidden">
      {/* Header */}
      <div className="relative p-4 sm:p-6 bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-warning fill-warning shrink-0" />
              <h2 className="font-display text-lg sm:text-2xl font-bold text-white truncate">{seasonName}</h2>
            </div>
            <p className="text-white/70 text-xs sm:text-sm">{daysLeft} days remaining</p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
            <UltraBadge variant={isPremium ? 'legendary' : 'common'} size="sm">
              {isPremium ? 'Premium' : 'Free Pass'}
            </UltraBadge>
            {!isPremium && (
              <Button variant="gaming" size="sm" onClick={handleUpgrade} disabled={purchasing} className="text-xs sm:text-sm">
                {purchasing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                {purchasing ? 'Loading…' : 'Upgrade $4.99'}
              </Button>
            )}
            {isPremium && (
              <div className="flex items-center gap-1 text-success text-xs sm:text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Active
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tier {currentTier}</span>
          <span className="text-sm text-muted-foreground">{currentXP} / {xpPerTier} XP</span>
        </div>
        <UltraProgressBar value={tierProgress} max={100} animated glow />
      </div>
      
      {/* Rewards Track */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {rewards.map((reward, index) => {
            const isUnlocked = currentTier >= reward.tier;
            const isCurrent = currentTier === reward.tier - 1;
            
            return (
              <div
                key={reward.tier}
                className={cn(
                  "flex flex-col gap-2 min-w-[100px] p-3 rounded-xl border transition-all",
                  isUnlocked ? "border-success/50 bg-success/10" :
                  isCurrent ? "border-primary animate-pulse" :
                  "border-border/50 bg-muted/30 opacity-60"
                )}
              >
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">Tier {reward.tier}</span>
                </div>
                
                {/* Free Reward */}
                <div className={cn(
                  "p-2 rounded-lg text-center",
                  isUnlocked ? "bg-background" : "bg-muted/50"
                )}>
                  <span className="text-xl">{rewardIcons[reward.freeReward.type]}</span>
                  <p className="text-xs font-medium mt-1">
                    {reward.freeReward.amount || reward.freeReward.name}
                  </p>
                </div>
                
                {/* Premium Reward */}
                <div className={cn(
                  "p-2 rounded-lg text-center relative",
                  isUnlocked && isPremium ? "bg-gradient-to-br from-warning/20 to-secondary/20" :
                  "bg-muted/50"
                )}>
                  {!isPremium && (
                    <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
                  )}
                  <Crown className="w-4 h-4 text-warning mx-auto mb-1" />
                  <span className="text-xl">{rewardIcons[reward.premiumReward.type]}</span>
                  <p className="text-xs font-medium mt-1">
                    {reward.premiumReward.amount || reward.premiumReward.name}
                  </p>
                </div>
              </div>
            );
          })}
          
          <div className="flex items-center px-4">
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </div>
    </UltraCard>
  );
};

export default SeasonPass;
