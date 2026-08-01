import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Swords, Shield, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface War {
  id: string;
  week_start: string;
  clan_a: string;
  clan_b: string;
  score_a: number;
  score_b: number;
  status: string;
  prize_coins: number;
}

const ClanWars: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [wars, setWars] = useState<War[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [myClan, setMyClan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: w }, { data: c }] = await Promise.all([
      supabase.from('clan_wars').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('clans').select('id, name, tag'),
    ]);
    setWars((w ?? []) as War[]);
    setNames(Object.fromEntries((c ?? []).map((x) => [x.id, `[${x.tag}] ${x.name}`])));
    if (user?.id) {
      const { data: m } = await supabase.from('clan_members').select('clan_id').eq('user_id', user.id).maybeSingle();
      setMyClan(m?.clan_id ?? null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    const ch = supabase
      .channel('clan-wars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_wars' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const contribute = async (war: War) => {
    if (!user || !myClan) return;
    const points = 100;
    const isA = war.clan_a === myClan;
    await supabase.from('clan_war_contributions').insert({
      war_id: war.id, clan_id: myClan, user_id: user.id, points,
    });
    await supabase
      .from('clan_wars')
      .update(isA ? { score_a: war.score_a + points } : { score_b: war.score_b + points })
      .eq('id', war.id);
    toast({ title: 'Contribution logged', description: `+${points} war points for your clan.` });
    load();
  };

  if (loading) return <Card className="p-6 text-muted-foreground">Loading clan wars…</Card>;

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-destructive/10 to-primary/10 border-primary/30">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
          <Swords className="w-5 h-5 text-primary" />Clan Wars
        </h3>
        <p className="text-sm text-muted-foreground">
          Every week clans are paired up. Your scores add to your clan's total — the winning clan splits the prize pool.
        </p>
      </Card>

      {wars.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground">
          No wars running right now. New pairings go live at the start of each week.
        </Card>
      )}

      {wars.map((w) => {
        const total = Math.max(1, w.score_a + w.score_b);
        const inWar = myClan === w.clan_a || myClan === w.clan_b;
        return (
          <Card key={w.id} className="p-5 hover-scale">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />{names[w.clan_a] ?? 'Clan A'}
              </span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Coins className="w-3 h-3" />{w.prize_coins.toLocaleString()}
              </Badge>
              <span className="font-semibold flex items-center gap-2">
                {names[w.clan_b] ?? 'Clan B'}<Shield className="w-4 h-4 text-accent" />
              </span>
            </div>
            <Progress value={(w.score_a / total) * 100} className="h-3 mb-2" />
            <div className="flex justify-between text-sm font-mono mb-3">
              <span>{w.score_a.toLocaleString()}</span>
              <span className="text-muted-foreground">Week of {w.week_start}</span>
              <span>{w.score_b.toLocaleString()}</span>
            </div>
            {inWar && (
              <Button size="sm" className="w-full" onClick={() => contribute(w)}>
                Contribute today's points
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ClanWars;
