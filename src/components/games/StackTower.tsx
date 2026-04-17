import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const W = 360, H = 540, BLOCK_H = 22;

interface Block { x: number; w: number; color: string; }

const StackTower: React.FC = () => {
  const { updateGameStats, soundSettings } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('stack-tower-best') || 0));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const stateRef = useRef<{ stack: Block[]; moving: Block; dir: 1 | -1; speed: number; t: number; }>({
    stack: [{ x: 80, w: 200, color: 'hsl(185 100% 50%)' }],
    moving: { x: 0, w: 200, color: 'hsl(280 100% 60%)' },
    dir: 1,
    speed: 3,
    t: 0,
  });

  const reset = useCallback(() => {
    stateRef.current = {
      stack: [{ x: 80, w: 200, color: 'hsl(185 100% 50%)' }],
      moving: { x: 0, w: 200, color: 'hsl(280 100% 60%)' },
      dir: 1,
      speed: 3,
      t: 0,
    };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  const drop = useCallback(() => {
    const s = stateRef.current;
    const top = s.stack[s.stack.length - 1];
    const m = s.moving;
    const overlapStart = Math.max(top.x, m.x);
    const overlapEnd = Math.min(top.x + top.w, m.x + m.w);
    const overlap = overlapEnd - overlapStart;

    if (overlap <= 0) {
      setRunning(false);
      setOver(true);
      const finalScore = score;
      if (finalScore > best) {
        setBest(finalScore);
        localStorage.setItem('stack-tower-best', String(finalScore));
      }
      updateGameStats('stack-tower', finalScore, Math.floor(s.t / 60));
      return;
    }

    const hue = (s.stack.length * 18) % 360;
    s.stack.push({ x: overlapStart, w: overlap, color: `hsl(${hue} 100% 55%)` });
    s.moving = { x: 0, w: overlap, color: `hsl(${(hue + 30) % 360} 100% 55%)` };
    s.speed = Math.min(8, s.speed + 0.15);
    setScore((p) => p + 1);

    if (soundSettings && !soundSettings.isMuted) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 220 + s.stack.length * 12;
        g.gain.value = 0.05 * (soundSettings.sfxVolume / 100);
        o.start(); o.stop(ctx.currentTime + 0.08);
      } catch {}
    }
  }, [score, best, updateGameStats, soundSettings]);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      const s = stateRef.current;
      s.t++;
      // move
      s.moving.x += s.dir * s.speed;
      if (s.moving.x + s.moving.w > W) { s.moving.x = W - s.moving.w; s.dir = -1; }
      if (s.moving.x < 0) { s.moving.x = 0; s.dir = 1; }

      // bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'hsl(240 30% 8%)');
      grad.addColorStop(1, 'hsl(280 40% 4%)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // stack (camera follows)
      const camY = Math.max(0, s.stack.length * BLOCK_H - H * 0.6);
      s.stack.forEach((b, i) => {
        const y = H - (i + 1) * BLOCK_H + camY;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, y, b.w, BLOCK_H);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeRect(b.x, y, b.w, BLOCK_H);
      });

      // moving
      const my = H - (s.stack.length + 1) * BLOCK_H + camY;
      ctx.fillStyle = s.moving.color;
      ctx.fillRect(s.moving.x, my, s.moving.w, BLOCK_H);
      ctx.shadowBlur = 20;
      ctx.shadowColor = s.moving.color;
      ctx.fillRect(s.moving.x, my, s.moving.w, BLOCK_H);
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); running ? drop() : reset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, drop, reset]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 font-display">
        <div>Height: <span className="text-primary font-bold text-2xl">{score}</span></div>
        <div>Best: <span className="text-warning font-bold text-2xl">{best}</span></div>
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={() => running ? drop() : reset()}
          className="cursor-pointer touch-none"
          style={{ display: 'block' }}
        />
        {!running && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="font-display text-3xl text-gradient font-bold">
              {over ? 'Tower Toppled!' : 'Stack Tower'}
            </h2>
            {over && <p className="text-xl">Height: <span className="text-primary font-bold">{score}</span></p>}
            <Button onClick={reset} variant="gaming" size="lg">
              {over ? 'Play Again' : 'Start'}
            </Button>
            <p className="text-xs text-muted-foreground">Tap or press Space to drop</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StackTower;
