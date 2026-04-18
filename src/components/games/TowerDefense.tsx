import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { Coins, Heart, RotateCcw } from 'lucide-react';

const W = 600, H = 400;
const PATH = [
  { x: 0, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 200 },
  { x: 400, y: 200 }, { x: 400, y: 320 }, { x: 600, y: 320 },
];
const TOWER_COST = 50;
const TOWER_RANGE = 90;

interface Enemy { x: number; y: number; seg: number; t: number; hp: number; max: number; speed: number; }
interface Tower { x: number; y: number; cd: number; }
interface Bullet { x: number; y: number; tx: number; ty: number; }

const TowerDefense: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateGameStats } = useGame();
  const [coins, setCoins] = useState(100);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [over, setOver] = useState(false);
  const stateRef = useRef({
    enemies: [] as Enemy[], towers: [] as Tower[], bullets: [] as Bullet[],
    spawn: 0, spawned: 0, waveSize: 5, coins: 100, lives: 20, wave: 1,
  });

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0;

    const segLen = (i: number) => Math.hypot(PATH[i + 1].x - PATH[i].x, PATH[i + 1].y - PATH[i].y);

    const loop = () => {
      const s = stateRef.current;
      // Spawn
      s.spawn--;
      if (s.spawn <= 0 && s.spawned < s.waveSize) {
        s.enemies.push({ x: 0, y: 80, seg: 0, t: 0, hp: 30 + s.wave * 10, max: 30 + s.wave * 10, speed: 0.8 + s.wave * 0.1 });
        s.spawned++;
        s.spawn = 60;
      }
      if (s.spawned >= s.waveSize && s.enemies.length === 0) {
        s.wave++; s.spawned = 0; s.waveSize = 5 + s.wave * 2; s.coins += 30;
        setWave(s.wave); setCoins(s.coins);
      }

      // Move enemies
      s.enemies = s.enemies.filter(e => {
        if (e.seg >= PATH.length - 1) {
          s.lives--; setLives(s.lives);
          if (s.lives <= 0) { setOver(true); updateGameStats('tower-defense', s.wave * 100, 90); cancelAnimationFrame(raf); }
          return false;
        }
        const len = segLen(e.seg);
        e.t += e.speed / len;
        if (e.t >= 1) { e.t = 0; e.seg++; if (e.seg >= PATH.length - 1) return e.hp > 0 ? true : false; }
        e.x = PATH[e.seg].x + (PATH[e.seg + 1].x - PATH[e.seg].x) * e.t;
        e.y = PATH[e.seg].y + (PATH[e.seg + 1].y - PATH[e.seg].y) * e.t;
        return e.hp > 0;
      });

      // Towers shoot
      s.towers.forEach(t => {
        t.cd--;
        if (t.cd <= 0) {
          const target = s.enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) < TOWER_RANGE);
          if (target) {
            s.bullets.push({ x: t.x, y: t.y, tx: target.x, ty: target.y });
            t.cd = 30;
          }
        }
      });

      // Bullets
      s.bullets = s.bullets.filter(b => {
        const dx = b.tx - b.x, dy = b.ty - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          const e = s.enemies.find(en => Math.hypot(en.x - b.tx, en.y - b.ty) < 15);
          if (e) {
            e.hp -= 15;
            if (e.hp <= 0) { s.coins += 10; setCoins(s.coins); }
          }
          return false;
        }
        b.x += (dx / d) * 8;
        b.y += (dy / d) * 8;
        return true;
      });

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);
      // Path
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      PATH.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      // Towers
      s.towers.forEach(t => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(t.x, t.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(59,130,246,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(t.x, t.y, TOWER_RANGE, 0, Math.PI * 2); ctx.stroke();
      });
      // Enemies
      s.enemies.forEach(e => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.fillRect(e.x - 12, e.y - 18, 24 * (e.hp / e.max), 3);
      });
      // Bullets
      ctx.fillStyle = '#fbbf24';
      s.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const click = (ev: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (W / rect.width);
      const y = (ev.clientY - rect.top) * (H / rect.height);
      // Don't allow on path
      const onPath = PATH.some((p, i) => i < PATH.length - 1 && Math.hypot(x - (p.x + PATH[i+1].x)/2, y - (p.y + PATH[i+1].y)/2) < 30);
      if (onPath) return;
      const s = stateRef.current;
      if (s.coins >= TOWER_COST) {
        s.towers.push({ x, y, cd: 0 });
        s.coins -= TOWER_COST;
        setCoins(s.coins);
      }
    };
    c.addEventListener('click', click);
    return () => { cancelAnimationFrame(raf); c.removeEventListener('click', click); };
  }, [updateGameStats]);

  const restart = () => window.location.reload();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6 font-bold">
        <span className="flex items-center gap-1"><Coins className="w-4 h-4 text-warning" />{coins}</span>
        <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-500" />{lives}</span>
        <span>Wave {wave}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="rounded-xl border border-border cursor-crosshair max-w-full" />
      <p className="text-xs text-muted-foreground">Click anywhere off the path to place a tower (50 coins)</p>
      {over && (
        <div className="text-center">
          <p className="font-bold mb-2">Game Over — Wave {wave}</p>
          <Button variant="gaming" onClick={restart}><RotateCcw className="w-4 h-4 mr-1" />Restart</Button>
        </div>
      )}
    </div>
  );
};

export default TowerDefense;
