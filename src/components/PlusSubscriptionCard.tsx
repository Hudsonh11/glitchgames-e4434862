import React, { useState } from 'react';
import { Zap, Coins, Gem, Crown, Sparkles, Gift, Shield, Star, LifeBuoy, Loader2, Check } from 'lucide-react';
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
  { icon: Coins, color: 'text-warning', text: '2,000 coins on activation' },
  { icon: Gem, color: 'text-secondary', text: '100 gems on activation' },
  { icon: Crown, color: 'text-warning', text: 'Premium Battle Pass unlocked' },
  { icon: Sparkles, color: 'text-primary', text: 'Access to Plus-exclusive games' },
  { icon: Zap, color: 'text-success', text: '2× XP boost on every game' },
  { icon: Gift, color: 'text-secondary', text: 'Weekly mystery loot crate' },
  { icon: Star, color: 'text-warning', text: 'Exclusive "Plus" title + animated border' },
  { icon: Shield, color: 'text-primary', text: 'Free Streak Freeze refill weekly' },
  { icon: LifeBuoy, color: 'text-success', text: 'Priority support flag' },
];

const PlusSubscriptionCard: React.FC<Props> = ({ status }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const renewalSoon = status.isActive && status.daysRemaining <= 3;

  return (
    <UltraCard
      variant="premium"
      glow
      className="p-6 relative overflow-hidden border-2 border-primary/40"
    >
      {/* Animated gradient backdrop */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[conic-gradient(from_var(--ang,0deg),hsl(var(--primary)),hsl(var(--secondary)),hsl(var(--warning)),hsl(var(--primary)))] animate-spin-slow" />

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
              $4.99 / month · One-time purchase · No auto-renew
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
            Re-purchase now to keep your benefits — it won't renew automatically.
          </p>
        </div>
      )}

      {!status.isActive && status.expiresAt === null && (
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

      <Button
        variant="gaming"
        size="lg"
        className="w-full"
        onClick={startCheckout}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</>
        ) : status.isActive ? (
          <><Zap className="w-4 h-4 mr-2" /> Extend Plus — $4.99</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Get Glitch Games Plus — $4.99</>
        )}
      </Button>

      {status.source === 'admin_gift' && status.isActive && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          🎁 Your current Plus was gifted by an admin
        </p>
      )}
    </UltraCard>
  );
};

export default PlusSubscriptionCard;
