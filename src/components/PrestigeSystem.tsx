import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import UltraCard from '@/components/UltraCard';
import { playSfx } from '@/lib/sfx';

interface PrestigeRow {
  prestige_level: number;
  xp_multiplier: number;
  coin_multiplier: number;
  total_resets: number;
  last_prestige_at: string | null;
}

const PRESTIGE_MIN_LEVEL = 50;
const XP_BONUS_PER_PRESTIGE = 0.1; // +10% XP per prestige
const COIN_BONUS_PER_PRESTIGE = 0.05; // +5% coins per prestige

const PrestigeSystem: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [data, setData] = useState<PrestigeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const userLevel = user?.level || 1;
  const canPrestige = userLevel >= PRESTIGE_MIN_LEVEL;

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      const { data: row } = await supabase
        .from('user_prestige')
        .select('prestige_level, xp_multiplier, coin_multiplier, total_resets, last_prestige_at')
        .eq('user_id', user.id)
        .maybeSingle();
      setData(row);
      setLoading(false);
    })();
  }, [user?.id]);

  const doPrestige = async () => {
    if (!user?.id || !canPrestige) return;
    setWorking(true);
    try {
      const nextLevel = (data?.prestige_level || 0) + 1;
      const nextXpMult = 1 + nextLevel * XP_BONUS_PER_PRESTIGE;
      const nextCoinMult = 1 + nextLevel * COIN_BONUS_PER_PRESTIGE;

      // Upsert prestige row
      const { error: upErr } = await supabase.from('user_prestige').upsert({
        user_id: user.id,
        prestige_level: nextLevel,
        xp_multiplier: nextXpMult,
        coin_multiplier: nextCoinMult,
        total_resets: (data?.total_resets || 0) + 1,
        last_prestige_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (upErr) throw upErr;

      // Reset profile level + xp
      const { error: profErr } = await supabase.from('profiles')
        .update({ level: 1, xp: 0 })
        .eq('user_id', user.id);
      if (profErr) throw profErr;

      // Activity feed
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'prestige',
        content: `reached Prestige ${nextLevel}!`,
      });

      setData({
        prestige_level: nextLevel,
        xp_multiplier: nextXpMult,
        coin_multiplier: nextCoinMult,
        total_resets: (data?.total_resets || 0) + 1,
        last_prestige_at: new Date().toISOString(),
      });
      playSfx('levelup');
      toast({
        title: `🌟 Prestige ${nextLevel}!`,
        description: `Permanent +${Math.round(nextLevel * XP_BONUS_PER_PRESTIGE * 100)}% XP and +${Math.round(nextLevel * COIN_BONUS_PER_PRESTIGE * 100)}% coins.`,
      });
    } catch (e) {
      toast({ title: 'Prestige failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return null;

  const lvl = data?.prestige_level || 0;
  const xpMult = data?.xp_multiplier || 1;
  const coinMult = data?.coin_multiplier || 1;

  return (
    <UltraCard variant="glass" className="p-5 sm:p-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning to-primary flex items-center justify-center shrink-0">
          <Crown className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-bold">Prestige {lvl > 0 && <span className="text-warning">★ {lvl}</span>}</h3>
            {lvl > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/40">
                {data?.total_resets} reset{data?.total_resets === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Reach level {PRESTIGE_MIN_LEVEL} to reset back to 1 in exchange for permanent multipliers.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="w-3.5 h-3.5" /> XP Multiplier</div>
              <p className="font-display text-2xl font-bold text-primary">{xpMult.toFixed(2)}×</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="w-3.5 h-3.5" /> Coin Multiplier</div>
              <p className="font-display text-2xl font-bold text-warning">{coinMult.toFixed(2)}×</p>
            </div>
          </div>

          <div className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="gaming" disabled={!canPrestige || working} className="w-full sm:w-auto">
                  <Crown className="w-4 h-4 mr-2" />
                  {canPrestige ? `Prestige (Lv ${userLevel})` : `Reach Lv ${PRESTIGE_MIN_LEVEL} to Prestige`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" /> Prestige to ★{lvl + 1}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Your level resets to 1 and your XP to 0. In return you keep all coins, gems,
                    and cosmetics, and gain a permanent <strong>+{Math.round((lvl + 1) * XP_BONUS_PER_PRESTIGE * 100)}% XP</strong> and{' '}
                    <strong>+{Math.round((lvl + 1) * COIN_BONUS_PER_PRESTIGE * 100)}% coin</strong> bonus.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={doPrestige}>Confirm Prestige</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </UltraCard>
  );
};

export default PrestigeSystem;
