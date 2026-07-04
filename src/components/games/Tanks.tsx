import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target, Trophy, RefreshCw } from 'lucide-react';
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
const BULLET_SPEED = 3.5;
const TANK_SPEED = 1.6;
const HITS_TO_WIN = 5;
const MAX_BOUNCES = 3;
const BULLET_LIFE_MS = 5000;
const FIRE_COOLDOWN_MS = 550;

type Vec = { x: number; y: number };
type Tank = {
  id: 1 | 2;
  pos: Vec;
  angle: number; // radians, facing direction
  color: string;
  accent: string;
  score: number;
  alive: boolean;
  respawnAt: number;
  lastFire: number;
  input: { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean };
};
type Bullet = {
  id: number;
  owner: 1 | 2;
  pos: Vec;
  vel: Vec;
  bounces: number;
  bornAt: number;
};
type Wall = { x: number; y: number; w: number; h: number };
type Mode = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

/* ─────────── map generation ─────────── */
function buildMap(): Wall[] {
  const walls: Wall[] = [];
  // outer border
  walls.push({ x: 0, y: 0, w: ARENA_W, h: 8 });
  walls.push({ x: 0, y: ARENA_H - 8, w: ARENA_W, h: 8 });
  walls.push({ x: 0, y: 0, w: 8, h: ARENA_H });
  walls.push({ x: ARENA_W - 8, y: 0, w: 8, h: ARENA_H });

  // random obstacles (deterministic-ish per round)
  const rand = () => Math.random();
  const count = 10 + Math.floor(rand() * 6);
  for (let i = 0; i < count; i++) {
    const w = CELL * (1 + Math.floor(rand() * 3));
    const h = CELL * (1 + Math.floor(rand() * 3));
    const x = CELL + Math.floor(rand() * ((ARENA_W - w - CELL * 2) / CELL)) * CELL;
    const y = CELL + Math.floor(rand() * ((ARENA_H - h - CELL * 2) / CELL)) * CELL;
    // keep spawns clear
    if (x < 90 && y < 90) continue;
    if (x > ARENA_W - 120 && y > ARENA_H - 120) continue;
    walls.push({ x, y, w, h });
  }
  return walls;
}

