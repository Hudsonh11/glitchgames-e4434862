import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Radio, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_GAMES } from '@/lib/gamesCatalog';
import EmoteBar from '@/components/EmoteBar';

interface Session {
  id: string;
  host_id: string;
  game_id: string;
  status: string;
  spectator_count: number;
  state: Record<string, unknown>;
  started_at: string;
}

const SpectatePanel: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [watching, setWatching] = useState<Session | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('match_sessions')
      .select('*')
      .eq('status', 'live')
      .eq('allow_spectators', true)
      .order('started_at', { ascending: false })
      .limit(24);
    const list = (data ?? []) as unknown as Session[];
    setSessions(list);
    const ids = [...new Set(list.map((s) => s.host_id))];
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('user_id, username').in('user_id', ids);
      setNames(Object.fromEntries((p ?? []).map((x) => [x.user_id, x.username])));
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel('spectate-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sessions' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const gameName = (id: string) => ALL_GAMES.find((g) => g.id === id)?.title ?? id;

  const watch = async (s: Session) => {
    setWatching(s);
    await supabase.from('match_sessions').update({ spectator_count: s.spectator_count + 1 }).eq('id', s.id);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
          <Radio className="w-5 h-5 text-accent animate-pulse" />Live Matches
        </h3>
        <p className="text-sm text-muted-foreground">
          Watch friends play Tanks, Crash It, Find Match and more — and react with emotes while you watch.
        </p>
      </Card>

      {watching && (
        <Card className="p-5 border-primary/40">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Watching {names[watching.host_id] ?? 'player'} · {gameName(watching.game_id)}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setWatching(null)}>Stop watching</Button>
          </div>
          <div className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground mb-3">
            Live state streaming — score {String((watching.state as { score?: number })?.score ?? 0)}
          </div>
          <EmoteBar sessionId={watching.id} />
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Nobody is live right now. Start a match to broadcast yours.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Card key={s.id} className="p-4 hover-scale">
              <div className="flex items-center justify-between mb-2">
                <Badge className="gap-1"><Radio className="w-3 h-3" />LIVE</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />{s.spectator_count}
                </span>
              </div>
              <div className="font-semibold">{names[s.host_id] ?? 'Player'}</div>
              <div className="text-sm text-muted-foreground mb-3">{gameName(s.game_id)}</div>
              <Button size="sm" className="w-full" onClick={() => watch(s)}>
                <Eye className="w-4 h-4" />Spectate
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpectatePanel;
