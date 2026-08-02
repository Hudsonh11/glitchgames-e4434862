import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

interface Speck { x: number; y: number; r: number; a: number; hue: number; }

/** Pressure Wash — scrub grime off a dirty surface until it gleams. */
const PressureWash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grimeRef = useRef<HTMLCanvasElement | null>(null);
  const spraysRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const pointerRef = useRef<{ x: number; y: number; down: boolean }>({ x: -99, y: -99, down: false });
  const [clean, setClean] = useState(0);
  const [surface, setSurface] = useState(0);
  const [surfacesDone, setSurfacesDone] = useState(0);
  const { updateGameStats, addCoins } = useGame();
  const W = 640, H = 420;

  const SURFACES = [
    { name: 'Brick Wall', base: ['#8b4a3a', '#6d382c'] },
    { name: 'Stone Patio', base: ['#7d8189', '#5c6068'] },
    { name: 'Wood Deck', base: ['#a2703f', '#7a5330'] },
    { name: 'Tile Floor', base: ['#5d7f96', '#435d70'] },
  ];

  const buildGrime = () => {
    const g = grimeRef.current;
    if (!g) return;
    const c = g.getContext('2d')!;
    c.clearRect(0, 0, W, H);
    const specks: Speck[] = [];
    for (let i = 0; i < 2600; i++) {
      specks.push({ x: Math.random() * W, y: Math.random() * H, r: 3 + Math.random() * 12, a: 0.05 + Math.random() * 0.18, hue: 60 + Math.random() * 40 });
    }
    for (const s of specks) {
      c.fillStyle = `hsla(${s.hue}, 25%, 18%, ${s.a})`;
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill();
    }
    setClean(0);
  };

  useEffect(() => {
    const g = document.createElement('canvas');
    g.width = W; g.height = H;
    grimeRef.current = g;
    buildGrime();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { buildGrime(); }, [surface]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, last = performance.now(), sampleAcc = 0;
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const s = SURFACES[surface];
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, s.base[0]); bg.addColorStop(1, s.base[1]);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // surface pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
      for (let y = 0; y < H; y += 34) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        const off = (y / 34) % 2 === 0 ? 0 : 40;
        for (let x = off; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, W, 60);

      if (grimeRef.current) ctx.drawImage(grimeRef.current, 0, 0);

      const ptr = pointerRef.current;
      if (ptr.down && grimeRef.current) {
        const gc = grimeRef.current.getContext('2d')!;
        gc.save();
        gc.globalCompositeOperation = 'destination-out';
        gc.beginPath(); gc.arc(ptr.x, ptr.y, 26, 0, Math.PI * 2); gc.fill();
        gc.restore();
        for (let i = 0; i < 6; i++) {
          spraysRef.current.push({ x: ptr.x, y: ptr.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.35 });
        }
      }

      spraysRef.current = spraysRef.current.filter((p) => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = '#dff6ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      // nozzle indicator
      if (ptr.x > 0) {
        ctx.strokeStyle = 'rgba(180,240,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 26, 0, Math.PI * 2); ctx.stroke();
      }

      // sample cleanliness periodically
      sampleAcc += dt;
      if (sampleAcc > 0.4 && grimeRef.current) {
        sampleAcc = 0;
        const gc = grimeRef.current.getContext('2d')!;
        const data = gc.getImageData(0, 0, W, H).data;
        let dirty = 0, total = 0;
        for (let i = 3; i < data.length; i += 4 * 97) { total++; if (data[i] > 12) dirty++; }
        const pct = Math.round((1 - dirty / Math.max(1, total)) * 100);
        setClean(pct);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [surface]);

  useEffect(() => {
    if (clean >= 99) {
      playSfx('win');
      addCoins(6);
      setSurfacesDone((n) => n + 1);
      updateGameStats('pressure-wash', (surfacesDone + 1) * 120, 0);
      const t = setTimeout(() => setSurface((s) => (s + 1) % SURFACES.length), 900);
      return () => clearTimeout(t);
    }
  }, [clean]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3">
      <div className="flex items-center justify-between mb-3 text-sm font-bold">
        <span className="text-primary">{SURFACES[surface].name}</span>
        <span className="text-accent">Clean {clean}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${clean}%` }} />
      </div>
      <div className="rounded-xl overflow-hidden border border-border">
        <canvas
          ref={canvasRef} width={640} height={420}
          className="w-full h-auto touch-none cursor-none"
          onPointerDown={(e) => { const p = pos(e); pointerRef.current = { ...p, down: true }; playSfx('whoosh'); }}
          onPointerMove={(e) => { const p = pos(e); pointerRef.current = { ...p, down: pointerRef.current.down }; }}
          onPointerUp={() => { pointerRef.current.down = false; }}
          onPointerLeave={() => { pointerRef.current = { x: -99, y: -99, down: false }; }}
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">Hold and sweep the nozzle. Reach 100% for a brand new surface.</p>
        <Button variant="outline" size="sm" onClick={() => setSurface((s) => (s + 1) % SURFACES.length)}>Next Surface</Button>
      </div>
    </div>
  );
};

export default PressureWash;
