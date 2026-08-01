import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Swords, Link2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { ALL_GAMES } from '@/lib/gamesCatalog';
import { useNavigate } from 'react-router-dom';

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  game_id: string;
  status: string;
  challenger_score: number | null;
  challenged_score: number | null;
  wager_coins: number | null;
}

const DirectChallengePanel: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [opponent, setOpponent] = useState('');
  const [gameId, setGameId] = useState(ALL_GAMES[0]?.id ?? '');
  const [wager, setWager] = useState('0');

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    const list = (data ?? []) as Challenge[];
    setChallenges(list);
    const ids = [...new Set(list.flatMap((c) => [c.challenger_id, c.challenged_id]))];
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('user_id, username').in('user_id', ids);
      setNames(Object.fromEntries((p ?? []).map((x) => [x.user_id, x.username])));
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel('direct-challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const sendChallenge = async () => {
    if (!user) return;
    const { data: prof } = await supabase
      .from('profiles').select('user_id').ilike('username', opponent.trim()).maybeSingle();
    if (!prof) {
      toast({ title: 'Player not found', description: `No player called "${opponent}".`, variant: 'destructive' });
      return;
    }
    if (prof.user_id === user.id) {
      toast({ title: 'You cannot challenge yourself', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('challenges').insert({
      challenger_id: user.id,
      challenged_id: prof.user_id,
      game_id: gameId,
      status: 'pending',
      wager_coins: Math.max(0, parseInt(wager || '0', 10)),
    });
    if (error) {
      toast({ title: 'Could not send challenge', description: error.message, variant: 'destructive' });
      return;
    }
    setOpponent('');
    toast({ title: 'Challenge sent!', description: `${prof.user_id === user.id ? '' : opponent} has been challenged.` });
    load();
  };

  const respond = async (c: Challenge, accept: boolean) => {
    await supabase.from('challenges').update({ status: accept ? 'accepted' : 'declined' }).eq('id', c.id);
    if (accept) navigate(`/game/${c.game_id}?challenge=${c.id}`);
    load();
  };

  const copyLink = async (c: Challenge) => {
    await navigator.clipboard.writeText(`${window.location.origin}/game/${c.game_id}?challenge=${c.id}`);
    toast({ title: 'Challenge link copied', description: 'Share it with anyone to start the match.' });
  };

  const gameName = (id: string) => ALL_GAMES.find((g) => g.id === id)?.title ?? id;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Swords className="w-5 h-5 text-primary" />Challenge a player
        </h3>
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Username" value={opponent} onChange={(e) => setOpponent(e.target.value)} />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            aria-label="Choose game"
          >
            {ALL_GAMES.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
          <Input type="number" min={0} placeholder="Wager coins" value={wager} onChange={(e) => setWager(e.target.value)} />
          <Button onClick={sendChallenge} disabled={!opponent.trim()}>Send challenge</Button>
        </div>
      </Card>

      <div className="space-y-2">
        {challenges.length === 0 && (
          <Card className="p-5 text-sm text-muted-foreground">No challenges yet — send one above.</Card>
        )}
        {challenges.map((c) => {
          const incoming = c.challenged_id === user?.id;
          const other = incoming ? c.challenger_id : c.challenged_id;
          return (
            <Card key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover-scale">
              <div>
                <div className="font-semibold">
                  {incoming ? `${names[other] ?? 'Player'} challenged you` : `You challenged ${names[other] ?? 'Player'}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {gameName(c.game_id)}{c.wager_coins ? ` · ${c.wager_coins} coin wager` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === 'pending' ? 'secondary' : 'default'}>{c.status}</Badge>
                <Button size="sm" variant="ghost" aria-label="Copy challenge link" onClick={() => copyLink(c)}>
                  <Link2 className="w-4 h-4" />
                </Button>
                {incoming && c.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => respond(c, true)}><Check className="w-4 h-4" />Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => respond(c, false)}><X className="w-4 h-4" /></Button>
                  </>
                )}
                {!incoming && c.status === 'accepted' && (
                  <Button size="sm" onClick={() => navigate(`/game/${c.game_id}?challenge=${c.id}`)}>Play</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DirectChallengePanel;
