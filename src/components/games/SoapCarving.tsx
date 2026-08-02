import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

/**
 * Soap Carving (Glitch Games Plus exclusive)
 * Carve away soap pixels with a chisel to reveal a hidden shape underneath.
 * Purely relaxing — accuracy simply scores higher.
 */
const SHAPES = [
  { name: 'Heart', fn: (x: number, y: number) => { const a = (x - 0.5) * 2.3, b = -(y - 0.52) * 2.3; const t = a * a + b * b - 1; return t * t * t - a * a * b * b * b < 0; } },
  { name: 'Star', fn: (x: number, y: number) => { const dx = x - 0.5, dy = y - 0.5; const ang = Math.atan2(dy, dx); const r = Math.hypot(dx, dy); const k = 0.22 + 0.14 * Math.cos(5 * ang); return r < k; } },
  { name: 'Moon', fn: (x: number, y: number) => Math.hypot(x - 0.5, y - 0.5) < 0.3 && Math.hypot(x - 0.66, y - 0.44) > 0.28 },
  { name: 'Diamond', fn: (x: number, y: number) => Math.abs(x - 0.5) + Math.abs(y - 0.5) < 0.32 },
];

const SoapCarving: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soapRef = useRef<HTMLCanvasElement | null>(null);
  const shavingsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const [shape, setShape] = useState(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  const [carved, setCarved] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [hue, setHue] = useState(320);
  const { updateGameStats, addCoins } = useGame();
  const W = 480, H = 380;
  const BX = 90, BY = 50, BW = 300, BH = 280;

  const mask = useMemo(() => shape, [shape]);

  const resetSoap = () => {
    const s = soapRef.current;
    if (!s) return;
    const c = s.getContext('2d')!;
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(BX, BY, BX + BW, BY + BH);
    g.addColorStop(0, `hsl(${hue} 60% 82%)`);
    g.addColorStop(1, `hsl(${(hue + 30) % 360} 55% 62%)`);
    c.fillStyle = g;
    c.fillRect(BX, BY, BW, BH);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 900; i++) c.fillRect(BX + Math.random() * BW, BY + Math.random() * BH, 2, 2);
    setCarved(0); setAccuracy(100);
  };

  useEffect(() => {
    const s = document.createElement('canvas');
    s.width = W; s.height = H;
    soapRef.current = s;
    resetSoap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { resetSoap(); }, [hue, shape]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const bg = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, W);
      bg.addColorStop(0, '#171326'); bg.addColorStop(1, '#080611');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // target outline guide
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        let lo = 0, hi = 0.55;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          if (mask.fn(0.5 + Math.cos(a) * mid, 0.5 + Math.sin(a) * mid)) lo = mid; else hi = mid;
        }
        const px = BX + (0.5 + Math.cos(a) * lo) * BW;
        const py = BY + (0.5 + Math.sin(a) * lo) * BH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]);

      if (soapRef.current) ctx.drawImage(soapRef.current, 0, 0);

      shavingsRef.current = shavingsRef.current.filter((s) => {
        s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = `hsl(${hue} 70% 88%)`;
        ctx.fillRect(s.x, s.y, 3, 2);
        ctx.globalAlpha = 1;
        return s.life > 0;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mask, hue]);

  const carve = (x: number, y: number) => {
    const s = soapRef.current;
    if (!s) return;
    const c = s.getContext('2d')!;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.fill();
    c.restore();
    for (let i = 0; i < 4; i++) {
      shavingsRef.current.push({ x, y, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 120, life: 0.6 });
    }
    const nx = (x - BX) / BW, ny = (y - BY) / BH;
    const insideShape = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1 && mask.fn(nx, ny);
    setCarved((n) => n + 1);
    if (insideShape) setAccuracy((a) => Math.max(0, a - 1.5));
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const finish = () => {
    const score = Math.round(accuracy * 10 + Math.min(300, carved));
    updateGameStats('soap-carving', score, 0);
    addCoins(Math.floor(score / 40));
    playSfx('win');
    setShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">Carve: {mask.name}</span>
        <span className="text-warning">Precision {Math.round(accuracy)}%</span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={480} height={380}
          className="w-full h-auto touch-none cursor-crosshair"
          onPointerDown={(e) => { const p = pos(e); carve(p.x, p.y); playSfx('hover'); }}
          onPointerMove={(e) => { if (e.buttons !== 1) return; const p = pos(e); carve(p.x, p.y); }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={() => { setHue((h) => (h + 61) % 360); playSfx('click'); }}>New Soap Colour</Button>
        <Button variant="outline" size="sm" onClick={resetSoap}>Restart Block</Button>
        <Button variant="gaming" size="sm" onClick={finish}>Finish Carving</Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Shave the soap away from the dotted outline. Cutting inside the shape lowers precision.</p>
    </div>
  );
};

export default SoapCarving;
