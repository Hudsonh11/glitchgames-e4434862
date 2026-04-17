import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const W = 360, H = 540;

const DoodleJump: React.FC = () => {
  const { updateGameStats } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('doodle-jump-best') || 0));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const stateRef = useRef({
    px: W / 2, py: H - 100, vx: 0, vy: 0,
    platforms: [] as Array<{ x: number; y: number; w: number; type: 'normal' | 'spring' | 'broken' }>,
    cameraY: 0,
    maxHeight: 0,
    t: 0,
  });

  const buildPlatforms = () => {
    const arr: typeof stateRef.current.platforms = [{ x: W / 2 - 35, y: H - 50, w: 70, type: 'normal' }];
    for (let i = 1; i < 200; i++) {
      const y = H - 50 - i * 60 - Math.random() * 30;
      const x = Math.random() * (W - 70);
      const r = Math.random();
      const type: 'normal' | 'spring' | 'broken' = r < 0.08 ? 'spring' : r < 0.18 && i > 4 ? 'broken' : 'normal';
      arr.push({ x, y, w: 70, type });
    }
    return arr;
  };

  const reset = useCallback(() => {
    stateRef.current = {
      px: W / 2, py: H - 100, vx: 0, vy: -10,
      platforms: buildPlatforms(),
      cameraY: 0,
      maxHeight: 0,
      t: 0,
    };
    setScore(0);
    setOver(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const keys = { l: false, r: false };

    const onKD = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.r = true;
    };
    const onKU = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.r = false;
    };
    let touching = false, tx = 0;
    const onPD = (e: PointerEvent) => { touching = true; tx = e.clientX; };
    const onPM = (e: PointerEvent) => {
      if (!touching) return;
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      stateRef.current.px = (localX / rect.width) * W;
    };
    const onPU = () => { touching = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    canvas.addEventListener('pointerdown', onPD);
    canvas.addEventListener('pointermove', onPM);
    canvas.addEventListener('pointerup', onPU);
    canvas.addEventListener('pointerleave', onPU);

    const loop = () => {
      const s = stateRef.current;
      s.t++;

      // input
      if (keys.l) s.vx = -5;
      else if (keys.r) s.vx = 5;
      else s.vx *= 0.85;

      // physics
      s.vy += 0.4;
      s.px += s.vx;
      s.py += s.vy;

      // wrap horizontally
      if (s.px < -20) s.px = W + 20;
      if (s.px > W + 20) s.px = -20;

      // platform collision (only when falling)
      if (s.vy > 0) {
        for (const p of s.platforms) {
          if (s.px + 16 > p.x && s.px - 16 < p.x + p.w &&
              s.py + 20 > p.y && s.py + 20 < p.y + 12) {
            if (p.type === 'broken') continue;
            s.vy = p.type === 'spring' ? -18 : -11;
            if (p.type === 'broken') p.y = 99999;
          }
        }
      }

      // camera follows up
      const targetCam = s.py - H * 0.5;
      if (targetCam < s.cameraY) s.cameraY = targetCam;

      // score by max height
      const height = Math.floor(-s.cameraY / 10);
      if (height > s.maxHeight) {
        s.maxHeight = height;
        setScore(height);
      }

      // game over: fell below screen
      if (s.py - s.cameraY > H + 50) {
        setRunning(false);
        setOver(true);
        const f = s.maxHeight;
        if (f > best) { setBest(f); localStorage.setItem('doodle-jump-best', String(f)); }
        updateGameStats('doodle-jump', f, Math.floor(s.t / 60));
        return;
      }

      // draw
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'hsl(280 60% 15%)');
      grad.addColorStop(1, 'hsl(220 50% 8%)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // platforms
      for (const p of s.platforms) {
        const py = p.y - s.cameraY;
        if (py < -20 || py > H + 20) continue;
        const color = p.type === 'spring' ? 'hsl(45 100% 55%)' : p.type === 'broken' ? 'hsl(0 70% 50%)' : 'hsl(142 76% 50%)';
        ctx.fillStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fillRect(p.x, py, p.w, 12);
        ctx.shadowBlur = 0;
        if (p.type === 'spring') {
          ctx.fillStyle = 'white';
          ctx.fillRect(p.x + p.w / 2 - 8, py - 6, 16, 6);
        }
      }

      // player (doodle)
      const py = s.py - s.cameraY;
      ctx.fillStyle = 'hsl(185 100% 60%)';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'hsl(185 100% 60%)';
      ctx.beginPath();
      ctx.arc(s.px, py, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(s.px - 6, py - 4, 4, 0, Math.PI * 2);
      ctx.arc(s.px + 6, py - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(s.px - 6 + (keys.l ? -1 : keys.r ? 1 : 0), py - 4, 2, 0, Math.PI * 2);
      ctx.arc(s.px + 6 + (keys.l ? -1 : keys.r ? 1 : 0), py - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      canvas.removeEventListener('pointerdown', onPD);
      canvas.removeEventListener('pointermove', onPM);
      canvas.removeEventListener('pointerup', onPU);
      canvas.removeEventListener('pointerleave', onPU);
    };
  }, [running, best, updateGameStats]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 font-display">
        <div>Height: <span className="text-primary font-bold text-2xl">{score}</span></div>
        <div>Best: <span className="text-warning font-bold text-2xl">{best}</span></div>
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow">
        <canvas ref={canvasRef} width={W} height={H} className="touch-none" style={{ display: 'block' }} />
        {!running && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="font-display text-3xl text-gradient font-bold">
              {over ? 'You Fell!' : 'Doodle Jump'}
            </h2>
            {over && <p className="text-xl">Height: <span className="text-primary font-bold">{score}</span></p>}
            <Button onClick={reset} variant="gaming" size="lg">{over ? 'Play Again' : 'Start'}</Button>
            <p className="text-xs text-muted-foreground">Arrow keys or drag to move</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoodleJump;
