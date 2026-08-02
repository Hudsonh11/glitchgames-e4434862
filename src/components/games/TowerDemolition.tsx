import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

interface Box {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number; a: number; va: number;
  hp: number; hue: number; asleep: boolean;
}

const GRAVITY = 1400;
const REST = 0.22;

const TowerDemolition: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxesRef = useRef<Box[]>([]);
  const debrisRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; hue: number }[]>([]);
  const ballRef = useRef({ x: 120, y: 90, vx: 0, vy: 0, r: 26, held: true, angle: -0.9, swing: 1 });
  const shakeRef = useRef(0);
  const rafRef = useRef<number>();
  const startHRef = useRef(0);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(3);
  const [state, setState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const { updateGameStats, addCoins } = useGame();

  const W = 640, H = 420, GROUND = 380;

  const buildLevel = useCallback((lv: number) => {
    const boxes: Box[] = [];
    const cols = 3 + Math.min(3, Math.floor(lv / 2));
    const rows = 5 + Math.min(5, lv);
    const bw = 46, bh = 26;
    const baseX = W - cols * bw - 60;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : bw / 2;
      const c = r % 2 === 0 ? cols : cols - 1;
      for (let i = 0; i < c; i++) {
        boxes.push({
          x: baseX + offset + i * bw, y: GROUND - (r + 1) * bh,
          w: bw - 2, h: bh - 2, vx: 0, vy: 0, a: 0, va: 0,
          hp: 2 + (r < 2 ? 1 : 0), hue: 200 + ((r * 17) % 60), asleep: true,
        });
      }
    }
    boxesRef.current = boxes;
    startHRef.current = rows * bh;
  }, []);

  const spawnDebris = (x: number, y: number, hue: number, n = 14) => {
    for (let i = 0; i < n; i++) {
      debrisRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 420,
        vy: -Math.random() * 380,
        life: 0.6 + Math.random() * 0.6,
        hue,
      });
    }
  };

  const start = (lv = 1) => {
    setLevel(lv); setShots(3); setState('playing'); setProgress(0);
    if (lv === 1) setScore(0);
    buildLevel(lv);
    debrisRef.current = [];
    ballRef.current = { x: 120, y: 90, vx: 0, vy: 0, r: 26, held: true, angle: -0.9, swing: 1 };
    playSfx('powerup');
  };

  const release = () => {
    const b = ballRef.current;
    if (!b.held || state !== 'playing') return;
    b.held = false;
    b.vx = Math.cos(b.angle + Math.PI / 2) * 340 * b.swing + 420;
    b.vy = Math.sin(b.angle + Math.PI / 2) * 340 * b.swing;
    playSfx('whoosh');
    setShots((s) => s - 1);
  };

  // main loop
  useEffect(() => {
    if (state !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let last = performance.now();
    let settleTimer = 0;

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const ball = ballRef.current;
      const boxes = boxesRef.current;

      // ball
      if (ball.held) {
        ball.angle += 1.6 * dt * ball.swing;
        if (ball.angle > 0.9 || ball.angle < -0.9) ball.swing *= -1;
        ball.x = 150 + Math.sin(ball.angle) * 120;
        ball.y = 40 + Math.cos(ball.angle) * 120;
      } else {
        ball.vy += GRAVITY * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.y + ball.r > GROUND) { ball.y = GROUND - ball.r; ball.vy *= -0.4; ball.vx *= 0.86; }
        if (ball.x - ball.r > W + 200 || Math.abs(ball.vx) < 12) {
          settleTimer += dt;
        }
      }

      // boxes physics
      for (const b of boxes) {
        if (!b.asleep) {
          b.vy += GRAVITY * dt;
          b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
          b.va *= 0.99;
          if (b.y + b.h > GROUND) {
            b.y = GROUND - b.h;
            if (Math.abs(b.vy) > 220) playSfx('tick');
            b.vy *= -REST; b.vx *= 0.82; b.va *= 0.7;
            if (Math.abs(b.vy) < 30) b.vy = 0;
          }
          if (b.x < 0) { b.x = 0; b.vx *= -0.4; }
          if (b.x + b.w > W) { b.x = W - b.w; b.vx *= -0.4; }
        }
      }

      // box vs box separation (simple, iterated)
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const A = boxes[i], B = boxes[j];
            if (A.asleep && B.asleep) continue;
            const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
            const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
            if (ox <= 0 || oy <= 0) continue;
            if (oy < ox) {
              const sign = A.y < B.y ? -1 : 1;
              const push = oy / 2;
              A.y += sign * push; B.y -= sign * push;
              const rel = A.vy - B.vy;
              A.vy -= rel * 0.5; B.vy += rel * 0.5;
              A.va += (Math.random() - 0.5) * 0.4; B.va += (Math.random() - 0.5) * 0.4;
            } else {
              const sign = A.x < B.x ? -1 : 1;
              const push = ox / 2;
              A.x += sign * push; B.x -= sign * push;
              const rel = A.vx - B.vx;
              A.vx -= rel * 0.5; B.vx += rel * 0.5;
            }
            A.asleep = false; B.asleep = false;
          }
        }
      }

      // support check — unsupported boxes wake up
      for (const b of boxes) {
        if (!b.asleep) continue;
        if (b.y + b.h >= GROUND - 1) continue;
        const supported = boxes.some((o) =>
          o !== b &&
          Math.abs(o.y - (b.y + b.h)) < 3 &&
          o.x < b.x + b.w - 4 && o.x + o.w > b.x + 4);
        if (!supported) b.asleep = false;
      }

      // ball vs boxes
      if (!ball.held) {
        for (let i = boxes.length - 1; i >= 0; i--) {
          const b = boxes[i];
          const cx = Math.max(b.x, Math.min(ball.x, b.x + b.w));
          const cy = Math.max(b.y, Math.min(ball.y, b.y + b.h));
          const dx = ball.x - cx, dy = ball.y - cy;
          if (dx * dx + dy * dy < ball.r * ball.r) {
            const speed = Math.hypot(ball.vx, ball.vy);
            b.asleep = false;
            b.vx += ball.vx * 0.55 + (Math.random() - 0.5) * 60;
            b.vy += ball.vy * 0.45 - 120;
            b.va += (Math.random() - 0.5) * 10;
            ball.vx *= 0.82; ball.vy *= 0.82;
            if (speed > 260) {
              b.hp -= 1;
              shakeRef.current = Math.min(14, speed / 60);
              spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.hue, 8);
              playSfx('crash');
              if (b.hp <= 0) {
                spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.hue, 18);
                boxes.splice(i, 1);
                setScore((s) => s + 25);
              }
            }
          }
        }
      }

      // debris
      debrisRef.current = debrisRef.current.filter((d) => {
        d.vy += GRAVITY * dt * 0.7;
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.y > GROUND) { d.y = GROUND; d.vy *= -0.3; d.vx *= 0.7; }
        d.life -= dt;
        return d.life > 0;
      });

      // progress: how much of the tower is knocked below 40% original height
      const top = boxes.length ? Math.min(...boxes.map((b) => b.y)) : GROUND;
      const remaining = (GROUND - top) / (startHRef.current || 1);
      const pct = Math.max(0, Math.min(1, 1 - remaining));
      setProgress(Math.round(pct * 100));

      // round resolution
      const allSettled = boxes.every((b) => Math.abs(b.vx) + Math.abs(b.vy) < 18);
      if (!ball.held && allSettled && settleTimer > 1.1) {
        if (pct >= 0.6 || boxes.length === 0) {
          const bonus = 100 + shots * 60 + Math.round(pct * 150);
          setScore((s) => s + bonus);
          playSfx('win');
          shakeRef.current = 10;
          setTimeout(() => start(level + 1), 900);
          setState('idle');
          return;
        }
        if (shots <= 0) {
          setState('done');
          return;
        }
        ballRef.current = { x: 120, y: 90, vx: 0, vy: 0, r: 26, held: true, angle: -0.9, swing: 1 };
        settleTimer = 0;
      }

      // ---- render ----
      ctx.save();
      const sh = shakeRef.current;
      if (sh > 0) { ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh); shakeRef.current = Math.max(0, sh - dt * 30); }

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0b1224'); sky.addColorStop(0.6, '#152036'); sky.addColorStop(1, '#20293d');
      ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);

      // skyline
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 12; i++) ctx.fillRect(i * 58, GROUND - 60 - ((i * 37) % 90), 44, 200);

      // ground
      ctx.fillStyle = '#2b3348'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = 'rgba(0,255,255,0.25)'; ctx.fillRect(0, GROUND, W, 2);

      // crane
      ctx.strokeStyle = '#8b95ad'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(40, GROUND); ctx.lineTo(40, 30); ctx.lineTo(150, 30); ctx.lineTo(150, 40); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
      if (ball.held) { ctx.beginPath(); ctx.moveTo(150, 40); ctx.lineTo(ball.x, ball.y); ctx.stroke(); }

      // boxes
      for (const b of boxes) {
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
        ctx.rotate(b.a);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(-b.w / 2 + 3, -b.h / 2 + 4, b.w, b.h);
        const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2);
        const l = b.hp > 1 ? 58 : 38;
        g.addColorStop(0, `hsl(${b.hue} 45% ${l + 12}%)`);
        g.addColorStop(1, `hsl(${b.hue} 45% ${l - 10}%)`);
        ctx.fillStyle = g;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
        ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
        if (b.hp <= 1) {
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.beginPath(); ctx.moveTo(-b.w / 4, -b.h / 2); ctx.lineTo(0, 0); ctx.lineTo(b.w / 5, b.h / 2); ctx.stroke();
        }
        ctx.restore();
      }

      // debris
      for (const d of debrisRef.current) {
        ctx.globalAlpha = Math.max(0, d.life);
        ctx.fillStyle = `hsl(${d.hue} 40% 60%)`;
        ctx.fillRect(d.x, d.y, 4, 4);
      }
      ctx.globalAlpha = 1;

      // ball
      const bg = ctx.createRadialGradient(ball.x - 8, ball.y - 10, 3, ball.x, ball.y, ball.r);
      bg.addColorStop(0, '#eef2ff'); bg.addColorStop(0.35, '#94a3b8'); bg.addColorStop(1, '#334155');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state, level, shots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state === 'done') {
      updateGameStats('tower-demolition', score, 0);
      addCoins(Math.floor(score / 20));
      playSfx('lose');
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); release(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex gap-4 text-sm font-bold">
          <span className="text-primary">Score {score}</span>
          <span className="text-warning">Level {level}</span>
          <span className="text-accent">Swings {Math.max(0, shots)}</span>
        </div>
        <div className="flex-1 min-w-[140px] h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          className="w-full h-auto touch-none cursor-pointer"
          onPointerDown={release}
        />
        {state !== 'playing' && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center px-4">
            <h3 className="font-display text-2xl font-bold">
              {state === 'done' ? 'Demolition Failed' : 'Tower Demolition'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tap (or press Space) to release the wrecking ball at the perfect moment. Bring the building down at least 60% to clear the level.
            </p>
            <Button variant="gaming" onClick={() => start(state === 'done' ? 1 : level)}>
              {state === 'done' ? 'Try Again' : 'Start Demolition'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">Tap / Space to release · destroy blocks for points · unused swings give bonus</p>
    </div>
  );
};

export default TowerDemolition;
