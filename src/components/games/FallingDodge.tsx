import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const W = 320, H = 420;

const FallingDodge: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const stateRef = useRef({ x: W / 2, blocks: [] as { x: number; y: number; s: number }[], t: 0 });

  useEffect(() => {
    if (!playing) return;
    let raf = 0; let running = true;
    const s = stateRef.current;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') s.x = Math.max(15, s.x - 20);
      if (e.key === 'ArrowRight') s.x = Math.min(W - 15, s.x + 20);
    };
    window.addEventListener('keydown', key);
    const move = (clientX: number) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      s.x = Math.max(15, Math.min(W - 15, ((clientX - rect.left) * W) / rect.width));
    };
    const c = canvasRef.current!;
    const mm = (e: MouseEvent) => move(e.clientX);
    const tm = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX); };
    c.addEventListener('mousemove', mm);
    c.addEventListener('touchmove', tm, { passive: false });

    const loop = () => {
      if (!running) return;
      s.t += 1;
      if (s.t % 15 === 0) s.blocks.push({ x: Math.random() * (W - 30) + 15, y: -20, s: 15 + Math.random() * 10 });
      s.blocks.forEach((b) => (b.y += 3 + score / 20));
      s.blocks = s.blocks.filter((b) => b.y < H + 30);

      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'hsl(230 30% 10%)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'hsl(185 100% 50%)';
      ctx.beginPath(); ctx.arc(s.x, H - 30, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'hsl(0 100% 60%)';
      s.blocks.forEach((b) => ctx.fillRect(b.x - b.s / 2, b.y - b.s / 2, b.s, b.s));

      for (const b of s.blocks) {
        const dx = b.x - s.x, dy = b.y - (H - 30);
        if (Math.hypot(dx, dy) < 14 + b.s / 2) {
          running = false; setPlaying(false); playSfx('crash');
          updateGameStats('falling-dodge', score, 0); addCoins(Math.floor(score / 4));
          return;
        }
      }
      if (s.t % 6 === 0) setScore((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); c.removeEventListener('mousemove', mm); c.removeEventListener('touchmove', tm); };
  }, [playing]);

  const start = () => { stateRef.current = { x: W / 2, blocks: [], t: 0 }; setScore(0); setPlaying(true); };

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-border bg-muted/40 touch-none" />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
            <Button variant="gaming" onClick={start}>{score ? 'Play Again' : 'Start'}</Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">Arrow keys, mouse, or drag</p>
    </div>
  );
};

export default FallingDodge;
