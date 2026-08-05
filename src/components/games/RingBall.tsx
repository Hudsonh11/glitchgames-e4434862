import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';
import { Play, Pause, RotateCcw, Timer, Zap } from 'lucide-react';

/**
 * Ring Ball — guide the black hole around a neon ring and swallow bouncing balls.
 * Every swallowed ball splits into more balls, so the arena gets busier the better you play.
 */

const SIZE = 600;
const CENTER = SIZE / 2;
const RING_RADIUS = 290;
const BASE_HOLE_RADIUS = 35;
const BALL_RADIUS = 16;
const MAX_BALLS = 90; // perf guard — the original had "no limits" and eventually froze
const ROUND_SECONDS = 75;

interface Ball {
  x: number; y: number; vx: number; vy: number; r: number;
  invul: number; gold: boolean; bomb: boolean; hue: number;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

const makeBall = (x: number, y: number, speedScale = 1): Ball => {
  const angle = Math.random() * Math.PI * 2;
  const speed = (4.5 + Math.random() * 4) * speedScale;
  const roll = Math.random();
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: BALL_RADIUS,
    invul: 35,
    gold: roll < 0.06,
    bomb: roll >= 0.06 && roll < 0.12,
    hue: Math.random() * 360,
  };
};

const RingBall: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const { updateGameStats, addCoins, addGems } = useGame();

  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [ballCount, setBallCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [best, setBest] = useState(() => Number(localStorage.getItem('gg:ring-ball:best') || 0));

  const state = useRef({
    balls: [] as Ball[],
    particles: [] as Particle[],
    hole: { x: CENTER, y: CENTER, r: BASE_HOLE_RADIUS },
    score: 0,
    combo: 1,
    comboTimer: 0,
    shake: 0,
    endAt: 0,
    running: false,
  });

  const reset = useCallback(() => {
    const s = state.current;
    s.balls = [{ ...makeBall(CENTER, CENTER), invul: 0 }];
    s.particles = [];
    s.hole = { x: CENTER, y: CENTER, r: BASE_HOLE_RADIUS };
    s.score = 0; s.combo = 1; s.comboTimer = 0; s.shake = 0;
    s.endAt = performance.now() + ROUND_SECONDS * 1000;
    setScore(0); setCombo(1); setBallCount(1); setTimeLeft(ROUND_SECONDS); setOver(false);
  }, []);

  const explode = (x: number, y: number, color: string, n = 14) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 6;
      state.current.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
    }
  };

  const finish = useCallback(async () => {
    const s = state.current;
    s.running = false;
    setRunning(false);
    setOver(true);
    playSfx(s.score > 0 ? 'win' : 'lose');
    const final = s.score;
    if (final > best) {
      setBest(final);
      localStorage.setItem('gg:ring-ball:best', String(final));
    }
    await updateGameStats('ring-ball', final, ROUND_SECONDS);
    const coins = Math.min(300, Math.floor(final / 40));
    if (coins > 0) await addCoins(coins);
    if (final >= 5000) await addGems(3);
  }, [best, updateGameStats, addCoins, addGems]);

  // Pointer control
  const movePointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !state.current.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SIZE;
    const y = ((clientY - rect.top) / rect.height) * SIZE;
    const dx = x - CENTER, dy = y - CENTER;
    const dist = Math.hypot(dx, dy);
    const hole = state.current.hole;
    const limit = RING_RADIUS - hole.r;
    if (dist < limit) { hole.x = x; hole.y = y; }
    else {
      const a = Math.atan2(dy, dx);
      hole.x = CENTER + Math.cos(a) * limit;
      hole.y = CENTER + Math.sin(a) * limit;
    }
  }, []);

  // Keyboard control for desktop players without a mouse
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const s = state.current;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
        s.shake *= 0.88;
      }

      // arena floor rings
      ctx.strokeStyle = 'rgba(0,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let r = 60; r < RING_RADIUS; r += 60) {
        ctx.beginPath(); ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2); ctx.stroke();
      }

      if (s.running) {
        // keyboard nudge
        const k = keys.current;
        const sp = 7;
        let kx = 0, ky = 0;
        if (k['arrowleft'] || k['a']) kx -= sp;
        if (k['arrowright'] || k['d']) kx += sp;
        if (k['arrowup'] || k['w']) ky -= sp;
        if (k['arrowdown'] || k['s']) ky += sp;
        if (kx || ky) {
          const nx = s.hole.x + kx, ny = s.hole.y + ky;
          const d = Math.hypot(nx - CENTER, ny - CENTER);
          const limit = RING_RADIUS - s.hole.r;
          if (d < limit) { s.hole.x = nx; s.hole.y = ny; }
        }

        if (s.comboTimer > 0) s.comboTimer--; else if (s.combo !== 1) { s.combo = 1; setCombo(1); }
        if (s.hole.r > BASE_HOLE_RADIUS) s.hole.r = Math.max(BASE_HOLE_RADIUS, s.hole.r - 0.6);

        const remain = Math.max(0, Math.ceil((s.endAt - performance.now()) / 1000));
        setTimeLeft((t) => (t !== remain ? remain : t));
        if (remain <= 0) { finish(); }
      }

      // physics
      if (s.running) {
        const balls = s.balls;
        for (const b of balls) {
          b.vx *= 0.998; b.vy *= 0.998;
          b.x += b.vx; b.y += b.vy;
          if (b.invul > 0) b.invul--;
          const dx = b.x - CENTER, dy = b.y - CENTER;
          const dist = Math.hypot(dx, dy) || 0.0001;
          if (dist + b.r > RING_RADIUS) {
            const nx = dx / dist, ny = dy / dist;
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 2 * dot * nx) * 0.95;
            b.vy = (b.vy - 2 * dot * ny) * 0.95;
            b.x = CENTER + nx * (RING_RADIUS - b.r);
            b.y = CENTER + ny * (RING_RADIUS - b.r);
          }
        }

        // ball-to-ball elastic collisions
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const a = balls[i], b = balls[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            let dist = Math.hypot(dx, dy);
            const min = a.r + b.r;
            if (dist < min) {
              if (dist === 0) { a.x += (Math.random() - 0.5); a.y += (Math.random() - 0.5); continue; }
              const overlap = (min - dist) / 2;
              const nx = dx / dist, ny = dy / dist;
              a.x -= nx * overlap; a.y -= ny * overlap;
              b.x += nx * overlap; b.y += ny * overlap;
              const p = nx * (a.vx - b.vx) + ny * (a.vy - b.vy);
              if (p > 0) {
                a.vx -= p * nx; a.vy -= p * ny;
                b.vx += p * nx; b.vy += p * ny;
              }
            }
          }
        }

        // swallow check
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          if (b.invul > 0) continue;
          if (Math.hypot(b.x - s.hole.x, b.y - s.hole.y) < s.hole.r) {
            balls.splice(i, 1);
            if (b.bomb) {
              s.combo = 1; s.comboTimer = 0; s.shake = 18;
              s.score = Math.max(0, s.score - 150);
              explode(s.hole.x, s.hole.y, '#ff3355', 22);
              playSfx('crash');
              setCombo(1);
            } else {
              s.score += (b.gold ? 100 : 10) * s.combo;
              s.combo++; s.comboTimer = 120;
              s.hole.r = BASE_HOLE_RADIUS + 18;
              s.shake = b.gold ? 10 : 4;
              explode(s.hole.x, s.hole.y, b.gold ? 'gold' : '#0ff');
              playSfx(b.gold ? 'coin' : 'pop');
              setCombo(s.combo);
              const spawn = b.gold ? 4 : 2;
              for (let n = 0; n < spawn && balls.length < MAX_BALLS; n++) {
                balls.push(makeBall(s.hole.x, s.hole.y, 1 + s.score / 20000));
              }
            }
            setScore(s.score);
          }
        }
        // never let the board die out
        while (balls.length === 0) balls.push(makeBall(CENTER, CENTER));
        setBallCount(balls.length);
      }

      // draw hole
      const hole = s.hole;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
      const hg = ctx.createRadialGradient(hole.x, hole.y, 0, hole.x, hole.y, hole.r);
      hg.addColorStop(0, '#000');
      hg.addColorStop(0.8, '#150025');
      hg.addColorStop(1, '#ff00ff');
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff00ff';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.shadowBlur = 0;

      // draw balls
      for (const b of s.balls) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
        if (b.bomb) {
          g.addColorStop(0, '#ff9aa8'); g.addColorStop(0.35, '#ff2244'); g.addColorStop(1, '#600');
        } else if (b.gold) {
          g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffd700'); g.addColorStop(1, '#a67c00');
        } else {
          g.addColorStop(0, '#fff');
          g.addColorStop(0.3, `hsl(${b.hue}, 100%, 60%)`);
          g.addColorStop(1, `hsl(${b.hue}, 100%, 30%)`);
        }
        ctx.fillStyle = g;
        ctx.globalAlpha = b.invul > 0 ? 0.4 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (b.gold || b.bomb) {
          ctx.shadowBlur = 12; ctx.shadowColor = b.gold ? 'gold' : '#ff2244';
          ctx.strokeStyle = b.gold ? 'gold' : '#ff6677'; ctx.lineWidth = 2; ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        if (p.life <= 0) { s.particles.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [finish]);

  const start = () => {
    reset();
    state.current.running = true;
    setRunning(true);
    playSfx('whoosh');
  };

  const togglePause = () => {
    const s = state.current;
    if (over) return;
    if (s.running) {
      s.running = false; setRunning(false);
    } else {
      s.endAt = performance.now() + timeLeft * 1000;
      s.running = true; setRunning(true);
    }
    playSfx('click');
  };

  return (
    <div className="w-full max-w-[640px] mx-auto px-2">
      <div className="flex items-center justify-between gap-2 mb-3 text-sm font-bold">
        <span className="text-primary">SCORE {score.toLocaleString()}</span>
        {combo > 1 && <span className="text-warning animate-pulse">x{combo} COMBO</span>}
        <span className="text-accent flex items-center gap-1"><Zap className="w-4 h-4" />{ballCount}</span>
        <span className="text-muted-foreground flex items-center gap-1"><Timer className="w-4 h-4" />{timeLeft}s</span>
      </div>

      <div className="relative aspect-square w-full max-w-[600px] mx-auto">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="w-full h-full rounded-full touch-none"
          style={{
            background: 'radial-gradient(circle at center, hsl(240 40% 16%) 0%, hsl(240 60% 3%) 100%)',
            boxShadow: '0 30px 60px rgba(0,0,0,.9), inset 0 20px 50px hsl(185 100% 50% / .12), inset 0 -20px 50px hsl(300 100% 50% / .12), 0 0 0 4px hsl(185 100% 50% / .8), 0 0 30px hsl(185 100% 50% / .6)',
          }}
          onMouseMove={(e) => movePointer(e.clientX, e.clientY)}
          onTouchMove={(e) => { e.preventDefault(); movePointer(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchStart={(e) => movePointer(e.touches[0].clientX, e.touches[0].clientY)}
        />

        {(!running || over) && (
          <div className="absolute inset-0 rounded-full bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 gap-3">
            <h3 className="font-display text-2xl font-black text-primary">
              {over ? 'Round Over' : running ? '' : score > 0 ? 'Paused' : 'Ring Ball'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {over
                ? `You scored ${score.toLocaleString()} — best ${Math.max(best, score).toLocaleString()}.`
                : 'Drag (or use WASD / arrows) to move the black hole. Swallow balls to score — each one splits into more. Gold balls are worth 10x, red bombs cost you points and your combo.'}
            </p>
            <Button onClick={over || score === 0 ? start : togglePause} size="lg">
              {over ? <RotateCcw className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {over ? 'Play Again' : score === 0 ? 'Start Game' : 'Resume'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={togglePause} disabled={over || score === 0 && !running}>
          {running ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {running ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="outline" size="sm" onClick={start}>
          <RotateCcw className="w-4 h-4 mr-1" /> Restart
        </Button>
        <span className="text-xs text-muted-foreground">Best: {best.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default RingBall;
