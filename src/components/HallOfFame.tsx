import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Medal, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_GAMES } from '@/lib/gamesCatalog';

interface Season {
  id: string;
  label: string;
  ends_at: string;
}

interface ArchiveRow {
  id: string;
  season_id: string | null;
  game_id: string;
  username: string;
  score: number;
  rank: number;
}

const HallOfFame: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [active, setActive] = useState<Season | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase.from('leaderboard_seasons').select('id, label, ends_at, active').order('ends_at', { ascending: false }),
        supabase.from('leaderboard_archive').select('id, season_id, game_id, username, score, rank').order('rank').limit(200),
      ]);
      const list = (s ?? []) as (Season & { active: boolean })[];
      setSeasons(list);
      setActive(list.find((x) => x.active) ?? null);
      setRows((a ?? []) as ArchiveRow[]);
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const resetIn = () => {
    // Weekly reset: next Monday 00:00 UTC, or the active season end if one exists.
    const target = active ? new Date(active.ends_at).getTime() : nextMonday();
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const gameName = (id: string) => ALL_GAMES.find((g) => g.id === id)?.title ?? id;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Weekly leaderboard reset
            </h3>
            <p className="text-muted-foreground text-sm">
              Scores roll over every week. The top players get archived into the Hall of Fame.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono tabular-nums text-primary">{resetIn()}</div>
            <div className="text-xs text-muted-foreground">{active?.label ?? 'Current week'}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">Hall of Fame</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No archived winners yet — the first champions appear after this week ends.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-4 py-3 hover-scale"
              >
                <div className="flex items-center gap-3">
                  <Medal className={`w-5 h-5 ${r.rank === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-semibold">{r.username}</div>
                    <div className="text-xs text-muted-foreground">{gameName(r.game_id)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">#{r.rank}</Badge>
                  <span className="font-mono font-bold">{r.score.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {seasons.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {seasons.map((s) => (
              <Badge key={s.id} variant="outline">{s.label}</Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

function nextMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  const add = (8 - day) % 7 || 7;
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + add));
  return t.getTime();
}

export default HallOfFame;
