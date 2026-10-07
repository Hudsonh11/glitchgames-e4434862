// Live voice support calls: WebRTC audio, signalled over realtime broadcast.
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AGENT_PRESENCE_CHANNEL = 'support-agents-presence';

export type CallRole = 'user' | 'agent';
export type CallPhase = 'connecting' | 'live' | 'on_hold' | 'ended' | 'error';

/** Is the signed-in user a support agent? */
export function useIsSupportAgent(userId: string | undefined) {
  const [isAgent, setIsAgent] = useState(false);
  useEffect(() => {
    if (!userId) { setIsAgent(false); return; }
    let alive = true;
    supabase.from('support_agents').select('id').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (alive) setIsAgent(!!data); });
    return () => { alive = false; };
  }, [userId]);
  return isAgent;
}

/** Simple synthesized looping hold tune. Returns a stop function. */
export function startHoldMusic(): () => void {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.08;
  master.connect(ctx.destination);
  const melody = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 784, 659, 587];
  const bass = [131, 131, 147, 147, 131, 131, 175, 165];
  let step = 0;
  const beat = 0.28;
  const tick = () => {
    const t = ctx.currentTime;
    const note = (freq: number, dur: number, type: OscillatorType, vol: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur);
    };
    note(melody[step % melody.length], beat * 0.9, 'triangle', 0.9);
    if (step % 2 === 0) note(bass[(step / 2) % bass.length], beat * 1.8, 'sine', 0.7);
    step++;
  };
  tick();
  const id = window.setInterval(tick, beat * 1000);
  return () => { window.clearInterval(id); ctx.close().catch(() => {}); };
}

const levelOf = (an: AnalyserNode, buf: Uint8Array<ArrayBuffer>) => {
  an.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
  return Math.min(1, Math.sqrt(sum / buf.length) * 4);
};

type Signal =
  | { kind: 'ready' }
  | { kind: 'offer'; sdp: RTCSessionDescriptionInit }
  | { kind: 'answer'; sdp: RTCSessionDescriptionInit }
  | { kind: 'ice'; candidate: RTCIceCandidateInit }
  | { kind: 'hold' } | { kind: 'resume' } | { kind: 'end' };

/**
 * Runs a voice call for the given call id. The agent creates the offer once the
 * user announces it is ready.
 */
export function useVoiceCall(callId: string | null, role: CallRole, active: boolean, onRemoteEnd?: () => void) {
  const [phase, setPhase] = useState<CallPhase>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [localLevel, setLocalLevel] = useState(0);
  const [remoteLevel, setRemoteLevel] = useState(0);
  const sendRef = useRef<(s: Signal) => void>(() => {});
  const localStreamRef = useRef<MediaStream | null>(null);
  const mutedRef = useRef(false);
  const holdRef = useRef(false);
  const stopMusicRef = useRef<(() => void) | null>(null);
  const onRemoteEndRef = useRef(onRemoteEnd);
  onRemoteEndRef.current = onRemoteEnd;

  const applyMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !mutedRef.current && !holdRef.current; });
  };

  const setHold = useCallback((on: boolean) => {
    holdRef.current = on;
    applyMic();
    setPhase(on ? 'on_hold' : 'live');
    if (role === 'user') {
      if (on && !stopMusicRef.current) stopMusicRef.current = startHoldMusic();
      if (!on && stopMusicRef.current) { stopMusicRef.current(); stopMusicRef.current = null; }
    }
  }, [role]);

  useEffect(() => {
    if (!callId || !active) return;
    let disposed = false;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
    const pendingIce: RTCIceCandidateInit[] = [];
    let offered = false;
    let readyTimer: number | undefined;
    let levelTimer: number | undefined;
    const audioEl = new Audio();
    audioEl.autoplay = true;
    const actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    let localAn: AnalyserNode | null = null;
    let remoteAn: AnalyserNode | null = null;
    const buf = new Uint8Array(new ArrayBuffer(256));

    const channel = supabase.channel(`support-call-${callId}`, { config: { broadcast: { self: false } } });
    const send = (s: Signal) => { channel.send({ type: 'broadcast', event: 'signal', payload: s }); };
    sendRef.current = send;

    const flushIce = async () => {
      while (pendingIce.length) { try { await pc.addIceCandidate(pendingIce.shift()!); } catch { /* ignore */ } }
    };

    pc.onicecandidate = (e) => { if (e.candidate) send({ kind: 'ice', candidate: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      audioEl.srcObject = stream;
      audioEl.play().catch(() => {});
      try {
        remoteAn = actx.createAnalyser(); remoteAn.fftSize = 256;
        actx.createMediaStreamSource(stream).connect(remoteAn);
      } catch { /* ignore */ }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') { window.clearInterval(readyTimer); if (!holdRef.current) setPhase('live'); }
      if (pc.connectionState === 'failed') { setError('Connection failed. Please try again.'); setPhase('error'); }
    };

    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const s = payload as Signal;
      try {
        if (s.kind === 'ready' && role === 'agent' && !offered) {
          offered = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ kind: 'offer', sdp: offer });
        } else if (s.kind === 'offer' && role === 'user') {
          window.clearInterval(readyTimer);
          await pc.setRemoteDescription(s.sdp);
          await flushIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ kind: 'answer', sdp: answer });
        } else if (s.kind === 'answer' && role === 'agent') {
          await pc.setRemoteDescription(s.sdp);
          await flushIce();
        } else if (s.kind === 'ice') {
          if (pc.remoteDescription) await pc.addIceCandidate(s.candidate).catch(() => {});
          else pendingIce.push(s.candidate);
        } else if (s.kind === 'hold') setHold(true);
        else if (s.kind === 'resume') setHold(false);
        else if (s.kind === 'end') { setPhase('ended'); onRemoteEndRef.current?.(); }
      } catch (err) { console.error('signal error', err); }
    });

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        if (disposed) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        applyMic();
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
        localAn = actx.createAnalyser(); localAn.fftSize = 256;
        actx.createMediaStreamSource(stream).connect(localAn);
        levelTimer = window.setInterval(() => {
          setLocalLevel(localAn && !mutedRef.current && !holdRef.current ? levelOf(localAn, buf) : 0);
          setRemoteLevel(remoteAn ? levelOf(remoteAn, buf) : 0);
        }, 120);
      } catch {
        setError('Microphone access is needed for a support call.');
        setPhase('error');
        return;
      }
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED' && role === 'user') {
          send({ kind: 'ready' });
          readyTimer = window.setInterval(() => send({ kind: 'ready' }), 2000);
        }
      });
    })();

    return () => {
      disposed = true;
      window.clearInterval(readyTimer);
      window.clearInterval(levelTimer);
      stopMusicRef.current?.(); stopMusicRef.current = null;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      pc.close();
      audioEl.srcObject = null;
      actx.close().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [callId, active, role, setHold]);

  const toggleMute = () => { mutedRef.current = !mutedRef.current; setMuted(mutedRef.current); applyMic(); };
  const hold = () => { sendRef.current({ kind: 'hold' }); setHold(true); };
  const resume = () => { sendRef.current({ kind: 'resume' }); setHold(false); };
  const signalEnd = () => { sendRef.current({ kind: 'end' }); setPhase('ended'); };

  return { phase, error, muted, toggleMute, localLevel, remoteLevel, hold, resume, signalEnd };
}

export async function endCallRecord(callId: string) {
  await supabase.from('support_calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', callId);
}
