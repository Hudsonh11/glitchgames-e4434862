import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { sfx } from '@/lib/sfx';
import { Zap } from 'lucide-react';

const W = 380, H = 480;

// Plus-exclusive bullet-hell survival.
const UltraBlitz: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const st = useRef({ px: W / 2, py: H - 60, bullets: [] as { x: number; y: number; vx: number; vy: number }[], t: 0 });

  useEffect(() => {
    if (!playing) return;
    let raf = 0; let running = true;
    const s = st.current;
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const move = (clientX: number, clientY: number) => {
      const r = c.getBoundingClientRect();
      s.px = Math.max(10, Math.min(W - 10, ((clientX - r.left) * W) / r.width));
      s.py = Math.max(10, Math.min(H - 10, ((clientY - r.top) * H) / r.height));
    };
    const mm = (e: MouseEvent) => move(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); };
    c.addEventListener('mousemove', mm);
    c.addEventListener('touchmove', tm, { passive: false });

    const loop = () => {
      if (!running) return;
      s.t += 1;
      if (s.t % Math.max(6, 24 - Math.floor(score / 20)) === 0) {
        const side = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (side === 0) { x = Math.random() * W; y = -10; }
        else if (side === 1) { x = W + 10; y = Math.random() * H; }
        else if (side === 2) { x = Math.random() * W; y = H + 10; }
        else { x = -10; y = Math.random() * H; }
        const dx = s.px - x, dy = s.py - y; const d = Math.hypot(dx, dy);
        const spd = 2 + Math.min(3, score / 60);
        s.bullets.push({ x, y, vx: (dx / d) * spd, vy: (dy / d) * spd });
      }
      s.bullets.forEach((b) => { b.x += b.vx; b.y += b.vy; });
      s.bullets = s.bullets.filter((b) => b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30);

      ctx.fillStyle = 'hsl(260 40% 8%)';
      ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = 'hsl(280 50% 20%)'; ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
      // bullets
      s.bullets.forEach((b) => {
        ctx.fillStyle = 'hsl(50 100% 60%)';
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      });
      // player
      const g = ctx.createRadialGradient(s.px, s.py, 2, s.px, s.py, 14);
      g.addColorStop(0, 'hsl(320 100% 70%)'); g.addColorStop(1, 'hsl(280 100% 40%)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.px, s.py, 10, 0, Math.PI * 2); ctx.fill();

      for (const b of s.bullets) if (Math.hypot(b.x - s.px, b.y - s.py) < 13) {
        running = false; setPlaying(false); sfx.crash();
        updateGameStats('ultra-blitz', score); addCoins(score);
        return;
      }
      if (s.t % 6 === 0) setScore((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(raf); c.removeEventListener('mousemove', mm); c.removeEventListener('touchmove', tm); };
  }, [playing]);

  const start = () => { st.current = { px: W / 2, py: H - 60, bullets: [], t: 0 }; setScore(0); setPlaying(true); };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="flex items-center gap-1 text-warning text-xs font-bold"><Zap className="w-3 h-3" /> PLUS EXCLUSIVE</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-primary/40 touch-none shadow-neon-purple" />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl">
            <Button variant="gaming" onClick={start}>{score ? 'Play Again' : 'Start'}</Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">Dodge with mouse/touch — survive as long as possible</p>
    </div>
  );
};

export default UltraBlitz;
