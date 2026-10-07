import React, { useEffect, useState } from 'react';
import { Headphones, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface Agent { id: string; user_id: string; username: string | null; created_at: string }

const AdminSupportAgents: React.FC = () => {
  const { session } = useGame();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('support_agents').select('id, user_id, username, created_at').order('created_at');
    setAgents(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const username = name.trim();
    if (!username) return;
    setBusy(true);
    const { data: profile } = await supabase.from('profiles').select('user_id, username').ilike('username', username).maybeSingle();
    if (!profile) { toast({ title: 'User not found', description: `No player called "${username}".`, variant: 'destructive' }); setBusy(false); return; }
    const { error } = await supabase.from('support_agents').insert({ user_id: profile.user_id, username: profile.username, added_by: session?.user.id });
    setBusy(false);
    if (error) { toast({ title: 'Could not add agent', description: error.message.includes('duplicate') ? 'Already a support agent.' : error.message, variant: 'destructive' }); return; }
    toast({ title: 'Support agent added', description: `${profile.username} can now take calls.` });
    setName('');
    load();
  };

  const remove = async (a: Agent) => {
    const { error } = await supabase.from('support_agents').delete().eq('id', a.id);
    if (error) { toast({ title: 'Could not remove', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Support Agents</h3>
      </div>
      <p className="text-sm text-muted-foreground">Agents get a Support tab and can answer live voice calls from players.</p>
      <div className="flex gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Player username" />
        <Button onClick={add} disabled={busy || !name.trim()} className="gap-2"><UserPlus className="w-4 h-4" />Add</Button>
      </div>
      <div className="space-y-2">
        {agents.length === 0 && <p className="text-sm text-muted-foreground">No support agents yet.</p>}
        {agents.map(a => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
            <Headphones className="w-4 h-4 text-primary" />
            <span className="flex-1 font-medium truncate">{a.username ?? a.user_id}</span>
            <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
            <Button size="icon" variant="ghost" onClick={() => remove(a)} aria-label={`Remove ${a.username}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupportAgents;
