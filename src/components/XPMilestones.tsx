import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Lock, Check, Coins, Gem } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
  level: number;
  title: string;
  reward_coins: number;
  reward_gems: number;
  reward_border: string | null;
  reward_title: string | null;
}

const XPMilestones: React.FC = () => {
  const { user, addCoins, addGems } = useGame();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('xp_milestones')
        .select('level, title, reward_coins, reward_gems, reward_border, reward_title')
        .order('level');
      setMilestones(data ?? []);
      if (user?.id) {
        const { data: c } = await supabase
          .from('user_milestone_claims')
          .select('level')
          .eq('user_id', user.id);
        setClaimed((c ?? []).map((r) => r.level));
      }
    })();
  }, [user?.id]);

  const claim = async (m: Milestone) => {
    if (!user) return;
    setBusy(m.level);
    const { error } = await supabase
      .from('user_milestone_claims')
      .insert({ user_id: user.id, level: m.level });
    if (error) {
      toast({ title: 'Already claimed', variant: 'destructive' });
      setBusy(null);
      return;
    }
    if (m.reward_coins) await addCoins(m.reward_coins);
    if (m.reward_gems) await addGems(m.reward_gems);
    if (m.reward_border) {
      await supabase.from('player_borders').insert({ user_id: user.id, border_id: m.reward_border });
    }
    if (m.reward_title) {
      await supabase.from('player_titles').insert({ user_id: user.id, title_id: m.reward_title });
    }
    setClaimed((prev) => [...prev, m.level]);
    setBusy(null);
    toast({ title: `Milestone unlocked: ${m.title}`, description: 'Rewards added to your account.' });
  };

  const level = user?.level ?? 0;

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Level Milestones</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {milestones.map((m) => {
          const reached = level >= m.level;
          const done = claimed.includes(m.level);
          return (
            <div
              key={m.level}
              className={`rounded-xl border p-4 transition-all hover-scale ${
                reached ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{m.title}</span>
                <Badge variant={reached ? 'default' : 'secondary'}>Lv {m.level}</Badge>
              </div>
              <Progress value={Math.min(100, (level / m.level) * 100)} className="h-2 mb-3" />
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                {!!m.reward_coins && (
                  <span className="flex items-center gap-1"><Coins className="w-4 h-4" />{m.reward_coins.toLocaleString()}</span>
                )}
                {!!m.reward_gems && (
                  <span className="flex items-center gap-1"><Gem className="w-4 h-4" />{m.reward_gems}</span>
                )}
                {m.reward_title && <span>Title: {m.reward_title}</span>}
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={!reached || done || busy === m.level}
                onClick={() => claim(m)}
              >
                {done ? (<><Check className="w-4 h-4" />Claimed</>) : reached ? 'Claim rewards' : (<><Lock className="w-4 h-4" />Locked</>)}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default XPMilestones;
