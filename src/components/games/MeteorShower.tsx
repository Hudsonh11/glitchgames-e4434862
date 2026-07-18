import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const W = 360, H = 440;

const MeteorShower: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const stRef = useRef({ meteors: [] as { x: number; y: number; r: number; hp: number }[], t: 0 });

  useEffect(() => {
    if (!playing) return;
    let raf = 0; let running = true;
    const st = stRef.current;
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const shoot = (clientX: number, clientY: number) => {
      const rect = c.getBoundingClientRect();
      const x = ((clientX - rect.left) * W) / rect.width;
      const y = ((clientY - rect.top) * H) / rect.height;
      for (let i = 0; i < st.meteors.length; i++) {
        const m = st.meteors[i];
        if (Math.hypot(m.x - x, m.y - y) < m.r) {
          m.hp -= 1; playSfx('pop');
          if (m.hp <= 0) { st.meteors.splice(i, 1); setScore((s) => s + 5); }
          return;
        }
      }
      playSfx('tick');
    };
    const mc = (e: MouseEvent) => shoot(e.clientX, e.clientY);
    const tc = (e: TouchEvent) => { e.preventDefault(); shoot(e.touches[0].clientX, e.touches[0].clientY); };
    c.addEventListener('mousedown', mc);
    c.addEventListener('touchstart', tc, { passive: false });

    const loop = () => {
      if (!running) return;
      st.t += 1;
      if (st.t % 30 === 0) st.meteors.push({ x: Math.random() * W, y: -20, r: 18 + Math.random() * 12, hp: 2 });
      st.meteors.forEach((m) => (m.y += 1.5));
      ctx.fillStyle = 'hsl(230 40% 8%)';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
        ctx.fillRect((i * 37) % W, (i * 73 + st.t) % H, 1, 1);
      }
      st.meteors.forEach((m) => {
        const g = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, m.r);
        g.addColorStop(0, 'hsl(20 100% 60%)'); g.addColorStop(1, 'hsl(0 90% 30%)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      });
      for (const m of st.meteors) {
        if (m.y > H - 10) { running = false; setPlaying(false); playSfx('lose'); updateGameStats('meteor-shower', score, 0); addCoins(Math.floor(score / 3)); return; }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(raf); c.removeEventListener('mousedown', mc); c.removeEventListener('touchstart', tc); };
  }, [playing]);

  const start = () => { stRef.current = { meteors: [], t: 0 }; setScore(0); setPlaying(true); };

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Score: {score}</span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-xl border border-border touch-none" />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl">
            <Button variant="gaming" onClick={start}>{score ? 'Play Again' : 'Start'}</Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">Tap/click meteors twice to destroy them</p>
    </div>
  );
};

export default MeteorShower;
