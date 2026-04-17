import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const W = 400, H = 540;
const LANES = 5;
const LANE_W = W / LANES;

const CubeRunner: React.FC = () => {
  const { updateGameStats } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('cube-runner-best') || 0));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const stateRef = useRef({
    lane: 2,
    obstacles: [] as Array<{ lane: number; y: number; type: 'block' | 'coin' }>,
    spawnT: 0,
    speed: 4,
    t: 0,
  });

  const reset = useCallback(() => {
    stateRef.current = { lane: 2, obstacles: [], spawnT: 0, speed: 4, t: 0 };
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

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a') s.lane = Math.max(0, s.lane - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') s.lane = Math.min(LANES - 1, s.lane + 1);
    };
    let touchX = 0;
    const onTouchStart = (e: PointerEvent) => { touchX = e.clientX; };
    const onTouchEnd = (e: PointerEvent) => {
      const dx = e.clientX - touchX;
      const s = stateRef.current;
      if (dx < -20) s.lane = Math.max(0, s.lane - 1);
      if (dx > 20) s.lane = Math.min(LANES - 1, s.lane + 1);
    };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onTouchStart);
    canvas.addEventListener('pointerup', onTouchEnd);

    const loop = () => {
      const s = stateRef.current;
      s.t++;

      // spawn
      s.spawnT++;
      if (s.spawnT > Math.max(20, 50 - s.t / 60)) {
        s.spawnT = 0;
        const lane = Math.floor(Math.random() * LANES);
        const type: 'block' | 'coin' = Math.random() < 0.25 ? 'coin' : 'block';
        s.obstacles.push({ lane, y: -40, type });
      }

      // update
      s.speed = 4 + s.t / 600;
      s.obstacles.forEach(o => o.y += s.speed);
      s.obstacles = s.obstacles.filter(o => o.y < H + 40);

      // collisions
      const playerY = H - 80;
      for (const o of s.obstacles) {
        if (o.lane === s.lane && Math.abs(o.y - playerY) < 30) {
          if (o.type === 'block') {
            setRunning(false);
            setOver(true);
            const f = score;
            if (f > best) { setBest(f); localStorage.setItem('cube-runner-best', String(f)); }
            updateGameStats('cube-runner', f, Math.floor(s.t / 60));
            return;
          } else {
            o.y = 9999;
            setScore((p) => p + 10);
          }
        }
      }
      // passive scoring
      if (s.t % 10 === 0) setScore((p) => p + 1);

      // draw
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'hsl(220 40% 6%)');
      grad.addColorStop(1, 'hsl(280 50% 12%)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // road lines
      ctx.strokeStyle = 'hsl(185 100% 50% / 0.3)';
      ctx.lineWidth = 2;
      for (let i = 1; i < LANES; i++) {
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -s.t * s.speed;
        ctx.beginPath();
        ctx.moveTo(i * LANE_W, 0);
        ctx.lineTo(i * LANE_W, H);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // obstacles
      for (const o of s.obstacles) {
        const x = o.lane * LANE_W + LANE_W / 2;
        if (o.type === 'block') {
          ctx.fillStyle = 'hsl(0 85% 55%)';
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'hsl(0 85% 55%)';
          ctx.fillRect(x - 24, o.y - 24, 48, 48);
        } else {
          ctx.fillStyle = 'hsl(45 100% 55%)';
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'hsl(45 100% 55%)';
          ctx.beginPath();
          ctx.arc(x, o.y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // player
      const px = s.lane * LANE_W + LANE_W / 2;
      ctx.fillStyle = 'hsl(185 100% 50%)';
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'hsl(185 100% 50%)';
      ctx.fillRect(px - 22, playerY - 22, 44, 44);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 22, playerY - 22, 44, 44);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onTouchStart);
      canvas.removeEventListener('pointerup', onTouchEnd);
    };
  }, [running, score, best, updateGameStats]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 font-display">
        <div>Score: <span className="text-primary font-bold text-2xl">{score}</span></div>
        <div>Best: <span className="text-warning font-bold text-2xl">{best}</span></div>
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow">
        <canvas ref={canvasRef} width={W} height={H} className="touch-none" style={{ display: 'block' }} />
        {!running && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <h2 className="font-display text-3xl text-gradient font-bold">
              {over ? 'Crashed!' : 'Cube Runner'}
            </h2>
            {over && <p className="text-xl">Score: <span className="text-primary font-bold">{score}</span></p>}
            <Button onClick={reset} variant="gaming" size="lg">{over ? 'Play Again' : 'Start'}</Button>
            <p className="text-xs text-muted-foreground">Arrow keys or swipe to switch lanes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CubeRunner;
