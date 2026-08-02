import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

/** Zen Garden — rake sand patterns, place stones, no fail state. */
const ZenGarden: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sandRef = useRef<HTMLCanvasElement | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const stonesRef = useRef<{ x: number; y: number; r: number; rot: number }[]>([]);
  const [tool, setTool] = useState<'rake' | 'stone'>('rake');
  const [strokes, setStrokes] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const W = 640, H = 420;

  const resetSand = useCallback(() => {
    const s = sandRef.current;
    if (!s) return;
    const c = s.getContext('2d')!;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e6d9bd'); g.addColorStop(1, '#cdbb98');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 5000; i++) c.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    stonesRef.current = [];
  }, []);

  useEffect(() => {
    const s = document.createElement('canvas');
    s.width = W; s.height = H;
    sandRef.current = s;
    resetSand();
  }, [resetSand]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = () => {
      if (sandRef.current) ctx.drawImage(sandRef.current, 0, 0);
      for (const st of stonesRef.current) {
        ctx.save();
        ctx.translate(st.x, st.y); ctx.rotate(st.rot);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(4, 6, st.r, st.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(-st.r / 3, -st.r / 3, 2, 0, 0, st.r);
        g.addColorStop(0, '#8d9198'); g.addColorStop(1, '#4a4f57');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, st.r, st.r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rake = (x: number, y: number) => {
    const s = sandRef.current;
    if (!s) return;
    const c = s.getContext('2d')!;
    const prev = lastRef.current ?? { x, y };
    const dx = x - prev.x, dy = y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    for (let i = -3; i <= 3; i++) {
      const off = i * 7;
      c.strokeStyle = i % 2 === 0 ? 'rgba(255,250,235,0.75)' : 'rgba(120,100,70,0.35)';
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(prev.x + nx * off, prev.y + ny * off);
      c.lineTo(x + nx * off, y + ny * off);
      c.stroke();
    }
    lastRef.current = { x, y };
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button variant={tool === 'rake' ? 'gaming' : 'outline'} size="sm" onClick={() => setTool('rake')}>Rake</Button>
        <Button variant={tool === 'stone' ? 'gaming' : 'outline'} size="sm" onClick={() => setTool('stone')}>Place Stone</Button>
        <Button variant="outline" size="sm" onClick={() => { resetSand(); playSfx('whoosh'); }}>Smooth Sand</Button>
        <span className="ml-auto text-sm font-bold text-primary">Strokes {strokes}</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={640} height={420}
          className="w-full h-auto touch-none cursor-crosshair"
          onPointerDown={(e) => {
            const p = pos(e);
            if (tool === 'stone') {
              stonesRef.current.push({ x: p.x, y: p.y, r: 14 + Math.random() * 16, rot: Math.random() * Math.PI });
              playSfx('tick');
            } else {
              lastRef.current = p; rake(p.x, p.y); playSfx('hover');
            }
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1 || tool !== 'rake') return;
            const p = pos(e);
            rake(p.x, p.y);
            setStrokes((s) => s + 1);
          }}
          onPointerUp={() => { lastRef.current = null; }}
          onPointerLeave={() => { lastRef.current = null; }}
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">Drag to rake ripples into the sand. Place stones anywhere. Nothing here can go wrong.</p>
        <Button variant="gaming" size="sm" onClick={() => { updateGameStats('zen-garden', strokes, 0); addCoins(Math.min(15, Math.floor(strokes / 40))); playSfx('coin'); }}>
          Save Garden
        </Button>
      </div>
    </div>
  );
};

export default ZenGarden;