/* ─────────── collision helpers ─────────── */
function circleRect(cx: number, cy: number, r: number, w: Wall): { hit: boolean; nx: number; ny: number } {
  const closestX = Math.max(w.x, Math.min(cx, w.x + w.w));
  const closestY = Math.max(w.y, Math.min(cy, w.y + w.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return { hit: false, nx: 0, ny: 0 };
  const d = Math.sqrt(d2) || 1;
  return { hit: true, nx: dx / d, ny: dy / d };
}

function tankBlocked(pos: Vec, walls: Wall[]): boolean {
  const half = TANK_SIZE / 2;
  for (const w of walls) {
    if (
      pos.x - half < w.x + w.w &&
      pos.x + half > w.x &&
      pos.y - half < w.y + w.h &&
      pos.y + half > w.y
    ) return true;
  }
  return false;
}

/* ─────────── main component ─────────── */
const Tanks: React.FC<TanksProps> = ({ onScoreUpdate }) => {
  const { addCoins } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('menu');
  const [twoPlayer, setTwoPlayer] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);

  const stateRef = useRef<{
    tanks: [Tank, Tank];
    bullets: Bullet[];
    walls: Wall[];
    bulletId: number;
    lastAi: number;
    aiPlan: { turn: number; move: number; nextThink: number };
  }>({
    tanks: [] as unknown as [Tank, Tank],
    bullets: [],
    walls: [],
    bulletId: 0,
    lastAi: 0,
    aiPlan: { turn: 0, move: 1, nextThink: 0 },
  });

  const initRound = useCallback((resetScore: boolean) => {
    const walls = buildMap();
    const p1: Tank = {
      id: 1, pos: { x: 60, y: 60 }, angle: 0, color: '#22d3ee', accent: '#0891b2',
      score: resetScore ? 0 : scores[0], alive: true, respawnAt: 0, lastFire: 0,
      input: { up: false, down: false, left: false, right: false, fire: false },
    };
    const p2: Tank = {
      id: 2, pos: { x: ARENA_W - 60, y: ARENA_H - 60 }, angle: Math.PI, color: '#f43f5e', accent: '#be123c',
      score: resetScore ? 0 : scores[1], alive: true, respawnAt: 0, lastFire: 0,
      input: { up: false, down: false, left: false, right: false, fire: false },
    };
    stateRef.current.tanks = [p1, p2];
    stateRef.current.bullets = [];
    stateRef.current.walls = walls;
    stateRef.current.bulletId = 0;
    stateRef.current.aiPlan = { turn: 0, move: 1, nextThink: 0 };
    if (resetScore) setScores([0, 0]);
    setWinner(0);
  }, [scores]);

  const startGame = () => {
    initRound(true);
    setMode('playing');
    playSfx('powerup');
  };

  /* ─── input ─── */
  useEffect(() => {
    if (mode !== 'playing') return;
    const [p1, p2] = stateRef.current.tanks;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') p1.input.up = true;
      else if (k === 's') p1.input.down = true;
      else if (k === 'a') p1.input.left = true;
      else if (k === 'd') p1.input.right = true;
      else if (k === 'g') p1.input.fire = true;
      if (twoPlayer) {
        if (e.key === 'ArrowUp') p2.input.up = true;
        else if (e.key === 'ArrowDown') p2.input.down = true;
        else if (e.key === 'ArrowLeft') p2.input.left = true;
        else if (e.key === 'ArrowRight') p2.input.right = true;
        else if (k === 'k') p2.input.fire = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') p1.input.up = false;
      else if (k === 's') p1.input.down = false;
      else if (k === 'a') p1.input.left = false;
      else if (k === 'd') p1.input.right = false;
      else if (k === 'g') p1.input.fire = false;
      if (twoPlayer) {
        if (e.key === 'ArrowUp') p2.input.up = false;
        else if (e.key === 'ArrowDown') p2.input.down = false;
        else if (e.key === 'ArrowLeft') p2.input.left = false;
        else if (e.key === 'ArrowRight') p2.input.right = false;
        else if (k === 'k') p2.input.fire = false;
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

    const fireBullet = (t: Tank, now: number) => {
      if (now - t.lastFire < FIRE_COOLDOWN_MS) return;
      t.lastFire = now;
      const nose = TANK_SIZE / 2 + 6;
      stateRef.current.bullets.push({
        id: ++stateRef.current.bulletId,
        owner: t.id,
        pos: { x: t.pos.x + Math.cos(t.angle) * nose, y: t.pos.y + Math.sin(t.angle) * nose },
        vel: { x: Math.cos(t.angle) * BULLET_SPEED, y: Math.sin(t.angle) * BULLET_SPEED },
        bounces: 0,
        bornAt: now,
      });
      playSfx('pop');
    };

    const stepTank = (t: Tank, dt: number, walls: Wall[]) => {
      if (!t.alive) return;
      const turn = 0.055 * dt;
      const speed = TANK_SPEED * dt;
      if (t.input.left) t.angle -= turn;
      if (t.input.right) t.angle += turn;
      const dir = t.input.up ? 1 : t.input.down ? -1 : 0;
      if (dir !== 0) {
        const nx = t.pos.x + Math.cos(t.angle) * speed * dir;
        const ny = t.pos.y + Math.sin(t.angle) * speed * dir;
        if (!tankBlocked({ x: nx, y: t.pos.y }, walls)) t.pos.x = nx;
        if (!tankBlocked({ x: t.pos.x, y: ny }, walls)) t.pos.y = ny;
      }
      if (t.input.fire) fireBullet(t, performance.now());
    };

    /* ─ smarter bot ─ */
    const aiTick = (bot: Tank, target: Tank, walls: Wall[], now: number) => {
      const st = stateRef.current.aiPlan;
      const dx = target.pos.x - bot.pos.x;
      const dy = target.pos.y - bot.pos.y;
      const targetAngle = Math.atan2(dy, dx);
      // Turn towards player
      let diff = targetAngle - bot.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const skill = difficulty === 'easy' ? 0.02 : difficulty === 'medium' ? 0.05 : 0.09;
      bot.input.left = diff < -skill;
      bot.input.right = diff > skill;

      // Movement plan: change every ~1s, dodge randomly
      if (now > st.nextThink) {
        const roll = Math.random();
        st.move = roll < 0.7 ? 1 : roll < 0.85 ? -1 : 0;
        st.nextThink = now + (difficulty === 'hard' ? 550 : 900);
      }
      bot.input.up = st.move === 1;
      bot.input.down = st.move === -1;

      // Fire when reasonably aligned and line-of-sight is clear-ish
      const aligned = Math.abs(diff) < (difficulty === 'hard' ? 0.15 : 0.28);
      const dist = Math.hypot(dx, dy);
      const clear = losClear(bot.pos, target.pos, walls);
      bot.input.fire = aligned && (clear || dist > 260 && Math.random() < 0.02);
    };

    const losClear = (a: Vec, b: Vec, walls: Wall[]): boolean => {
      const steps = 20;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        for (const w of walls) {
          if (px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h) return false;
        }
      }
      return true;
    };

    const stepBullets = (dt: number, walls: Wall[], now: number) => {
      const { bullets, tanks } = stateRef.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (now - b.bornAt > BULLET_LIFE_MS) { bullets.splice(i, 1); continue; }
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;

        // wall bounce
        let bounced = false;
        for (const w of walls) {
          const c = circleRect(b.pos.x, b.pos.y, BULLET_R, w);
          if (c.hit) {
            // reflect velocity across the collision normal
            const dot = b.vel.x * c.nx + b.vel.y * c.ny;
            b.vel.x -= 2 * dot * c.nx;
            b.vel.y -= 2 * dot * c.ny;
            // nudge outside wall
            b.pos.x += c.nx * 2;
            b.pos.y += c.ny * 2;
            b.bounces++;
            bounced = true;
            if (b.bounces > MAX_BOUNCES) { bullets.splice(i, 1); break; }
            playSfx('tick');
            break;
          }
        }
        if (bounced && bullets[i] !== b) continue;
        if (!bullets[i]) continue;

        // tank hits — after at least a tiny travel to avoid self-kill on spawn frame
        for (const t of tanks) {
          if (!t.alive) continue;
          const dx = b.pos.x - t.pos.x, dy = b.pos.y - t.pos.y;
          if (dx * dx + dy * dy < (TANK_SIZE / 2) ** 2) {
            // Only self-hit allowed after at least 1 bounce
            if (t.id === b.owner && b.bounces === 0) continue;
            t.alive = false;
            t.respawnAt = now + 1400;
            const other = tanks.find(x => x.id === b.owner)!;
            other.score++;
            playSfx('crash');
            setScores([tanks[0].score, tanks[1].score]);
            onScoreUpdate?.(tanks[0].score * 100);
            bullets.splice(i, 1);
            if (other.score >= HITS_TO_WIN) {
              setWinner(other.id);
              setMode('gameover');
              if (other.id === 1) {
                addCoins(50);
                playSfx('win');
              } else {
                playSfx('lose');
              }
            }
            break;
          }
        }
      }
    };

    const respawn = (t: Tank, now: number) => {
      if (t.alive || now < t.respawnAt) return;
      t.alive = true;
      t.pos = t.id === 1 ? { x: 60, y: 60 } : { x: ARENA_W - 60, y: ARENA_H - 60 };
      t.angle = t.id === 1 ? 0 : Math.PI;
      playSfx('powerup');
    };

    const draw = () => {
      // background grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
      ctx.strokeStyle = 'rgba(148,163,184,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= ARENA_W; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke();
      }
      for (let y = 0; y <= ARENA_H; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke();
      }
      // walls
      for (const w of stateRef.current.walls) {
        const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
        g.addColorStop(0, '#475569');
        g.addColorStop(1, '#1e293b');
        ctx.fillStyle = g;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#0f172a';
        ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      }
      // bullets
      for (const b of stateRef.current.bullets) {
        ctx.fillStyle = b.owner === 1 ? '#22d3ee' : '#f43f5e';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, BULLET_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // tanks
      for (const t of stateRef.current.tanks) {
        ctx.save();
        ctx.translate(t.pos.x, t.pos.y);
        ctx.rotate(t.angle);
        if (!t.alive) ctx.globalAlpha = 0.25;
        // body
        ctx.fillStyle = t.color;
        ctx.fillRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
        ctx.strokeStyle = t.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(-TANK_SIZE / 2, -TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
        // treads
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-TANK_SIZE / 2 - 3, -TANK_SIZE / 2, 3, TANK_SIZE);
        ctx.fillRect(TANK_SIZE / 2, -TANK_SIZE / 2, 3, TANK_SIZE);
        // turret
        ctx.fillStyle = t.accent;
        ctx.beginPath();
        ctx.arc(0, 0, TANK_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        // barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -3, TANK_SIZE / 2 + 8, 6);
        ctx.restore();
      }
    };

    const loop = (now: number) => {
      const rawDt = Math.min(50, now - last);
      last = now;
      const dt = rawDt / 16.67; // normalize to ~60fps units

      const { tanks, walls } = stateRef.current;
      // bot controls player 2 when single-player
      if (!twoPlayer && tanks[1].alive) aiTick(tanks[1], tanks[0], walls, now);

      stepTank(tanks[0], dt, walls);
      stepTank(tanks[1], dt, walls);
      stepBullets(dt, walls, now);
      respawn(tanks[0], now);
      respawn(tanks[1], now);

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, twoPlayer, difficulty, addCoins, onScoreUpdate]);

  /* ─── touch controls ─── */
  const setInput = (player: 1 | 2, key: 'up' | 'down' | 'left' | 'right' | 'fire', value: boolean) => {
    const t = stateRef.current.tanks[player - 1];
    if (!t) return;
    t.input[key] = value;
  };

  const ControlPad: React.FC<{ player: 1 | 2 }> = ({ player }) => {
    const btn = (icon: React.ReactNode, key: 'up' | 'down' | 'left' | 'right' | 'fire', extra = '') => (
      <button
        onPointerDown={(e) => { e.preventDefault(); setInput(player, key, true); playSfx('tick'); }}
        onPointerUp={() => setInput(player, key, false)}
        onPointerLeave={() => setInput(player, key, false)}
        onPointerCancel={() => setInput(player, key, false)}
        className={`w-11 h-11 rounded-full bg-card/80 border-2 border-border flex items-center justify-center active:scale-90 transition-transform touch-none ${extra}`}
      >
        {icon}
      </button>
    );
    const color = player === 1 ? 'text-cyan-400 border-cyan-400/60' : 'text-rose-400 border-rose-400/60';
    return (
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-3 gap-1">
          <div />{btn(<ArrowUp className="w-5 h-5" />, 'up', color)}<div />
          {btn(<ArrowLeft className="w-5 h-5" />, 'left', color)}<div />{btn(<ArrowRight className="w-5 h-5" />, 'right', color)}
          <div />{btn(<ArrowDown className="w-5 h-5" />, 'down', color)}<div />
        </div>
        {btn(<Target className="w-6 h-6" />, 'fire', `w-16 h-16 ${player === 1 ? 'text-cyan-400 border-cyan-400 bg-cyan-500/20' : 'text-rose-400 border-rose-400 bg-rose-500/20'}`)}
      </div>
    );
  };

  /* ─── UI states ─── */
  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 w-full max-w-lg animate-slide-up-fade">
        <h2 className="font-display text-3xl font-bold text-gradient animate-text-pop">TANKS</h2>
        <p className="text-sm text-muted-foreground text-center">
          First to <strong>{HITS_TO_WIN}</strong> hits wins. Bullets bounce — use walls for cover!
        </p>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant={twoPlayer ? 'default' : 'outline'} onClick={() => setTwoPlayer(true)}>2 Players</Button>
          <Button variant={!twoPlayer ? 'default' : 'outline'} onClick={() => setTwoPlayer(false)}>vs Bot</Button>
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
          <p><strong>P1:</strong> WASD to move, G to shoot</p>
          {twoPlayer && <p><strong>P2:</strong> Arrow keys to move, K to shoot</p>}
          <p>Or use on-screen controls on mobile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center justify-between w-full max-w-[720px] px-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <div className="w-3 h-3 rounded-sm bg-cyan-400" /> P1: {scores[0]}
        </div>
        <div className="text-xs text-muted-foreground">First to {HITS_TO_WIN}</div>
        <div className="flex items-center gap-2 font-bold text-rose-400">
          P2{!twoPlayer && ' (Bot)'}: {scores[1]} <div className="w-3 h-3 rounded-sm bg-rose-500" />
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border animate-slide-up-fade">
        <canvas
          ref={canvasRef}
          width={ARENA_W}
          height={ARENA_H}
          className="block max-w-full h-auto"
          style={{ imageRendering: 'pixelated' }}
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

      {/* Mobile controls */}
      <div className="flex md:hidden flex-col gap-3 items-center w-full mt-2">
        <ControlPad player={1} />
        {twoPlayer && <ControlPad player={2} />}
      </div>
    </div>
  );
};

export default Tanks;
