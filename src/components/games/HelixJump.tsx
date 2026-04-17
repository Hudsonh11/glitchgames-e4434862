import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const W = 360, H = 540;

const HelixJump: React.FC = () => {
  const { updateGameStats } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('helix-jump-best') || 0));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const stateRef = useRef({
    ballY: 80,
    vy: 0,
    rotation: 0,
    rotVel: 0,
    levels: [] as Array<{ y: number; gaps: Array<[number, number]>; danger: boolean }>,
    cameraY: 0,
    t: 0,
  });

  const buildLevels = () => {
    const arr: typeof stateRef.current.levels = [];
    for (let i = 1; i < 50; i++) {
      const gapCount = 1 + Math.floor(Math.random() * 2);
      const gaps: Array<[number, number]> = [];
      for (let g = 0; g < gapCount; g++) {
        const start = Math.random() * 360;
        gaps.push([start, start + 60 + Math.random() * 40]);
      }
      arr.push({ y: i * 110, gaps, danger: Math.random() < 0.18 });
    }
    return arr;
  };

  const reset = useCallback(() => {
    stateRef.current = {
      ballY: 80,
      vy: 0,
      rotation: 0,
      rotVel: 0,
      levels: buildLevels(),
      cameraY: 0,
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
    const keys = { left: false, right: false };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    };
    let pointerStart = 0;
    const onPointerDown = (e: PointerEvent) => { pointerStart = e.clientX; };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pressure > 0 || e.buttons > 0) {
        const dx = e.clientX - pointerStart;
        stateRef.current.rotVel = dx * 0.05;
        pointerStart = e.clientX;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    const loop = () => {
      const s = stateRef.current;
      s.t++;

      // input
      if (keys.left) s.rotVel -= 0.6;
      if (keys.right) s.rotVel += 0.6;
      s.rotVel *= 0.85;
      s.rotation = (s.rotation + s.rotVel + 360) % 360;

      // physics
      s.vy += 0.45;
      s.ballY += s.vy;
      if (s.vy > 12) s.vy = 12;

      // collision with levels
      const ballScreenY = s.ballY - s.cameraY;
      for (const level of s.levels) {
        const ly = level.y - s.cameraY;
        if (Math.abs(ballScreenY + 12 - ly) < 8 && s.vy > 0) {
          // check if rotation falls in any gap
          const r = s.rotation;
          const inGap = level.gaps.some(([a, b]) => {
            const start = (a + s.rotation) % 360;
            const end = (b + s.rotation) % 360;
            return start < end ? r >= start && r <= end : r >= start || r <= end;
          });
          if (inGap) {
            if (level.danger) {
              setRunning(false);
              setOver(true);
              const f = score;
              if (f > best) { setBest(f); localStorage.setItem('helix-jump-best', String(f)); }
              updateGameStats('helix-jump', f, Math.floor(s.t / 60));
              return;
            } else {
              s.ballY = level.y - 14;
              s.vy = -8;
              setScore((p) => p + 1);
            }
          } else {
            s.ballY = level.y - 14;
            s.vy = -8;
          }
        }
      }

      // camera
      const targetCam = s.ballY - 180;
      s.cameraY += (targetCam - s.cameraY) * 0.1;

      // draw
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'hsl(220 40% 8%)');
      grad.addColorStop(1, 'hsl(280 50% 4%)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // central pole
      ctx.fillStyle = 'hsl(280 30% 25%)';
      ctx.fillRect(W / 2 - 8, 0, 16, H);

      // levels (as horizontal discs with gaps)
      const cx = W / 2;
      for (const level of s.levels) {
        const ly = level.y - s.cameraY;
        if (ly < -20 || ly > H + 20) continue;
        // draw disc as rectangle with gap cutouts
        const segments = 24;
        for (let i = 0; i < segments; i++) {
          const angA = (i / segments) * 360;
          const screenAng = (angA + s.rotation) % 360;
          const inGap = level.gaps.some(([a, b]) => angA >= a && angA <= b);
          if (inGap) continue;
          const xL = cx + Math.cos((screenAng - 90) * Math.PI / 180) * 130;
          ctx.fillStyle = level.danger ? 'hsl(0 90% 55%)' : 'hsl(185 100% 50%)';
          ctx.fillRect(xL - 8, ly - 6, 16, 12);
        }
      }

      // ball
      const by = s.ballY - s.cameraY;
      ctx.fillStyle = 'hsl(45 100% 60%)';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'hsl(45 100% 60%)';
      ctx.beginPath();
      ctx.arc(cx, by, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
    };
  }, [running, score, best, updateGameStats]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 font-display">
        <div>Score: <span className="text-primary font-bold text-2xl">{score}</span></div>
        <div>Best: <span className="text-warning font-bold text-2xl">{best}</span></div>
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow">
        <canvas ref={canvasRef} width={W} height={H} className="cursor-pointer touch-none" style={{ display: 'block' }} />
        {!running && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="font-display text-3xl text-gradient font-bold">
              {over ? 'Game Over!' : 'Helix Jump'}
            </h2>
            {over && <p className="text-xl">Score: <span className="text-primary font-bold">{score}</span></p>}
            <Button onClick={reset} variant="gaming" size="lg">{over ? 'Play Again' : 'Start'}</Button>
            <p className="text-xs text-muted-foreground">Drag/Arrow keys to rotate, avoid red zones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelixJump;
