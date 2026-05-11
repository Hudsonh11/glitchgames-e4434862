import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, LogOut, Send, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Clan {
  id: string; name: string; tag: string; description: string | null;
  owner_id: string; member_count: number; total_xp: number;
}
interface ChatMsg { id: string; user_id: string; content: string; created_at: string; }

const ClansHub: React.FC = () => {
  const { user } = useGame();
  const { toast } = useToast();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadClans = async () => {
    const { data } = await supabase.from('clans').select('*').order('total_xp', { ascending: false }).limit(50);
    setClans(data || []);
  };

  const loadMyClan = async () => {
    if (!user) return;
    const { data: mem } = await supabase.from('clan_members').select('clan_id').eq('user_id', user.id).maybeSingle();
    if (mem?.clan_id) {
      const { data: c } = await supabase.from('clans').select('*').eq('id', mem.clan_id).maybeSingle();
      setMyClan(c);
      if (c) loadChat(c.id);
    } else {
      setMyClan(null);
      setChat([]);
    }
  };

  const loadChat = async (clanId: string) => {
    const { data } = await supabase.from('clan_chat').select('*').eq('clan_id', clanId).order('created_at', { ascending: true }).limit(100);
    setChat(data || []);
    if (data && data.length) {
      const ids = [...new Set(data.map(m => m.user_id))];
      const { data: profs } = await supabase.from('profiles').select('user_id, username').in('user_id', ids);
      const map: Record<string, string> = {};
      profs?.forEach(p => { map[p.user_id] = p.username; });
      setUsernames(prev => ({ ...prev, ...map }));
    }
  };

  useEffect(() => { loadClans(); loadMyClan(); }, [user?.id]);

  // Realtime chat subscription
  useEffect(() => {
    if (!myClan) return;
    const channel = supabase.channel(`clan-${myClan.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clan_chat', filter: `clan_id=eq.${myClan.id}` }, async (payload) => {
        const msg = payload.new as ChatMsg;
        setChat(prev => [...prev, msg]);
        if (!usernames[msg.user_id]) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', msg.user_id).maybeSingle();
          if (data) setUsernames(prev => ({ ...prev, [msg.user_id]: data.username }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myClan?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const createClan = async () => {
    if (!user || !name.trim() || !tag.trim()) return;
    const { data, error } = await supabase.from('clans').insert({
      name: name.trim(), tag: tag.trim().toUpperCase().slice(0, 5), description: desc.trim(), owner_id: user.id,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('clan_members').insert({ clan_id: data.id, user_id: user.id, role: 'owner' });
    toast({ title: 'Clan created!', description: `${data.name} [${data.tag}]` });
    setCreateOpen(false); setName(''); setTag(''); setDesc('');
    loadClans(); loadMyClan();
  };

  const joinClan = async (clanId: string) => {
    if (!user) return;
    const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: user.id });
    if (error) { toast({ title: 'Cannot join', description: error.message, variant: 'destructive' }); return; }
    await supabase.from('clans').update({ member_count: (clans.find(c => c.id === clanId)?.member_count || 1) + 1 }).eq('id', clanId);
    toast({ title: 'Joined clan!' }); loadClans(); loadMyClan();
  };

  const leaveClan = async () => {
    if (!user || !myClan) return;
    await supabase.from('clan_members').delete().eq('user_id', user.id);
    toast({ title: 'Left clan' });
    loadClans(); loadMyClan();
  };

  const deleteClan = async () => {
    if (!user || !myClan || myClan.owner_id !== user.id) return;
    await supabase.from('clan_chat').delete().eq('clan_id', myClan.id);
    await supabase.from('clan_members').delete().eq('clan_id', myClan.id);
    const { error } = await supabase.from('clans').delete().eq('id', myClan.id);
    if (error) { toast({ title: 'Could not delete', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Clan disbanded' });
    loadClans(); loadMyClan();
  };

  const sendChat = async () => {
    if (!user || !myClan || !chatInput.trim()) return;
    await supabase.from('clan_chat').insert({ clan_id: myClan.id, user_id: user.id, content: chatInput.trim() });
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {myClan ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-primary" />[{myClan.tag}] {myClan.name}</h2>
              <p className="text-sm text-muted-foreground">{myClan.description}</p>
              <p className="text-xs mt-1">Members: {myClan.member_count} · Clan XP: {myClan.total_xp}</p>
            </div>
            <div className="flex gap-2">
              {myClan.owner_id === user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Trash2 className="w-4 h-4 mr-1" />Disband</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disband [{myClan.tag}] {myClan.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the clan, kicks all members, and erases clan chat. Cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteClan} className="bg-destructive text-destructive-foreground">Disband</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" onClick={leaveClan}><LogOut className="w-4 h-4 mr-1" />Leave</Button>
            </div>
          </div>
          <div className="border rounded-lg bg-muted/20 p-3 h-64 overflow-y-auto space-y-2">
            {chat.length === 0 && <p className="text-center text-muted-foreground text-sm pt-12">No messages yet — say hi!</p>}
            {chat.map(m => (
              <div key={m.id} className={`text-sm ${m.user_id === user?.id ? 'text-right' : ''}`}>
                <span className="font-semibold text-primary">{usernames[m.user_id] || '...'}: </span>
                <span>{m.content}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 mt-3">
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message your clan..." onKeyDown={e => e.key === 'Enter' && sendChat()} />
            <Button onClick={sendChat}><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Browse Clans</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Create Clan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create a Clan</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Clan name" value={name} onChange={e => setName(e.target.value)} />
                  <Input placeholder="Tag (e.g. WOLF)" value={tag} onChange={e => setTag(e.target.value)} maxLength={5} />
                  <Textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                  <Button onClick={createClan} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {clans.map(c => (
              <Card key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">[{c.tag}] {c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.member_count} members · {c.total_xp} XP</p>
                </div>
                <Button size="sm" onClick={() => joinClan(c.id)}>Join</Button>
              </Card>
            ))}
            {clans.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No clans yet. Be the first!</p>}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClansHub;
