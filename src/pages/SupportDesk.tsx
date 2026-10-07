import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Headphones, Phone, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { endCallRecord, useIsSupportAgent, useVoiceCall } from '@/lib/supportCall';
import CallScreen from '@/components/support/CallScreen';
import { useToast } from '@/hooks/use-toast';

interface Waiting { id: string; username: string | null; created_at: string }

const SupportDesk: React.FC = () => {
  const { session, user, isLoading } = useGame();
  const userId = session?.user.id;
  const isAgent = useIsSupportAgent(userId);
  const [checked, setChecked] = useState(false);
  const [queue, setQueue] = useState<Waiting[]>([]);
  const [activeCall, setActiveCall] = useState<Waiting | null>(null);
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => { const t = setTimeout(() => setChecked(true), 1200); return () => clearTimeout(t); }, []);

  const endLocal = useCallback(() => setActiveCall(null), []);
  const call = useVoiceCall(activeCall?.id ?? null, 'agent', !!activeCall, endLocal);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('support_calls').select('id, username, created_at')
      .eq('status', 'waiting').order('created_at', { ascending: true });
    setQueue(data ?? []);
  }, []);

  useEffect(() => {
    if (!isAgent) return;
    refresh();
    const ch = supabase.channel('support-desk-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_calls' }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAgent, refresh]);

  const answer = useCallback(async (c: Waiting) => {
    if (!userId) return;
    const { data, error } = await supabase.from('support_calls')
      .update({ agent_id: userId, agent_name: user?.username ?? 'Support', status: 'active', answered_at: new Date().toISOString() })
      .eq('id', c.id).eq('status', 'waiting').select('id');
    if (error || !data?.length) {
      toast({ title: 'Call no longer available', description: 'Another agent answered or the player hung up.' });
      refresh();
      return;
    }
    setActiveCall(c);
  }, [userId, user?.username, toast, refresh]);

  // Answer straight away when arriving from the incoming-call card.
  useEffect(() => {
    const id = params.get('answer');
    if (!id || !isAgent || activeCall) return;
    const c = queue.find(q => q.id === id);
    if (c) { setParams({}, { replace: true }); answer(c); }
  }, [params, queue, isAgent, activeCall, answer, setParams]);

  const hangUp = async () => {
    if (!activeCall) return;
    call.signalEnd();
    await endCallRecord(activeCall.id);
    setActiveCall(null);
  };
  const hold = async () => {
    if (!activeCall) return;
    call.hold();
    await supabase.from('support_calls').update({ status: 'on_hold' }).eq('id', activeCall.id);
  };
  const resume = async () => {
    if (!activeCall) return;
    call.resume();
    await supabase.from('support_calls').update({ status: 'active' }).eq('id', activeCall.id);
  };

  const notAgent = !isLoading && checked && !isAgent;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Support Desk | Glitch Games" description="Answer live voice support calls from Glitch Games players." path="/support" />
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"><Headphones className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold">Support Desk</h1>
            <p className="text-sm text-muted-foreground">You're online — players can call you.</p>
          </div>
        </div>

        {notAgent ? (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-destructive" />
            <p className="font-semibold">Support agents only</p>
            <Link to="/"><Button variant="outline">Back home</Button></Link>
          </div>
        ) : activeCall ? (
          <div className="glass-panel rounded-2xl border-2 border-primary/30">
            <CallScreen
              myLabel="You"
              otherLabel="User"
              otherName={activeCall.username}
              phase={call.phase}
              waitingText="Connecting to player…"
              error={call.error}
              muted={call.muted}
              onToggleMute={call.toggleMute}
              localLevel={call.localLevel}
              remoteLevel={call.remoteLevel}
              onEnd={hangUp}
              showHold
              onHold={hold}
              onResume={resume}
            />
          </div>
        ) : queue.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"><Headphones className="w-8 h-8 text-primary" /></div>
            </div>
            <p className="font-display font-bold text-lg">Waiting for user</p>
            <p className="text-sm text-muted-foreground">Calls will appear here as soon as a player presses Support.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map(c => (
              <div key={c.id} className="glass-panel rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Phone className="w-5 h-5 text-primary animate-pulse" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.username ?? 'Player'}</p>
                  <p className="text-xs text-muted-foreground">Waiting since {new Date(c.created_at).toLocaleTimeString()}</p>
                </div>
                <Button onClick={() => answer(c)} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                  <Phone className="w-4 h-4" />Answer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportDesk;
