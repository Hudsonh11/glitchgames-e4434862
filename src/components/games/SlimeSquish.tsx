import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

/** Slime Squish — press and drag to deform a soft-body blob with spring physics. */
const SlimeSquish: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number; ox: number; oy: number; vx: number; vy: number }[]>([]);
  const pointerRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const sparkRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const [hue, setHue] = useState(150);
  const [squishes, setSquishes] = useState(0);
  const { updateGameStats, addCoins } = useGame();

  const W = 480, H = 380, N = 48, R = 110;

  useEffect(() => {
    pointsRef.current = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const x = W / 2 + Math.cos(a) * R;
      const y = H / 2 + Math.sin(a) * R;
      return { x, y, ox: x, oy: y, vx: 0, vy: 0 };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const pts = pointsRef.current;
      const ptr = pointerRef.current;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // spring back to rest shape
        p.vx += (p.ox - p.x) * 28 * dt;
        p.vy += (p.oy - p.y) * 28 * dt;
        // neighbour smoothing keeps the blob cohesive
        const a = pts[(i - 1 + pts.length) % pts.length];
        const b = pts[(i + 1) % pts.length];
        p.vx += ((a.x + b.x) / 2 - p.x) * 18 * dt;
        p.vy += ((a.y + b.y) / 2 - p.y) * 18 * dt;
        if (ptr.down) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 130) {
            const f = (1 - d / 130) * 900;
            p.vx += (dx / d) * f * dt;
            p.vy += (dy / d) * f * dt;
          }
        }
        p.vx *= 0.9; p.vy *= 0.9;
        p.x += p.vx * dt * 60 * 0.5; p.y += p.vy * dt * 60 * 0.5;
      }

      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W / 1.4);
      bg.addColorStop(0, `hsl(${hue} 30% 12%)`); bg.addColorStop(1, '#05070d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // blob
      ctx.beginPath();
      ctx.moveTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      for (let i = 1; i <= pts.length; i++) {
        const c = pts[i % pts.length];
        const n = pts[(i + 1) % pts.length];
        ctx.quadraticCurveTo(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2);
      }
      ctx.closePath();
      const g = ctx.createRadialGradient(W / 2 - 40, H / 2 - 50, 20, W / 2, H / 2, R * 1.6);
      g.addColorStop(0, `hsla(${hue}, 95%, 78%, 0.95)`);
      g.addColorStop(0.6, `hsla(${hue}, 85%, 55%, 0.9)`);
      g.addColorStop(1, `hsla(${(hue + 40) % 360}, 80%, 35%, 0.9)`);
      ctx.fillStyle = g;
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0;
      // gloss
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(W / 2 - 35, H / 2 - 55, 34, 18, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.ellipse(W / 2 + 40, H / 2 + 45, 22, 12, 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      sparkRef.current = sparkRef.current.filter((s) => {
        s.vy += 400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = `hsl(${hue} 100% 85%)`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        return s.life > 0;
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hue]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  return (
    <div className="w-full max-w-lg mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">Squishes {squishes}</span>
        <span className="text-muted-foreground text-xs">Press, hold and drag the slime</span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={480} height={380}
          className="w-full h-auto touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            const p = pos(e); pointerRef.current = { ...p, down: true };
            setSquishes((s) => s + 1); playSfx('pop');
            for (let i = 0; i < 10; i++) sparkRef.current.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 180, life: 0.7 });
          }}
          onPointerMove={(e) => { const p = pos(e); pointerRef.current = { ...p, down: pointerRef.current.down }; }}
          onPointerUp={() => { pointerRef.current.down = false; playSfx('hover'); }}
          onPointerLeave={() => { pointerRef.current.down = false; }}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => { setHue((h) => (h + 53) % 360); playSfx('click'); }}>Change Colour</Button>
        <Button variant="gaming" size="sm" onClick={() => { updateGameStats('slime-squish', squishes * 5, 0); addCoins(Math.min(20, Math.floor(squishes / 5))); playSfx('coin'); }}>
          Bank Relaxation
        </Button>
      </div>
    </div>
  );
};

export default SlimeSquish;
