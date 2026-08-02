import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

interface Shard {
  pts: { x: number; y: number }[];
  cx: number; cy: number;
  vx: number; vy: number; a: number; va: number; life: number; hue: number;
}
interface Pane {
  x: number; y: number; w: number; h: number; hue: number; cracks: number; alive: boolean;
}

const GlassSmash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panesRef = useRef<Pane[]>([]);
  const shardsRef = useRef<Shard[]>([]);
  const shakeRef = useRef(0);
  const comboRef = useRef({ n: 0, t: 0 });

  const [score, setScore] = useState(0);
  const [time, setTime] = useState(45);
  const [combo, setCombo] = useState(0);
  const [state, setState] = useState<'idle' | 'playing' | 'done'>('idle');
  const { updateGameStats, addCoins } = useGame();

  const W = 640, H = 420;

  const spawnPane = () => {
    const w = 60 + Math.random() * 70;
    const h = 60 + Math.random() * 70;
    panesRef.current.push({
      x: 20 + Math.random() * (W - w - 40),
      y: 20 + Math.random() * (H - h - 40),
      w, h,
      hue: 170 + Math.random() * 120,
      cracks: 0,
      alive: true,
    });
  };

  const shatter = (p: Pane, px: number, py: number) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const r = Math.max(p.w, p.h) * (0.35 + Math.random() * 0.3);
      shardsRef.current.push({
        pts: [
          { x: 0, y: 0 },
          { x: Math.cos(a0) * r, y: Math.sin(a0) * r },
          { x: Math.cos(a1) * r * (0.6 + Math.random() * 0.6), y: Math.sin(a1) * r },
        ],
        cx: px, cy: py,
        vx: Math.cos((a0 + a1) / 2) * (120 + Math.random() * 260),
        vy: Math.sin((a0 + a1) / 2) * (120 + Math.random() * 260) - 60,
        a: 0, va: (Math.random() - 0.5) * 8,
        life: 1.1, hue: p.hue,
      });
    }
    shakeRef.current = 9;
    playSfx('crash');
  };

  const start = () => {
    panesRef.current = [];
    shardsRef.current = [];
    comboRef.current = { n: 0, t: 0 };
    setScore(0); setTime(45); setCombo(0); setState('playing');
    for (let i = 0; i < 4; i++) spawnPane();
    playSfx('powerup');
  };

  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (state !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const panes = panesRef.current;
    for (let i = panes.length - 1; i >= 0; i--) {
      const p = panes[i];
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
        p.cracks += 1;
        if (p.cracks >= 2) {
          shatter(p, x, y);
          panes.splice(i, 1);
          comboRef.current = { n: comboRef.current.n + 1, t: 1.6 };
          const mult = 1 + Math.min(5, comboRef.current.n) * 0.25;
          setCombo(comboRef.current.n);
          setScore((s) => s + Math.round(50 * mult));
          spawnPane();
          if (Math.random() < 0.35) spawnPane();
        } else {
          playSfx('tick');
          setScore((s) => s + 5);
        }
        return;
      }
    }
    comboRef.current = { n: 0, t: 0 };
    setCombo(0);
    playSfx('error');
    setScore((s) => Math.max(0, s - 5));
  };

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state === 'playing' && time <= 0) {
      setState('done');
      updateGameStats('glass-smash', score, 0);
      addCoins(Math.floor(score / 25));
      playSfx('win');
    }
  }, [time, state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0, last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (comboRef.current.t > 0) {
        comboRef.current.t -= dt;
        if (comboRef.current.t <= 0) { comboRef.current.n = 0; setCombo(0); }
      }
      ctx.save();
      if (shakeRef.current > 0) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
        shakeRef.current = Math.max(0, shakeRef.current - dt * 40);
      }
      const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W);
      g.addColorStop(0, '#111a2b'); g.addColorStop(1, '#05070e');
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);

      for (const p of panesRef.current) {
        ctx.save();
        const pg = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
        pg.addColorStop(0, `hsla(${p.hue}, 90%, 70%, 0.32)`);
        pg.addColorStop(1, `hsla(${p.hue + 40}, 90%, 55%, 0.16)`);
        ctx.fillStyle = pg;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 80%, 0.75)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x + 6, p.y + p.h - 6); ctx.lineTo(p.x + p.w * 0.5, p.y + 6); ctx.stroke();
        if (p.cracks > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          const mx = p.x + p.w / 2, my = p.y + p.h / 2;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + Math.cos(a) * p.w * 0.45, my + Math.sin(a) * p.h * 0.45);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      shardsRef.current = shardsRef.current.filter((s) => {
        s.vy += 900 * dt;
        s.cx += s.vx * dt; s.cy += s.vy * dt; s.a += s.va * dt;
        s.life -= dt * 0.9;
        if (s.life <= 0) return false;
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.translate(s.cx, s.cy); ctx.rotate(s.a);
        ctx.fillStyle = `hsla(${s.hue}, 95%, 75%, 0.6)`;
        ctx.beginPath();
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        for (const p of s.pts.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
        return true;
      });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">Score {score}</span>
        {combo > 1 && <span className="text-accent animate-pop-in">COMBO x{Math.min(5, combo)}</span>}
        <span className="text-warning">{Math.max(0, time)}s</span>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-border">
        <canvas ref={canvasRef} width={640} height={420} className="w-full h-auto touch-none cursor-crosshair" onPointerDown={hit} />
        {state !== 'playing' && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center px-4">
            <h3 className="font-display text-2xl font-bold">{state === 'done' ? `Time! ${score} pts` : 'Glass Smash'}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Crack each pane, then smash it. Chain smashes fast to build a combo multiplier — misses cost points.</p>
            <Button variant="gaming" onClick={start}>{state === 'done' ? 'Smash Again' : 'Start'}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassSmash;
