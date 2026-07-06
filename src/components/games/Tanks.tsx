import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Trophy, RefreshCw, Crosshair } from 'lucide-react';
import { playSfx } from '@/lib/sfx';
import { useGame } from '@/contexts/GameContext';

interface TanksProps {
  onScoreUpdate?: (score: number) => void;
}

/* ─────────── constants ─────────── */
const ARENA_W = 720;
const ARENA_H = 480;
const CELL = 40;
const TANK_SIZE = 26;
const BULLET_R = 4;
const BULLET_SPEED = 3.6;
const TANK_SPEED = 1.7;
const HITS_TO_WIN = 5;
const MAX_BOUNCES = 3;
const BULLET_LIFE_MS = 5000;
const FIRE_COOLDOWN_MS = 520;

type Vec = { x: number; y: number };
type Tank = {
  id: 1 | 2;
  pos: Vec;
  angle: number;
  color: string;
  accent: string;
  score: number;
  alive: boolean;
  respawnAt: number;
  lastFire: number;
  muzzleFlash: number;
  trail: { x: number; y: number; a: number }[];
  input: { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean; targetAngle: number | null };
};
type Bullet = {
  id: number;
  owner: 1 | 2;
  pos: Vec;
  vel: Vec;
  bounces: number;
  bornAt: number;
};
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type Wall = { x: number; y: number; w: number; h: number };
type Mode = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

/* ─────────── map ─────────── */
function buildMap(): Wall[] {
  const walls: Wall[] = [];
  walls.push({ x: 0, y: 0, w: ARENA_W, h: 10 });
  walls.push({ x: 0, y: ARENA_H - 10, w: ARENA_W, h: 10 });
  walls.push({ x: 0, y: 0, w: 10, h: ARENA_H });
  walls.push({ x: ARENA_W - 10, y: 0, w: 10, h: ARENA_H });
  const count = 9 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const w = CELL * (1 + Math.floor(Math.random() * 3));
    const h = CELL * (1 + Math.floor(Math.random() * 3));
    const x = CELL + Math.floor(Math.random() * ((ARENA_W - w - CELL * 2) / CELL)) * CELL;
    const y = CELL + Math.floor(Math.random() * ((ARENA_H - h - CELL * 2) / CELL)) * CELL;
    if (x < 110 && y < 110) continue;
    if (x > ARENA_W - 140 && y > ARENA_H - 140) continue;
    walls.push({ x, y, w, h });
  }
  return walls;
}

function circleRect(cx: number, cy: number, r: number, w: Wall) {
  const cx2 = Math.max(w.x, Math.min(cx, w.x + w.w));
  const cy2 = Math.max(w.y, Math.min(cy, w.y + w.h));
  const dx = cx - cx2, dy = cy - cy2;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return { hit: false, nx: 0, ny: 0 };
  const d = Math.sqrt(d2) || 1;
  return { hit: true, nx: dx / d, ny: dy / d };
}
function tankBlocked(pos: Vec, walls: Wall[]) {
  const half = TANK_SIZE / 2;
  for (const w of walls) {
    if (pos.x - half < w.x + w.w && pos.x + half > w.x && pos.y - half < w.y + w.h && pos.y + half > w.y) return true;
  }
  return false;
}
function losClear(a: Vec, b: Vec, walls: Wall[]) {
  const steps = 24;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    for (const w of walls) {
      if (px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h) return false;
    }
  }
  return true;
}

