import React, { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, Pause, Play, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CallPhase } from '@/lib/supportCall';

interface Props {
  myLabel: string;
  otherLabel: string;
  otherName?: string | null;
  phase: CallPhase;
  waitingText?: string;
  error?: string | null;
  muted: boolean;
  onToggleMute: () => void;
  localLevel: number;
  remoteLevel: number;
  onEnd: () => void;
  showHold?: boolean;
  onHold?: () => void;
  onResume?: () => void;
}

const MicBox = ({ label, sub, level, muted, onClick, dim }: { label: string; sub?: string | null; level: number; muted?: boolean; onClick?: () => void; dim?: boolean }) => (
  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
    <span className="font-display font-bold text-sm tracking-wide uppercase text-foreground">{label}</span>
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={onClick ? (muted ? 'Unmute microphone' : 'Mute microphone') : `${label} microphone`}
      className={cn(
        'relative w-full aspect-square max-w-[150px] rounded-2xl border-2 bg-muted/40 flex items-center justify-center transition-all duration-150',
        level > 0.08 ? 'border-primary shadow-glow' : 'border-border/60',
        dim && 'opacity-50',
        onClick && 'hover:bg-muted/70 cursor-pointer',
      )}
    >
      <span
        className="absolute rounded-full bg-primary/20 transition-all duration-100"
        style={{ width: `${40 + level * 60}%`, height: `${40 + level * 60}%` }}
      />
      {muted ? <MicOff className="relative w-10 h-10 text-destructive" /> : <Mic className="relative w-10 h-10 text-primary" />}
    </button>
    {sub && <span className="text-xs text-muted-foreground truncate max-w-full">{sub}</span>}
  </div>
);

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const CallScreen: React.FC<Props> = (p) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (p.phase !== 'live' && p.phase !== 'on_hold') return;
    const id = window.setInterval(() => setSecs(s => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [p.phase]);

  const status =
    p.error ? p.error :
    p.phase === 'connecting' ? (p.waitingText ?? 'Connecting…') :
    p.phase === 'on_hold' ? 'On hold' :
    p.phase === 'ended' ? 'Call ended' : `Live · ${fmt(secs)}`;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className={cn('text-center text-sm font-medium flex items-center justify-center gap-2',
        p.error ? 'text-destructive' : p.phase === 'live' ? 'text-success' : 'text-muted-foreground')}>
        {p.phase === 'on_hold' && <Music className="w-4 h-4 animate-pulse" />}
        {p.phase === 'connecting' && !p.error && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
        {p.phase === 'live' && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
        {status}
      </div>
      <div className="flex gap-4">
        <MicBox label={p.myLabel} level={p.localLevel} muted={p.muted} onClick={p.onToggleMute} />
        <MicBox label={p.otherLabel} sub={p.otherName} level={p.remoteLevel} dim={p.phase === 'connecting' || p.phase === 'on_hold'} />
      </div>
      <div className="flex gap-3">
        {p.showHold && (p.phase === 'on_hold'
          ? <Button variant="outline" className="flex-1 h-12 gap-2" onClick={p.onResume}><Play className="w-5 h-5" />RESUME</Button>
          : <Button variant="outline" className="flex-1 h-12 gap-2" onClick={p.onHold} disabled={p.phase !== 'live'}><Pause className="w-5 h-5" />HOLD</Button>)}
        <Button variant="destructive" className="flex-1 h-12 gap-2 font-bold" onClick={p.onEnd}>
          <PhoneOff className="w-5 h-5" />END
        </Button>
      </div>
      <p className="text-[11px] text-center text-muted-foreground">Tap your mic box to mute or unmute.</p>
    </div>
  );
};

export default CallScreen;
