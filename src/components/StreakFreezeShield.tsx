import React, { useEffect, useState } from 'react';
import { Snowflake, Check } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  /**
   * @deprecated kept for backwards compatibility — freeze availability is now
   * derived from the user's current streak tier and one-shot consumption state.
   */
  freezesAvailable?: number;
  currentStreak: number;
}

/**
 * Streak Freeze is a one-shot shield earned at every 7-day streak tier
 * (7, 14, 21, ...). Once consumed for a tier it stays consumed until the
 * user reaches the next tier — fixing the previous bug where the shield
 * appeared permanently active and never ended.
 */
const StreakFreezeShield = ({ currentStreak }: Props) => {
  const { toast } = useToast();
  const tier = Math.floor(currentStreak / 7); // tier 1 unlocks at streak 7
  const tierKey = `streakFreezeUsed_tier_${tier}`;
  const [used, setUsed] = useState<boolean>(() =>
    typeof window !== 'undefined' && tier > 0 ? localStorage.getItem(tierKey) === '1' : false,
  );

  useEffect(() => {
    if (tier > 0) setUsed(localStorage.getItem(tierKey) === '1');
    else setUsed(false);
  }, [tier, tierKey]);

  if (currentStreak < 3) return null;

  const earned = tier > 0;
  const available = earned && !used;
  const nextTierIn = 7 - (currentStreak % 7);

  const consume = () => {
    localStorage.setItem(tierKey, '1');
    setUsed(true);
    toast({
      title: '🛡️ Streak Freeze used',
      description: `Your ${currentStreak}-day streak is protected for one missed day.`,
    });
  };

  return (
    <UltraCard variant="glass" className="p-4 flex items-center gap-3 flex-wrap">
      <div className="p-2 rounded-lg bg-info/20">
        <Snowflake className="w-5 h-5 text-info" />
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium">Streak Freeze</p>
        <p className="text-xs text-muted-foreground">
          {available
            ? `Protects your ${currentStreak}-day streak if you miss a day`
            : used
              ? `Used — earn another by reaching a ${(tier + 1) * 7}-day streak (${nextTierIn} day${nextTierIn === 1 ? '' : 's'} to go)`
              : `Reach a 7-day streak to unlock your first freeze (${nextTierIn} day${nextTierIn === 1 ? '' : 's'} to go)`}
        </p>
      </div>
      {available && (
        <Button size="sm" variant="outline" onClick={consume}>
          Use Now
        </Button>
      )}
      <UltraBadge variant={available ? 'rare' : 'common'} size="sm">
        {available ? '1 Active' : used ? <><Check className="w-3 h-3 inline mr-1" />Used</> : 'Locked'}
      </UltraBadge>
    </UltraCard>
  );
};

export default StreakFreezeShield;
