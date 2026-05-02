import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Lobby {
  id: string; host_id: string; game_id: string; name: string; status: string; max_players: number;
  party_members?: { user_id: string }[];
}

const GAMES = ['chess', 'connectfour', 'tictactoe', 'checkers', 'pong', 'snake', 'tetris', '2048'];

const PartyLobbies: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [name, setName] = useState('');
  const [game, setGame] = useState('chess');
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('party_lobbies').select('*, party_members(user_id)').eq('status', 'open').order('created_at', { ascending: false }).limit(30);
    setLobbies((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('lobbies').on('postgres_changes', { event: '*', schema: 'public', table: 'party_lobbies' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const create = async () => {
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from('party_lobbies').insert({ host_id: user.id, game_id: game, name: name.trim() }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('party_members').insert({ lobby_id: data.id, user_id: user.id });
    toast({ title: 'Lobby created!' });
    setOpen(false); setName(''); load();
  };

  const join = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('party_members').insert({ lobby_id: id, user_id: user.id });
    if (error) { toast({ title: 'Cannot join', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Joined lobby!' }); load();
  };

  const close = async (id: string) => {
    await supabase.from('party_lobbies').delete().eq('id', id);
    toast({ title: 'Lobby closed' }); load();
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Users />Party Lobbies</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Create Lobby</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Party Lobby</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Lobby name" value={name} onChange={e => setName(e.target.value)} />
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GAMES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={create} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lobbies.map(l => {
          const playerCount = l.party_members?.length || 0;
          const isHost = l.host_id === user?.id;
          const inLobby = l.party_members?.some(m => m.user_id === user?.id);
          return (
            <Card key={l.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">Game: {l.game_id} · {playerCount}/{l.max_players}</p>
                </div>
                <div className="flex gap-2">
                  {inLobby ? (
                    <Link to={`/game/${l.game_id}`}><Button size="sm">Play</Button></Link>
                  ) : (
                    <Button size="sm" onClick={() => join(l.id)} disabled={playerCount >= l.max_players}>Join</Button>
                  )}
                  {isHost && <Button size="sm" variant="ghost" onClick={() => close(l.id)}><X className="w-4 h-4" /></Button>}
                </div>
              </div>
            </Card>
          );
        })}
        {lobbies.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No open lobbies. Create one!</p>}
      </div>
    </Card>
  );
};

export default PartyLobbies;
