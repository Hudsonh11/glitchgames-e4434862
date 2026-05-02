import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Coins, Gem, Megaphone } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

const AdminBulkActions: React.FC = () => {
  const { toast } = useToast();
  const { user } = useGame();
  const [coinAmt, setCoinAmt] = useState(100);
  const [gemAmt, setGemAmt] = useState(10);
  const [running, setRunning] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const grantAllCoins = async () => {
    setRunning(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, coins');
    if (profiles) {
      await Promise.all(profiles.map(p =>
        supabase.from('profiles').update({ coins: p.coins + coinAmt }).eq('user_id', p.user_id)
      ));
      toast({ title: `Granted ${coinAmt} coins to ${profiles.length} users` });
    }
    setRunning(false);
  };

  const grantAllGems = async () => {
    setRunning(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, gems');
    if (profiles) {
      await Promise.all(profiles.map(p =>
        supabase.from('profiles').update({ gems: p.gems + gemAmt }).eq('user_id', p.user_id)
      ));
      toast({ title: `Granted ${gemAmt} gems to ${profiles.length} users` });
    }
    setRunning(false);
  };

  const broadcastAnnouncement = async () => {
    if (!user || !annTitle.trim()) return;
    await supabase.from('announcements').insert({
      title: annTitle, content: annContent, author_id: user.id, type: 'info', priority: 1, active: true,
    });
    toast({ title: 'Announcement broadcasted!' });
    setAnnTitle(''); setAnnContent('');
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-bold">Bulk Actions</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2"><Coins className="text-yellow-500" />Mass Coin Grant</h4>
          <Input type="number" value={coinAmt} onChange={e => setCoinAmt(Number(e.target.value))} />
          <Button onClick={grantAllCoins} disabled={running} className="w-full">Grant to All Users</Button>
        </div>
        <div className="p-4 border rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2"><Gem className="text-cyan-500" />Mass Gem Grant</h4>
          <Input type="number" value={gemAmt} onChange={e => setGemAmt(Number(e.target.value))} />
          <Button onClick={grantAllGems} disabled={running} className="w-full">Grant to All Users</Button>
        </div>
      </div>
      <div className="p-4 border rounded-lg space-y-3">
        <h4 className="font-semibold flex items-center gap-2"><Megaphone />Broadcast Announcement</h4>
        <Input placeholder="Title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
        <Input placeholder="Content" value={annContent} onChange={e => setAnnContent(e.target.value)} />
        <Button onClick={broadcastAnnouncement} className="w-full">Broadcast to All Players</Button>
      </div>
    </Card>
  );
};

export default AdminBulkActions;
