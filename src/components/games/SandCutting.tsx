import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

interface Slice { x: number; y: number; w: number; h: number; vx: number; vy: number; a: number; va: number; hue: number; }

const HUES = [28, 200, 320, 140, 268, 48];

const SandCutting: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef({ x: 190, y: 140, w: 260, h: 170, hue: 28 });
  const slicesRef = useRef<Slice[]>([]);
  const grainsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; hue: number }[]>([]);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const trailRef = useRef<{ x: number; y: number; life: number }[]>([]);

  const [cuts, setCuts] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const W = 640, H = 420;

  const newBlock = () => {
    const hue = HUES[Math.floor(Math.random() * HUES.length)];
    blockRef.current = { x: 190, y: 130, w: 240 + Math.random() * 60, h: 160 + Math.random() * 40, hue };
    playSfx('pop');
  };

  const cutAt = (x: number) => {
    const b = blockRef.current;
    if (x < b.x + 12 || x > b.x + b.w - 12) return;
    const sliceW = x - b.x;
    for (let i = 0; i < 3; i++) {
      slicesRef.current.push({
        x: b.x, y: b.y + (b.h / 3) * i, w: sliceW, h: b.h / 3,
        vx: -40 - Math.random() * 60, vy: 20 + Math.random() * 40,
        a: 0, va: (Math.random() - 0.5) * 1.2, hue: b.hue,
      });
    }
    for (let i = 0; i < 30; i++) {
      grainsRef.current.push({
        x, y: b.y + Math.random() * b.h,
        vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 60,
        life: 0.8 + Math.random() * 0.6, hue: b.hue,
      });
    }
    b.x = x; b.w -= sliceW;
    playSfx('whoosh');
    setCuts((c) => c + 1);
    if (b.w < 40) {
      setBlocks((n) => n + 1);
      addCoins(2);
      playSfx('success');
      setTimeout(newBlock, 250);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#141a2a'); g.addColorStop(1, '#0a0d16');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // table
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(60, 300, W - 120, 20);

      const b = blockRef.current;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.filter = 'blur(6px)';
      ctx.fillRect(b.x + 6, b.y + b.h - 6, b.w, 24);
      ctx.filter = 'none';
      // block with grain texture
      const bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      bg.addColorStop(0, `hsl(${b.hue} 55% 68%)`);
      bg.addColorStop(1, `hsl(${b.hue} 50% 46%)`);
      ctx.fillStyle = bg;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = 0; i < 160; i++) {
        ctx.fillRect(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 2, 2);
      }
      ctx.strokeStyle = `hsla(${b.hue}, 80%, 85%, 0.5)`;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      slicesRef.current = slicesRef.current.filter((s) => {
        s.vy += 700 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt;
        if (s.y > 320) { s.y = 320; s.vy *= -0.2; s.vx *= 0.8; s.va *= 0.5; }
        ctx.save(); ctx.translate(s.x + s.w / 2, s.y + s.h / 2); ctx.rotate(s.a);
        ctx.fillStyle = `hsl(${s.hue} 52% 58%)`;
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.restore();
        return s.y < H + 120;
      });

      grainsRef.current = grainsRef.current.filter((p) => {
        p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `hsl(${p.hue} 60% 75%)`;
        ctx.fillRect(p.x, p.y, 2.5, 2.5);
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      trailRef.current = trailRef.current.filter((t) => {
        t.life -= dt * 2;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.fillStyle = '#e2f6ff';
        ctx.fillRect(t.x - 1, t.y - 14, 2, 28);
        ctx.globalAlpha = 1;
        return t.life > 0;
      });

      // knife
      if (dragRef.current) {
        const { x, y } = dragRef.current;
        ctx.fillStyle = 'rgba(226,246,255,0.9)';
        ctx.fillRect(x - 2, y - 90, 4, 110);
        ctx.fillStyle = '#3b4a63';
        ctx.fillRect(x - 7, y - 130, 14, 44);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">Slices {cuts}</span>
        <span className="text-accent">Blocks finished {blocks}</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={640} height={420}
          className="w-full h-auto touch-none cursor-none"
          onPointerMove={(e) => { const p = pos(e); dragRef.current = p; trailRef.current.push({ ...p, life: 1 }); }}
          onPointerLeave={() => { dragRef.current = null; }}
          onPointerDown={(e) => { const p = pos(e); dragRef.current = p; cutAt(p.x); }}
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">Slide the knife and tap to slice. No timer, no fail — just satisfying cuts.</p>
        <Button variant="outline" size="sm" onClick={() => { updateGameStats('sand-cutting', cuts * 10, 0); newBlock(); }}>New Block</Button>
      </div>
    </div>
  );
};

export default SandCutting;
