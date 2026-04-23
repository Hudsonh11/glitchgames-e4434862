import React, { useEffect, useMemo, useState } from 'react';
import { Target, Coins, Gem, Sparkles, CheckCircle2, Loader2, Calendar, CalendarRange, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import UltraCard from '@/components/UltraCard';
import { playSfx } from '@/lib/sfx';

interface Quest {
  id: string;
  quest_key: string;
  title: string;
  description: string;
  quest_type: 'daily' | 'weekly' | 'seasonal';
  goal_type: string;
  goal_target: number;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
}

interface Progress {
  quest_key: string;
  progress: number;
  claimed: boolean;
  period_start: string;
}

// Compute period start (UTC date string YYYY-MM-DD) per quest type
const periodStartFor = (type: Quest['quest_type']): string => {
  const now = new Date();
  if (type === 'daily') return now.toISOString().slice(0, 10);
  if (type === 'weekly') {
    const day = now.getUTCDay() || 7; // 1..7 (Mon=1)
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - (day - 1));
    return monday.toISOString().slice(0, 10);
  }
  // seasonal — first day of current month for simplicity
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const QuestSystem: React.FC = () => {
  const { user, addCoins, addGems } = useGame();
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: q } = await supabase.from('quests').select('*').eq('active', true).order('quest_type');
      setQuests((q as Quest[]) || []);
      if (user?.id) {
        const { data: p } = await supabase
          .from('user_quest_progress')
          .select('quest_key, progress, claimed, period_start')
          .eq('user_id', user.id);
        const map: Record<string, Progress> = {};
        (p || []).forEach((row) => { map[row.quest_key] = row as Progress; });
        setProgress(map);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const grouped = useMemo(() => ({
    daily: quests.filter((q) => q.quest_type === 'daily'),
    weekly: quests.filter((q) => q.quest_type === 'weekly'),
    seasonal: quests.filter((q) => q.quest_type === 'seasonal'),
  }), [quests]);

  const claim = async (quest: Quest) => {
    if (!user?.id) return;
    const p = progress[quest.quest_key];
    if (!p || p.progress < quest.goal_target || p.claimed) return;
    setClaiming(quest.quest_key);
    try {
      const { error } = await supabase
        .from('user_quest_progress')
        .update({ claimed: true, completed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('quest_key', quest.quest_key)
        .eq('period_start', p.period_start);
      if (error) throw error;
      if (quest.reward_coins) await addCoins(quest.reward_coins);
      if (quest.reward_gems) await addGems(quest.reward_gems);
      setProgress((prev) => ({ ...prev, [quest.quest_key]: { ...p, claimed: true } }));
      playSfx('coin');
      toast({
        title: `✓ ${quest.title}`,
        description: `+${quest.reward_coins} coins${quest.reward_gems ? `, +${quest.reward_gems} gems` : ''}`,
      });
    } catch (e) {
      toast({ title: 'Claim failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setClaiming(null);
    }
  };

  const renderQuest = (q: Quest) => {
    const p = progress[q.quest_key] || { progress: 0, claimed: false, period_start: periodStartFor(q.quest_type), quest_key: q.quest_key };
    const pct = Math.min(100, Math.round((p.progress / q.goal_target) * 100));
    const ready = p.progress >= q.goal_target && !p.claimed;
    return (
      <div key={q.id} className="rounded-xl border border-border bg-card/40 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate">{q.title}</p>
            <p className="text-xs text-muted-foreground">{q.description}</p>
          </div>
          {p.claimed && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{p.progress} / {q.goal_target}</span>
          <div className="flex items-center gap-2 text-xs">
            {q.reward_coins > 0 && <span className="flex items-center gap-1 text-warning"><Coins className="w-3 h-3" />{q.reward_coins}</span>}
            {q.reward_gems > 0 && <span className="flex items-center gap-1 text-secondary"><Gem className="w-3 h-3" />{q.reward_gems}</span>}
            {q.reward_xp > 0 && <span className="flex items-center gap-1 text-primary"><Sparkles className="w-3 h-3" />{q.reward_xp}</span>}
          </div>
        </div>
        <Button
          size="sm"
          variant={ready ? 'gaming' : 'outline'}
          disabled={!ready || claiming === q.quest_key}
          className="w-full mt-3"
          onClick={() => claim(q)}
        >
          {claiming === q.quest_key ? <Loader2 className="w-4 h-4 animate-spin" /> :
            p.claimed ? 'Claimed' : ready ? 'Claim' : `${pct}%`}
        </Button>
      </div>
    );
  };

  if (loading) {
    return <UltraCard variant="glass" className="p-6 text-center text-sm text-muted-foreground">Loading quests…</UltraCard>;
  }

  return (
    <UltraCard variant="glass" className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">Quests</h3>
      </div>
      <Tabs defaultValue="daily">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="gap-1"><Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">Daily</span></TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1"><CalendarRange className="w-3.5 h-3.5" /><span className="hidden sm:inline">Weekly</span></TabsTrigger>
          <TabsTrigger value="seasonal" className="gap-1"><CalendarClock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Seasonal</span></TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="space-y-3">
          {grouped.daily.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No daily quests right now.</p> : grouped.daily.map(renderQuest)}
        </TabsContent>
        <TabsContent value="weekly" className="space-y-3">
          {grouped.weekly.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No weekly quests right now.</p> : grouped.weekly.map(renderQuest)}
        </TabsContent>
        <TabsContent value="seasonal" className="space-y-3">
          {grouped.seasonal.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No seasonal quests right now.</p> : grouped.seasonal.map(renderQuest)}
        </TabsContent>
      </Tabs>
    </UltraCard>
  );
};

export default QuestSystem;
