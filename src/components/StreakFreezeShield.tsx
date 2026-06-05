import React, { useEffect, useState } from 'react';
import { Snowflake, Check, Zap } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  /** @deprecated kept for backwards compatibility */
  freezesAvailable?: number;
  currentStreak: number;
}

/**
 * Streak Freeze:
 *  - One-shot shield earned at every 7-day streak tier (7, 14, 21, ...).
 *    Consumed per tier (localStorage key `streakFreezeUsed_tier_N`).
 *  - Glitch Games Plus members get an EXTRA free freeze refill every ISO week,
 *    independent of the tier system. Tracked in localStorage by week.
 */

function isoWeekKey() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1); // Monday
  return `plusFreezeUsed_${d.toISOString().slice(0, 10)}`;
}

const StreakFreezeShield = ({ currentStreak }: Props) => {
  const { toast } = useToast();
  const tier = Math.floor(currentStreak / 7);
  const tierKey = `streakFreezeUsed_tier_${tier}`;
  const [used, setUsed] = useState<boolean>(() =>
    typeof window !== 'undefined' && tier > 0 ? localStorage.getItem(tierKey) === '1' : false,
  );

  const [plusActive, setPlusActive] = useState(false);
  const plusKey = isoWeekKey();
  const [plusUsed, setPlusUsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(plusKey) === '1' : false,
  );

  useEffect(() => {
    if (tier > 0) setUsed(localStorage.getItem(tierKey) === '1');
    else setUsed(false);
  }, [tier, tierKey]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancel) return;
      const { data } = await supabase
        .from('plus_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (!cancel) setPlusActive(!!data);
    })();
    return () => { cancel = true; };
  }, []);

  if (currentStreak < 3 && !plusActive) return null;

  const earned = tier > 0;
  const tierAvailable = earned && !used;
  const plusAvailable = plusActive && !plusUsed;
  const available = tierAvailable || plusAvailable;
  const nextTierIn = 7 - (currentStreak % 7);

  const consume = () => {
    // Prefer consuming the Plus weekly freeze first (renews every week)
    if (plusAvailable) {
      localStorage.setItem(plusKey, '1');
      setPlusUsed(true);
      toast({
        title: '🛡️ Plus weekly Streak Freeze used',
        description: `Your ${currentStreak}-day streak is protected for one missed day. Refills next Monday.`,
      });
      return;
    }
    localStorage.setItem(tierKey, '1');
    setUsed(true);
    toast({
      title: '🛡️ Streak Freeze used',
      description: `Your ${currentStreak}-day streak is protected for one missed day.`,
    });
  };

  let statusText = '';
  if (plusAvailable) {
    statusText = `Plus weekly freeze ready — protects your ${currentStreak}-day streak if you miss a day`;
  } else if (tierAvailable) {
    statusText = `Protects your ${currentStreak}-day streak if you miss a day`;
  } else if (plusActive && plusUsed && earned && used) {
    statusText = `All freezes used this week — Plus refills Monday, next tier at ${(tier + 1) * 7} days`;
  } else if (earned && used) {
    statusText = `Used — earn another by reaching a ${(tier + 1) * 7}-day streak (${nextTierIn} day${nextTierIn === 1 ? '' : 's'} to go)`;
  } else {
    statusText = `Reach a 7-day streak to unlock your first freeze (${nextTierIn} day${nextTierIn === 1 ? '' : 's'} to go)`;
  }

  return (
    <UltraCard variant="glass" className="p-4 flex items-center gap-3 flex-wrap">
      <div className="p-2 rounded-lg bg-info/20">
        <Snowflake className="w-5 h-5 text-info" />
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium flex items-center gap-2">
          Streak Freeze
          {plusActive && <Zap className="w-3.5 h-3.5 text-warning" aria-label="Plus" />}
        </p>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
      {available && (
        <Button size="sm" variant="outline" onClick={consume}>
          Use Now
        </Button>
      )}
      <UltraBadge variant={available ? 'rare' : 'common'} size="sm">
        {plusAvailable
          ? 'Plus Refill'
          : tierAvailable
            ? '1 Active'
            : (used || plusUsed) ? <><Check className="w-3 h-3 inline mr-1" />Used</> : 'Locked'}
      </UltraBadge>
    </UltraCard>
  );
};

export default StreakFreezeShield;