/* ─────────── component ─────────── */
const Tanks: React.FC<TanksProps> = ({ onScoreUpdate }) => {
  const { addCoins } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('menu');
  const [twoPlayer, setTwoPlayer] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);

  const stateRef = useRef<{
    tanks: [Tank, Tank];
    bullets: Bullet[];
    particles: Particle[];
    walls: Wall[];
    bulletId: number;
    aiPlan: { move: number; strafe: number; nextThink: number; lastShot: number };
    shake: number;
  }>({
    tanks: [] as unknown as [Tank, Tank],
    bullets: [],
    particles: [],
    walls: [],
    bulletId: 0,
    aiPlan: { move: 1, strafe: 0, nextThink: 0, lastShot: 0 },
    shake: 0,
  });

  const makeTank = (id: 1 | 2, prevScore: number): Tank => ({
    id,
    pos: id === 1 ? { x: 70, y: 70 } : { x: ARENA_W - 70, y: ARENA_H - 70 },
    angle: id === 1 ? 0 : Math.PI,
    color: id === 1 ? '#22d3ee' : '#f43f5e',
    accent: id === 1 ? '#0891b2' : '#be123c',
    score: prevScore,
    alive: true,
    respawnAt: 0,
    lastFire: 0,
    muzzleFlash: 0,
    trail: [],
    input: { up: false, down: false, left: false, right: false, fire: false, targetAngle: null },
  });

  const initRound = useCallback((resetScore: boolean) => {
    stateRef.current.walls = buildMap();
    stateRef.current.tanks = [makeTank(1, resetScore ? 0 : scores[0]), makeTank(2, resetScore ? 0 : scores[1])];
    stateRef.current.bullets = [];
    stateRef.current.particles = [];
    stateRef.current.bulletId = 0;
    stateRef.current.aiPlan = { move: 1, strafe: 0, nextThink: 0, lastShot: 0 };
    stateRef.current.shake = 0;
    if (resetScore) setScores([0, 0]);
    setWinner(0);
  }, [scores]);

  const startGame = () => {
    initRound(true);
    setMode('playing');
    playSfx('powerup');
  };

  /* ─── keyboard ─── */
  useEffect(() => {
    if (mode !== 'playing') return;
    const p1 = () => stateRef.current.tanks[0];
    const p2 = () => stateRef.current.tanks[1];
    const set = (t: Tank | undefined, k: keyof Tank['input'], v: boolean) => { if (t) (t.input as any)[k] = v; };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','g',' '].includes(k) || e.key.startsWith('Arrow')) e.preventDefault();
      if (k === 'w') set(p1(), 'up', true);
      else if (k === 's') set(p1(), 'down', true);
      else if (k === 'a') set(p1(), 'left', true);
      else if (k === 'd') set(p1(), 'right', true);
      else if (k === 'g' || k === ' ') set(p1(), 'fire', true);
      if (twoPlayer) {
        if (e.key === 'ArrowUp') set(p2(), 'up', true);
        else if (e.key === 'ArrowDown') set(p2(), 'down', true);
        else if (e.key === 'ArrowLeft') set(p2(), 'left', true);
        else if (e.key === 'ArrowRight') set(p2(), 'right', true);
        else if (k === 'k' || k === 'enter') set(p2(), 'fire', true);
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') set(p1(), 'up', false);
      else if (k === 's') set(p1(), 'down', false);
      else if (k === 'a') set(p1(), 'left', false);
      else if (k === 'd') set(p1(), 'right', false);
      else if (k === 'g' || k === ' ') set(p1(), 'fire', false);
      if (twoPlayer) {
        if (e.key === 'ArrowUp') set(p2(), 'up', false);
        else if (e.key === 'ArrowDown') set(p2(), 'down', false);
        else if (e.key === 'ArrowLeft') set(p2(), 'left', false);
        else if (e.key === 'ArrowRight') set(p2(), 'right', false);
        else if (k === 'k' || k === 'enter') set(p2(), 'fire', false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [mode, twoPlayer]);

  /* ─── main loop ─── */
  useEffect(() => {
    if (mode !== 'playing') return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    let raf = 0;
    let last = performance.now();

    const spawnParticles = (x: number, y: number, color: string, count: number, spread = 3) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * spread + 0.6;
        stateRef.current.particles.push({
          x, y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 0, max: 400 + Math.random() * 400, color,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    const fire = (t: Tank, now: number) => {
      if (!t.alive || now - t.lastFire < FIRE_COOLDOWN_MS) return;
      t.lastFire = now;
      t.muzzleFlash = 120;
      const nose = TANK_SIZE / 2 + 10;
      stateRef.current.bullets.push({
        id: ++stateRef.current.bulletId, owner: t.id,
        pos: { x: t.pos.x + Math.cos(t.angle) * nose, y: t.pos.y + Math.sin(t.angle) * nose },
        vel: { x: Math.cos(t.angle) * BULLET_SPEED, y: Math.sin(t.angle) * BULLET_SPEED },
        bounces: 0, bornAt: now,
      });
      spawnParticles(t.pos.x + Math.cos(t.angle) * nose, t.pos.y + Math.sin(t.angle) * nose, t.color, 4, 2);
      playSfx('pop');
    };

    const stepTank = (t: Tank, dt: number, walls: Wall[], now: number) => {
      if (!t.alive) return;
      const turn = 0.06 * dt;
      const speed = TANK_SPEED * dt;
      if (t.input.targetAngle !== null) {
        // joystick steer: rotate toward joystick angle
        let d = t.input.targetAngle - t.angle;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        t.angle += Math.max(-turn * 1.6, Math.min(turn * 1.6, d));
      } else {
        if (t.input.left) t.angle -= turn;
        if (t.input.right) t.angle += turn;
      }
      const dir = t.input.up ? 1 : t.input.down ? -1 : 0;
      if (dir !== 0) {
        const nx = t.pos.x + Math.cos(t.angle) * speed * dir;
        const ny = t.pos.y + Math.sin(t.angle) * speed * dir;
        if (!tankBlocked({ x: nx, y: t.pos.y }, walls)) t.pos.x = nx;
        if (!tankBlocked({ x: t.pos.x, y: ny }, walls)) t.pos.y = ny;
        if (Math.random() < 0.35) t.trail.push({ x: t.pos.x, y: t.pos.y, a: 1 });
        if (t.trail.length > 40) t.trail.shift();
      }
      for (const tr of t.trail) tr.a -= 0.008 * dt;
      t.trail = t.trail.filter(tr => tr.a > 0);
      if (t.input.fire) fire(t, now);
      if (t.muzzleFlash > 0) t.muzzleFlash -= dt * 16;
    };

    const aiTick = (bot: Tank, target: Tank, walls: Wall[], now: number) => {
      const st = stateRef.current.aiPlan;
      const dx = target.pos.x - bot.pos.x;
      const dy = target.pos.y - bot.pos.y;
      const dist = Math.hypot(dx, dy);
      const targetAngle = Math.atan2(dy, dx);
      const clear = losClear(bot.pos, target.pos, walls);

      // aim
      let diff = targetAngle - bot.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const aimTol = difficulty === 'easy' ? 0.14 : difficulty === 'medium' ? 0.07 : 0.03;
      bot.input.left = diff < -aimTol;
      bot.input.right = diff > aimTol;
      bot.input.targetAngle = null;

      // dodge nearby bullets
      let dodge = 0;
      for (const b of stateRef.current.bullets) {
        if (b.owner === bot.id) continue;
        const bx = b.pos.x - bot.pos.x, by = b.pos.y - bot.pos.y;
        if (Math.hypot(bx, by) < 90) {
          // strafe perpendicular to bullet velocity
          const cross = b.vel.x * by - b.vel.y * bx;
          dodge = cross > 0 ? 1 : -1;
          break;
        }
      }

      // movement plan
      if (now > st.nextThink) {
        if (dodge !== 0) {
          st.move = dodge; // reverse/forward to break aim
        } else if (clear && dist < 200) {
          // in range, LOS clear — strafe circle-ish
          st.move = Math.random() < 0.5 ? -1 : 1;
        } else if (clear && dist < 350) {
          st.move = Math.random() < 0.7 ? 0 : 1; // hold position for shots
        } else {
          // hunt: push forward toward player
          st.move = 1;
        }
        st.nextThink = now + (difficulty === 'hard' ? 380 : difficulty === 'medium' ? 620 : 900);
      }
      // if blocked forward, back off
      const ahead = { x: bot.pos.x + Math.cos(bot.angle) * 30, y: bot.pos.y + Math.sin(bot.angle) * 30 };
      if (st.move === 1 && tankBlocked(ahead, walls)) st.move = -1;
      bot.input.up = st.move === 1;
      bot.input.down = st.move === -1;

      // fire
      const aligned = Math.abs(diff) < (difficulty === 'hard' ? 0.12 : difficulty === 'medium' ? 0.2 : 0.32);
      const canShoot = now - st.lastShot > (difficulty === 'hard' ? 600 : difficulty === 'medium' ? 900 : 1300);
      if (aligned && clear && canShoot) {
        bot.input.fire = true;
        st.lastShot = now;
      } else {
        bot.input.fire = false;
      }
    };

    const stepBullets = (dt: number, walls: Wall[], now: number) => {
      const { bullets, tanks, particles } = stateRef.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (now - b.bornAt > BULLET_LIFE_MS) { bullets.splice(i, 1); continue; }
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        let removed = false;
        for (const w of walls) {
          const c = circleRect(b.pos.x, b.pos.y, BULLET_R, w);
          if (c.hit) {
            const dot = b.vel.x * c.nx + b.vel.y * c.ny;
            b.vel.x -= 2 * dot * c.nx;
            b.vel.y -= 2 * dot * c.ny;
            b.pos.x += c.nx * 3;
            b.pos.y += c.ny * 3;
            b.bounces++;
            if (b.bounces > MAX_BOUNCES) { bullets.splice(i, 1); removed = true; break; }
            spawnParticles(b.pos.x, b.pos.y, '#fbbf24', 3, 1.5);
            playSfx('tick');
            break;
          }
        }
        if (removed) continue;
        for (const t of tanks) {
          if (!t.alive) continue;
          const ddx = b.pos.x - t.pos.x, ddy = b.pos.y - t.pos.y;
          if (ddx * ddx + ddy * ddy < (TANK_SIZE / 2) ** 2) {
            if (t.id === b.owner && b.bounces === 0) continue;
            t.alive = false;
            t.respawnAt = now + 1400;
            const other = tanks.find(x => x.id === b.owner)!;
            other.score++;
            playSfx('crash');
            stateRef.current.shake = 16;
            spawnParticles(t.pos.x, t.pos.y, t.color, 30, 5);
            spawnParticles(t.pos.x, t.pos.y, '#fbbf24', 20, 4);
            setScores([tanks[0].score, tanks[1].score]);
            onScoreUpdate?.(tanks[0].score * 100);
            bullets.splice(i, 1);
            if (other.score >= HITS_TO_WIN) {
              setWinner(other.id);
              setMode('gameover');
              if (other.id === 1) { addCoins(50); playSfx('win'); } else { playSfx('lose'); }
            }
            break;
          }
        }
      }
      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt * 16;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        if (p.life >= p.max) particles.splice(i, 1);
      }
      if (stateRef.current.shake > 0) stateRef.current.shake -= dt * 1.2;
    };

    const respawn = (t: Tank, now: number) => {
      if (t.alive || now < t.respawnAt) return;
      t.alive = true;
      t.pos = t.id === 1 ? { x: 70, y: 70 } : { x: ARENA_W - 70, y: ARENA_H - 70 };
      t.angle = t.id === 1 ? 0 : Math.PI;
      t.trail = [];
      spawnParticles(t.pos.x, t.pos.y, t.color, 20, 3);
      playSfx('powerup');
    };

    const drawWallShadow = (w: Wall) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(w.x + 6, w.y + 6, w.w, w.h);
    };
    const drawWall = (w: Wall) => {
      const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
      g.addColorStop(0, '#64748b');
      g.addColorStop(0.5, '#475569');
      g.addColorStop(1, '#1e293b');
      ctx.fillStyle = g;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // top bevel highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(w.x, w.y, w.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
      ctx.strokeStyle = '#0b1220';
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    };

    const draw = () => {
      const shake = stateRef.current.shake > 0 ? stateRef.current.shake : 0;
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.save();
      ctx.translate(sx, sy);
      // background
      const bg = ctx.createRadialGradient(ARENA_W / 2, ARENA_H / 2, 100, ARENA_W / 2, ARENA_H / 2, 500);
      bg.addColorStop(0, '#1e293b');
      bg.addColorStop(1, '#020617');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
      ctx.strokeStyle = 'rgba(148,163,184,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= ARENA_W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke(); }
      for (let y = 0; y <= ARENA_H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke(); }

      // wall shadows
      for (const w of stateRef.current.walls) drawWallShadow(w);
      // trails
      for (const t of stateRef.current.tanks) {
        for (const tr of t.trail) {
          ctx.fillStyle = `rgba(148,163,184,${tr.a * 0.4})`;
          ctx.fillRect(tr.x - 2, tr.y - 2, 4, 4);
        }
      }
      // walls
      for (const w of stateRef.current.walls) drawWall(w);
      // particles behind bullets
      for (const p of stateRef.current.particles) {
        const alpha = 1 - p.life / p.max;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // bullets
      for (const b of stateRef.current.bullets) {
        ctx.fillStyle = b.owner === 1 ? '#22d3ee' : '#f43f5e';
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, BULLET_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // tanks
      for (const t of stateRef.current.tanks) {
        // shadow
        if (t.alive) {
          ctx.save();
          ctx.translate(t.pos.x + 5, t.pos.y + 6);
          ctx.rotate(t.angle);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE + 6, TANK_SIZE);
          ctx.restore();
        }
        ctx.save();
        ctx.translate(t.pos.x, t.pos.y);
        ctx.rotate(t.angle);
        if (!t.alive) ctx.globalAlpha = 0.2;
        // body gradient (fake 3D)
        const bodyG = ctx.createLinearGradient(0, -TANK_SIZE / 2, 0, TANK_SIZE / 2);
        bodyG.addColorStop(0, t.color);
        bodyG.addColorStop(1, t.accent);
        ctx.fillStyle = bodyG;
        ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
        // treads
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-TANK_SIZE / 2 - 4, -TANK_SIZE / 2 - 2, 4, TANK_SIZE + 4);
        ctx.fillRect(TANK_SIZE / 2, -TANK_SIZE / 2 - 2, 4, TANK_SIZE + 4);
        for (let i = -TANK_SIZE / 2; i < TANK_SIZE / 2; i += 4) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(-TANK_SIZE / 2 - 4, i, 4, 1);
          ctx.fillRect(TANK_SIZE / 2, i, 4, 1);
        }
        // top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, 3);
        // turret with gradient
        const turG = ctx.createRadialGradient(-2, -2, 1, 0, 0, TANK_SIZE / 3);
        turG.addColorStop(0, t.color);
        turG.addColorStop(1, t.accent);
        ctx.fillStyle = turG;
        ctx.beginPath();
        ctx.arc(0, 0, TANK_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
        // barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -3, TANK_SIZE / 2 + 10, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, -3, TANK_SIZE / 2 + 10, 1);
        // muzzle flash
        if (t.alive && t.muzzleFlash > 0) {
          const a = t.muzzleFlash / 120;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(TANK_SIZE / 2 + 12, 0, 6 * a + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    const loop = (now: number) => {
      const rawDt = Math.min(50, now - last);
      last = now;
      const dt = rawDt / 16.67;
      const { tanks, walls } = stateRef.current;
      if (!twoPlayer && tanks[1]?.alive) aiTick(tanks[1], tanks[0], walls, now);
      stepTank(tanks[0], dt, walls, now);
      stepTank(tanks[1], dt, walls, now);
      stepBullets(dt, walls, now);
      respawn(tanks[0], now);
      respawn(tanks[1], now);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, twoPlayer, difficulty, addCoins, onScoreUpdate]);

  /* ─── joystick ─── */
  const Joystick: React.FC<{ player: 1 | 2 }> = ({ player }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });
    const activeId = useRef<number | null>(null);

    const setFromPointer = (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx, dy = clientY - cy;
      const max = rect.width / 2;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
      setKnob({ x: dx, y: dy });
      const t = stateRef.current.tanks[player - 1];
      if (!t) return;
      const norm = d / max;
      if (norm > 0.25) {
        t.input.targetAngle = Math.atan2(dy, dx);
        t.input.up = true;
        t.input.down = false;
      } else {
        t.input.targetAngle = null;
        t.input.up = false;
        t.input.down = false;
      }
    };

    const reset = () => {
      setKnob({ x: 0, y: 0 });
      const t = stateRef.current.tanks[player - 1];
      if (t) { t.input.up = false; t.input.down = false; t.input.targetAngle = null; }
    };

    return (
      <div
        ref={baseRef}
        onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); activeId.current = e.pointerId; setFromPointer(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (activeId.current === e.pointerId) setFromPointer(e.clientX, e.clientY); }}
        onPointerUp={(e) => { if (activeId.current === e.pointerId) { activeId.current = null; reset(); } }}
        onPointerCancel={reset}
        className={`relative w-32 h-32 rounded-full border-2 touch-none select-none ${player === 1 ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-rose-400/60 bg-rose-500/10'} shadow-inner backdrop-blur`}
      >
        <div
          className={`absolute top-1/2 left-1/2 w-12 h-12 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform duration-75 ${player === 1 ? 'bg-cyan-400' : 'bg-rose-500'}`}
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    );
  };

  const FireBtn: React.FC<{ player: 1 | 2 }> = ({ player }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); const t = stateRef.current.tanks[player - 1]; if (t) t.input.fire = true; }}
      onPointerUp={() => { const t = stateRef.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      onPointerLeave={() => { const t = stateRef.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      onPointerCancel={() => { const t = stateRef.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      className={`w-20 h-20 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform touch-none shadow-lg ${player === 1 ? 'text-cyan-400 border-cyan-400 bg-cyan-500/20' : 'text-rose-400 border-rose-400 bg-rose-500/20'}`}
    >
      <Crosshair className="w-8 h-8" />
    </button>
  );

  /* ─── UI ─── */
  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 w-full max-w-lg animate-slide-up-fade">
        <h2 className="font-display text-3xl font-bold text-gradient animate-text-pop">TANKS</h2>
        <p className="text-sm text-muted-foreground text-center">
          First to <strong>{HITS_TO_WIN}</strong> hits wins. Bullets bounce — use walls for cover!
        </p>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant={!twoPlayer ? 'default' : 'outline'} onClick={() => setTwoPlayer(false)}>vs Bot</Button>
          <Button variant={twoPlayer ? 'default' : 'outline'} onClick={() => setTwoPlayer(true)}>2 Players</Button>
        </div>
        {!twoPlayer && (
          <div className="grid grid-cols-3 gap-2 w-full">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <Button key={d} size="sm" variant={difficulty === d ? 'default' : 'outline'} onClick={() => setDifficulty(d)} className="capitalize">
                {d}
              </Button>
            ))}
          </div>
        )}
        <Button variant="gaming" size="lg" onClick={startGame} className="w-full animate-elastic-in">
          <Target className="w-5 h-5" /> Start Battle
        </Button>
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p><strong>PC P1:</strong> WASD to move, Space/G to shoot</p>
          {twoPlayer && <p><strong>PC P2:</strong> Arrow keys, Enter/K to shoot</p>}
          <p>Mobile: joystick to drive, target button to fire.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center justify-between w-full max-w-[720px] px-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <div className="w-3 h-3 rounded-sm bg-cyan-400 animate-pulse" /> P1: {scores[0]}
        </div>
        <div className="text-xs text-muted-foreground">First to {HITS_TO_WIN}</div>
        <div className="flex items-center gap-2 font-bold text-rose-400">
          P2{!twoPlayer && ' (Bot)'}: {scores[1]} <div className="w-3 h-3 rounded-sm bg-rose-500 animate-pulse" />
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border animate-slide-up-fade">
        <canvas
          ref={canvasRef}
          width={ARENA_W}
          height={ARENA_H}
          className="block max-w-full h-auto"
        />
        {mode === 'gameover' && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur flex flex-col items-center justify-center gap-4 animate-fade-in">
            <Trophy className={`w-16 h-16 ${winner === 1 ? 'text-cyan-400' : 'text-rose-400'} animate-tada`} />
            <h3 className="font-display text-3xl font-bold animate-text-pop">
              {winner === 1 ? 'Player 1 Wins!' : twoPlayer ? 'Player 2 Wins!' : 'Bot Wins!'}
            </h3>
            {winner === 1 && <p className="text-sm text-warning">+50 coins earned</p>}
            <Button variant="gaming" onClick={startGame}>
              <RefreshCw className="w-4 h-4" /> Rematch
            </Button>
          </div>
        )}
      </div>

      {/* Touch controls */}
      <div className="flex md:hidden w-full justify-between items-end px-4 mt-2 gap-3">
        <Joystick player={1} />
        <div className="flex flex-col items-center gap-2">
          {twoPlayer && <FireBtn player={2} />}
          <FireBtn player={1} />
        </div>
        {twoPlayer && <Joystick player={2} />}
      </div>
    </div>
  );
};

export default Tanks;
