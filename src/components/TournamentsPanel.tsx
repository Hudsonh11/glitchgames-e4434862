import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Coins, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Tournament {
  id: string; name: string; game_id: string; status: string;
  max_participants: number; prize_coins: number; prize_gems: number;
  starts_at: string | null; ends_at: string | null;
  tournament_participants?: { user_id: string; score: number }[];
}

const TournamentsPanel: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const load = async () => {
    const { data } = await supabase.from('tournaments').select('*, tournament_participants(user_id, score)').order('created_at', { ascending: false }).limit(20);
    setTournaments((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const join = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('tournament_participants').insert({ tournament_id: id, user_id: user.id });
    if (error) { toast({ title: 'Already joined or full', variant: 'destructive' }); return; }
    toast({ title: 'Joined tournament!' }); load();
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Trophy className="text-primary" />Active Tournaments</h3>
      <div className="grid gap-4">
        {tournaments.map(t => {
          const joined = t.tournament_participants?.some(p => p.user_id === user?.id);
          const count = t.tournament_participants?.length || 0;
          return (
            <Card key={t.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-lg">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">Game: {t.game_id} · {count}/{t.max_participants} players</p>
                </div>
                <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status}</Badge>
              </div>
              <div className="flex gap-3 text-sm mb-3">
                <span className="flex items-center gap-1"><Coins className="w-4 h-4 text-yellow-500" />{t.prize_coins}</span>
                <span className="flex items-center gap-1"><Gem className="w-4 h-4 text-cyan-500" />{t.prize_gems}</span>
              </div>
              <div className="flex gap-2">
                {joined
                  ? <Link to={`/game/${t.game_id}`}><Button size="sm">Play Now</Button></Link>
                  : <Button size="sm" onClick={() => join(t.id)} disabled={count >= t.max_participants || t.status === 'ended'}>Join</Button>}
              </div>
              {t.tournament_participants && t.tournament_participants.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold mb-1">Top scores:</p>
                  {[...t.tournament_participants].sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => (
                    <p key={p.user_id} className="text-xs text-muted-foreground">#{i + 1} — {p.score} pts</p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {tournaments.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No tournaments yet. Check back soon!</p>}
      </div>
    </Card>
  );
};

export default TournamentsPanel;
