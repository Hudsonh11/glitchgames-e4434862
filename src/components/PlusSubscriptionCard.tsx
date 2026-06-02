import React, { useState, useEffect } from 'react';
import { Zap, Coins, Gem, Crown, Sparkles, Gift, Shield, Star, LifeBuoy, Loader2, Check, Palette, Award, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UltraCard from './UltraCard';
import UltraBadge from './UltraBadge';
import { PlusStatus } from '@/hooks/usePlusStatus';

interface Props {
  status: PlusStatus;
}

const PERKS = [
  { icon: Coins,     color: 'text-warning',   text: '2,000 coins on activation' },
  { icon: Gem,       color: 'text-secondary', text: '100 gems on activation' },
  { icon: Crown,     color: 'text-warning',   text: 'Premium Battle Pass unlocked' },
  { icon: Sparkles,  color: 'text-primary',   text: 'Access to Plus-exclusive games' },
  { icon: Zap,       color: 'text-success',   text: '2× XP boost on every game' },
  { icon: Gift,      color: 'text-secondary', text: 'Weekly loot crate (1,000 coins + 25 gems)' },
  { icon: Star,      color: 'text-warning',   text: 'Exclusive "Plus" title + animated border' },
  { icon: Shield,    color: 'text-primary',   text: 'Free Streak Freeze refill weekly' },
  { icon: LifeBuoy,  color: 'text-success',   text: 'Priority support flag' },
  // 3 new benefits
  { icon: Palette,   color: 'text-primary',   text: 'Exclusive Plus avatar frame' },
  { icon: Award,     color: 'text-warning',   text: '25% bonus coins on every game win' },
  { icon: Rocket,    color: 'text-secondary', text: 'Skip the daily-reward cooldown once a week' },
];

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

const PlusSubscriptionCard: React.FC<Props> = ({ status }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [claimingLoot, setClaimingLoot] = useState(false);
  const [lootClaimed, setLootClaimed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId || !status.isActive) return;
    const weekStart = startOfWeekISO();
    supabase
      .from('plus_loot_claims' as never)
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle()
      .then(({ data }) => setLootClaimed(!!data));
  }, [userId, status.isActive]);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-plus-checkout', {
        body: { returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      toast({
        title: 'Checkout failed',
        description: (e as Error).message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const claimLoot = async () => {
    if (!userId) return;
    setClaimingLoot(true);
    try {
      const weekStart = startOfWeekISO();
      const { error } = await supabase.from('plus_loot_claims' as never).insert({
        user_id: userId,
        week_start: weekStart,
        coins_awarded: 1000,
        gems_awarded: 25,
      } as never);
      if (error) throw error;
      // award currency
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, gems')
        .eq('user_id', userId)
        .single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ coins: (profile.coins ?? 0) + 1000, gems: (profile.gems ?? 0) + 25 })
          .eq('user_id', userId);
      }
      setLootClaimed(true);
      toast({ title: '🎁 Weekly loot claimed!', description: '+1,000 coins and +25 gems added to your account.' });
    } catch (e) {
      toast({ title: 'Claim failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setClaimingLoot(false);
    }
  };

  const renewalSoon = status.isActive && status.daysRemaining <= 3;

  return (
    <UltraCard
      variant="premium"
      glow
      className="p-6 relative overflow-hidden border-2 border-primary/40"
    >
      <div className="absolute inset-0 -z-10 opacity-20 bg-[conic-gradient(from_0deg,hsl(var(--primary)),hsl(var(--secondary)),hsl(var(--warning)),hsl(var(--primary)))]" />

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-warning flex items-center justify-center shrink-0 shadow-neon-cyan">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-gradient truncate">
                Glitch Games Plus
              </h3>
              {status.isActive && (
                <UltraBadge variant="legendary" size="sm">ACTIVE</UltraBadge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              £7.99 / month · One-time purchase · No auto-renew
            </p>
          </div>
        </div>
        {status.isActive && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Time left</p>
            <p className="font-display text-lg font-bold">
              {status.daysRemaining} day{status.daysRemaining === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      {renewalSoon && (
        <div className="mb-4 p-3 rounded-xl bg-warning/20 border border-warning/40 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm">
            <strong>Plus expires in {status.daysRemaining} day{status.daysRemaining === 1 ? '' : 's'}!</strong>{' '}
            Re-purchase to keep your benefits — it won't renew automatically.
          </p>
        </div>
      )}

      {!status.isActive && (
        <p className="text-sm text-muted-foreground mb-4">
          One-time monthly purchase. When the month ends you'll get a reminder — re-purchase
          to keep your perks, otherwise all benefits stop until you buy again.
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {PERKS.map((perk, i) => {
          const Icon = perk.icon;
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              {status.isActive ? (
                <Check className="w-4 h-4 text-success shrink-0" />
              ) : (
                <Icon className={`w-4 h-4 ${perk.color} shrink-0`} />
              )}
              <span className={status.isActive ? 'text-foreground' : 'text-muted-foreground'}>
                {perk.text}
              </span>
            </li>
          );
        })}
      </ul>

      {status.isActive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-3"
          onClick={claimLoot}
          disabled={claimingLoot || lootClaimed}
        >
          {claimingLoot ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming…</>
          ) : lootClaimed ? (
            <><Check className="w-4 h-4 mr-2" /> Weekly loot claimed</>
          ) : (
            <><Gift className="w-4 h-4 mr-2" /> Claim Weekly Loot Crate</>
          )}
        </Button>
      )}

      {!status.isActive && (
        <Button
          variant="gaming"
          size="lg"
          className="w-full"
          onClick={startCheckout}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Get Glitch Games Plus — £7.99</>
          )}
        </Button>
      )}
    </UltraCard>
  );
};

export default PlusSubscriptionCard;
