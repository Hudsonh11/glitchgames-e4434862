import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

interface Ripple { x: number; y: number; r: number; max: number; hue: number; }

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // pentatonic-ish, always pleasant

const WaterRipples: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const dropsRef = useRef<{ x: number; y: number; v: number; hue: number }[]>([]);
  const ctxAudioRef = useRef<AudioContext | null>(null);
  const [taps, setTaps] = useState(0);
  const [auto, setAuto] = useState(false);
  const { updateGameStats, addCoins } = useGame();
  const W = 640, H = 420;

  const chime = (x: number) => {
    try {
      if (!ctxAudioRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxAudioRef.current = new AC();
      }
      const c = ctxAudioRef.current!;
      if (c.state === 'suspended') c.resume();
      const idx = Math.floor((x / W) * SCALE.length);
      const semis = SCALE[Math.max(0, Math.min(SCALE.length - 1, idx))];
      const freq = 261.63 * Math.pow(2, semis / 12) * 2;
      const t = c.currentTime;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      g.connect(c.destination);
      [1, 2.01, 3.03].forEach((m, i) => {
        const o = c.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = freq * m;
        const og = c.createGain();
        og.gain.value = 1 / (i + 1.6);
        o.connect(og).connect(g);
        o.start(t); o.stop(t + 2.2);
      });
    } catch { /* audio unavailable */ }
  };

  const drop = (x: number, y: number) => {
    const hue = 170 + ((x / W) * 140);
    dropsRef.current.push({ x, y: Math.max(0, y - 120), v: 0, hue });
    setTaps((t) => t + 1);
  };

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => drop(40 + Math.random() * (W - 80), 120 + Math.random() * (H - 200)), 900);
    return () => clearInterval(t);
  }, [auto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#04121c'); g.addColorStop(0.5, '#062334'); g.addColorStop(1, '#03101a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // ambient shimmer
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 6; i++) {
        const y = ((now / 40 + i * 70) % (H + 100)) - 50;
        ctx.strokeStyle = '#7fe4ff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W / 3, y - 10, (2 * W) / 3, y + 10, W, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      dropsRef.current = dropsRef.current.filter((d) => {
        d.v += 1200 * dt; d.y += d.v * dt;
        const surface = H * 0.55;
        if (d.y >= surface) {
          ripplesRef.current.push({ x: d.x, y: surface, r: 2, max: 90 + Math.random() * 80, hue: d.hue });
          ripplesRef.current.push({ x: d.x, y: surface, r: 2, max: 40, hue: d.hue });
          chime(d.x);
          playSfx('pop');
          return false;
        }
        ctx.fillStyle = `hsl(${d.hue} 90% 80%)`;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
        return true;
      });

      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.r += 70 * dt;
        const a = 1 - r.r / r.max;
        if (a <= 0) return false;
        ctx.strokeStyle = `hsla(${r.hue}, 95%, 75%, ${a * 0.8})`;
        ctx.lineWidth = 2 * a + 0.4;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        return true;
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">Drops {taps}</span>
        <span className="text-muted-foreground text-xs">Left = low notes · Right = high notes</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={640} height={420}
          className="w-full h-auto touch-none cursor-pointer"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            drop(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
          }}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button variant={auto ? 'gaming' : 'outline'} size="sm" onClick={() => setAuto((a) => !a)}>{auto ? 'Rain On' : 'Rain Off'}</Button>
        <Button variant="outline" size="sm" onClick={() => { updateGameStats('water-ripples', taps, 0); addCoins(Math.min(15, Math.floor(taps / 10))); playSfx('coin'); }}>Save Session</Button>
      </div>
    </div>
  );
};

export default WaterRipples;
