import React, { useEffect, useRef, useState } from 'react';
import { Headphones, PhoneOff, RefreshCw, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { AGENT_PRESENCE_CHANNEL, endCallRecord, useVoiceCall } from '@/lib/supportCall';
import CallScreen from './CallScreen';

type Stage = 'checking' | 'no_agents' | 'calling' | 'ended';

/** Counts agents currently online via realtime presence. */
const countOnlineAgents = () => new Promise<number>((resolve) => {
  const ch = supabase.channel(AGENT_PRESENCE_CHANNEL);
  let done = false;
  const finish = (n: number) => { if (done) return; done = true; supabase.removeChannel(ch); resolve(n); };
  ch.on('presence', { event: 'sync' }, () => finish(Object.keys(ch.presenceState()).length));
  ch.subscribe();
  window.setTimeout(() => finish(Object.keys(ch.presenceState()).length), 3000);
});

const UserSupportCall: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { session, user } = useGame();
  const userId = session?.user.id;
  const [stage, setStage] = useState<Stage>('checking');
  const [callId, setCallId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const callIdRef = useRef<string | null>(null);

  const finish = () => { setStage('ended'); setAnswered(false); };
  const call = useVoiceCall(callId, 'user', answered, finish);

  const start = async () => {
    if (!userId) return;
    setStage('checking');
    const n = await countOnlineAgents();
    if (n === 0) { setStage('no_agents'); return; }
    const { data, error } = await supabase.from('support_calls')
      .insert({ user_id: userId, username: user?.username ?? null })
      .select('id').single();
    if (error || !data) { setStage('no_agents'); return; }
    callIdRef.current = data.id;
    setCallId(data.id);
    setStage('calling');
  };

  useEffect(() => { start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  // Watch for an agent answering or ending.
  useEffect(() => {
    if (!callId) return;
    const ch = supabase.channel(`support-call-row-${callId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_calls', filter: `id=eq.${callId}` }, ({ new: row }) => {
        const r = row as { status: string; agent_name: string | null };
        if (r.status === 'active' || r.status === 'on_hold') { setAgentName(r.agent_name); setAnswered(true); }
        if (r.status === 'ended') finish();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [callId]);

  // Cancel a waiting call if the panel closes.
  useEffect(() => () => { if (callIdRef.current) endCallRecord(callIdRef.current); }, []);

  const hangUp = async () => {
    call.signalEnd();
    if (callId) await endCallRecord(callId);
    callIdRef.current = null;
    finish();
  };

  if (!userId) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <Headphones className="w-12 h-12 text-primary" />
        <p className="text-sm text-muted-foreground">Please sign in to call a support agent.</p>
        <Link to="/login"><Button className="gap-2"><LogIn className="w-4 h-4" />Sign in</Button></Link>
      </div>
    );
  }

  if (stage === 'checking') {
    return <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">Looking for an agent…</div>;
  }

  if (stage === 'no_agents') {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
          <PhoneOff className="w-8 h-8 text-destructive" />
        </div>
        <h4 className="font-display font-bold text-lg">No Agents Online</h4>
        <p className="text-sm text-muted-foreground">Nobody from support is available right now. Try again later or ask Pixel.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={start} className="gap-2"><RefreshCw className="w-4 h-4" />Try again</Button>
          <Button onClick={onExit}>Back to Pixel</Button>
        </div>
      </div>
    );
  }

  if (stage === 'ended') {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <h4 className="font-display font-bold text-lg">Call ended</h4>
        <p className="text-sm text-muted-foreground">Thanks for contacting Glitch Games support!</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setCallId(null); start(); }}>Call again</Button>
          <Button onClick={onExit}>Back to Pixel</Button>
        </div>
      </div>
    );
  }

  return (
    <CallScreen
      myLabel="You"
      otherLabel="Support"
      otherName={agentName}
      phase={answered ? call.phase : 'connecting'}
      waitingText="Ringing support…"
      error={call.error}
      muted={call.muted}
      onToggleMute={call.toggleMute}
      localLevel={call.localLevel}
      remoteLevel={call.remoteLevel}
      onEnd={hangUp}
    />
  );
};

export default UserSupportCall;
