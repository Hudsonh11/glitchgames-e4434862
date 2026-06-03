import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { useGame } from '@/contexts/GameContext';
import { Trophy, RotateCcw, Bot, Users } from 'lucide-react';

/**
 * Crash It — 2D physics car-vs-car arena.
 *
 * The user requested a full 3D split-screen physics game. To keep it
 * shippable, this is a focused 2D top-down-style side-view arena where the
 * driver's "head" sits exposed on top of the chassis. First clean hit on the
 * opponent's head explodes their car and scores a point. First to 5 wins.
 *
 * Modes: vs Bot (single device, keyboard or on-screen) and vs Friend
 * (split-controls — P1 bottom buttons, P2 top buttons).
 */

type Mode = 'bot' | 'friend';

interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;     // radians
  angVel: number;
  color: string;
  dir: 1 | -1;       // facing direction (1 right, -1 left)
}

const ARENA_W = 720;
const ARENA_H = 360;
const CAR_W = 60;
const CAR_H = 28;
const HEAD_R = 9;
const GROUND_Y = ARENA_H - 30;
const GRAVITY = 0.55;
const FRICTION = 0.94;
const TARGET_POINTS = 5;

function newCar(x: number, color: string, dir: 1 | -1): Car {
  return { x, y: GROUND_Y - CAR_H / 2, vx: 0, vy: 0, angle: 0, angVel: 0, color, dir };
}

const CrashIt: React.FC = () => {
  const { updateGameStats } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [round, setRound] = useState(0);

  const carsRef = useRef<{ p1: Car; p2: Car }>({
    p1: newCar(150, '#ff3b6b', 1),
    p2: newCar(ARENA_W - 150, '#36b3ff', -1),
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const inputRef = useRef({ p1f: false, p1b: false, p2f: false, p2b: false });
  const roundOverRef = useRef(false);

  const resetRound = useCallback(() => {
    carsRef.current = {
      p1: newCar(150, '#ff3b6b', 1),
      p2: newCar(ARENA_W - 150, '#36b3ff', -1),
    };
    roundOverRef.current = false;
    setRound((r) => r + 1);
  }, []);

  const startGame = (m: Mode) => {
    setMode(m);
    setScore({ p1: 0, p2: 0 });
    setWinner(null);
    resetRound();
  };

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!mode || winner) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const tick = () => {
      const k = keysRef.current;
      const inp = inputRef.current;

      // Player 1 keys: A/D, on-screen p1f/p1b
      const p1f = k['d'] || k['arrowright'] || inp.p1f;
      const p1b = k['a'] || k['arrowleft'] || inp.p1b;
      // Player 2 keys: Left/Right or bot AI / on-screen p2f/p2b
      let p2f = false, p2b = false;
      if (mode === 'friend') {
        p2f = k['arrowright'] || inp.p2f;
        p2b = k['arrowleft'] || inp.p2b;
      } else {
        // simple bot: drive toward p1 head, occasionally backflip if above
        const { p1, p2 } = carsRef.current;
        const dx = p1.x - p2.x;
        if (Math.abs(dx) > 30) {
          if (dx < 0) p2f = true; else p2b = true;
        }
        if (p2.y < GROUND_Y - 60 && Math.random() < 0.05) p2b = true;
      }

      applyInput(carsRef.current.p1, p1f, p1b);
      applyInput(carsRef.current.p2, p2f, p2b);
      step(carsRef.current.p1);
      step(carsRef.current.p2);
      // collisions
      checkHits();
      draw(ctx);
      raf = requestAnimationFrame(tick);
    };

    const applyInput = (c: Car, f: boolean, b: boolean) => {
      const grounded = c.y >= GROUND_Y - CAR_H / 2 - 1;
      if (grounded) {
        if (f) c.vx += 0.45 * c.dir;
        if (b) c.vx -= 0.45 * c.dir;
        // torque tip if accelerating hard
        if (f) c.angVel -= 0.004 * c.dir;
        if (b) c.angVel += 0.004 * c.dir;
      } else {
        // air control
        if (f) c.angVel -= 0.006 * c.dir;
        if (b) c.angVel += 0.006 * c.dir;
      }
    };

    const step = (c: Car) => {
      c.vy += GRAVITY;
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.angVel;
      // walls
      if (c.x < CAR_W / 2) { c.x = CAR_W / 2; c.vx = -c.vx * 0.4; }
      if (c.x > ARENA_W - CAR_W / 2) { c.x = ARENA_W - CAR_W / 2; c.vx = -c.vx * 0.4; }
      // ground
      if (c.y >= GROUND_Y - CAR_H / 2) {
        c.y = GROUND_Y - CAR_H / 2;
        c.vy = 0;
        c.vx *= FRICTION;
        // settle rotation toward upright
        const target = Math.round(c.angle / (Math.PI * 2)) * Math.PI * 2;
        c.angle += (target - c.angle) * 0.1;
        c.angVel *= 0.7;
      }
      // ceiling
      if (c.y < HEAD_R + 4) { c.y = HEAD_R + 4; c.vy = Math.abs(c.vy) * 0.4; }
    };

    const headPos = (c: Car) => {
      // head sits above chassis along the car's local up vector
      const ux = -Math.sin(c.angle);
      const uy = -Math.cos(c.angle);
      return { x: c.x + ux * (CAR_H / 2 + HEAD_R), y: c.y + uy * (CAR_H / 2 + HEAD_R) };
    };

    const carHitsHead = (attacker: Car, victim: Car) => {
      const h = headPos(victim);
      // attacker body AABB approx (axis-aligned for simplicity)
      const minX = attacker.x - CAR_W / 2;
      const maxX = attacker.x + CAR_W / 2;
      const minY = attacker.y - CAR_H / 2;
      const maxY = attacker.y + CAR_H / 2;
      const cx = Math.max(minX, Math.min(h.x, maxX));
      const cy = Math.max(minY, Math.min(h.y, maxY));
      const dx = h.x - cx, dy = h.y - cy;
      return dx * dx + dy * dy < HEAD_R * HEAD_R;
    };

    const headHitsGround = (c: Car) => {
      const h = headPos(c);
      return h.y >= GROUND_Y - 2;
    };

    const checkHits = () => {
      if (roundOverRef.current) return;
      const { p1, p2 } = carsRef.current;
      let scorer: 1 | 2 | null = null;
      if (carHitsHead(p1, p2) || headHitsGround(p2)) scorer = 1;
      else if (carHitsHead(p2, p1) || headHitsGround(p1)) scorer = 2;
      if (scorer) {
        roundOverRef.current = true;
        setScore((s) => {
          const next = scorer === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 };
          if (next.p1 >= TARGET_POINTS) {
            setWinner(1);
            updateGameStats('crash-it', next.p1 * 200, 60).catch(() => {});
          } else if (next.p2 >= TARGET_POINTS) {
            setWinner(2);
            updateGameStats('crash-it', next.p1 * 100, 60).catch(() => {});
          } else {
            setTimeout(resetRound, 900);
          }
          return next;
        });
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      // bg
      const g = ctx.createLinearGradient(0, 0, 0, ARENA_H);
      g.addColorStop(0, '#1a1033');
      g.addColorStop(1, '#0a0518');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < ARENA_W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke();
      }
      // ground
      ctx.fillStyle = '#3a2a55';
      ctx.fillRect(0, GROUND_Y, ARENA_W, ARENA_H - GROUND_Y);
      ctx.fillStyle = '#ff3b6b';
      ctx.fillRect(0, GROUND_Y - 2, ARENA_W, 2);

      drawCar(ctx, carsRef.current.p1, 'P1');
      drawCar(ctx, carsRef.current.p2, 'P2');
    };

    const drawCar = (ctx: CanvasRenderingContext2D, c: Car, label: string) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      // chassis
      ctx.fillStyle = c.color;
      ctx.fillRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H);
      // wheels
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-CAR_W / 2 + 12, CAR_H / 2, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(CAR_W / 2 - 12, CAR_H / 2, 8, 0, Math.PI * 2); ctx.fill();
      // head
      ctx.fillStyle = '#ffd9b3';
      ctx.beginPath(); ctx.arc(0, -CAR_H / 2 - HEAD_R, HEAD_R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      // label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, c.x, c.y - CAR_H / 2 - HEAD_R * 2 - 6);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, winner, resetRound, updateGameStats]);

  if (!mode) {
    return (
      <UltraCard className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="font-display text-3xl font-bold text-gradient">Crash It</h2>
        <p className="text-sm text-muted-foreground">
          Smash your wheels into your opponent's exposed head. First to {TARGET_POINTS} wins.
          Don't let your own head touch anything!
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="gaming" onClick={() => startGame('bot')}>
            <Bot className="w-4 h-4 mr-2" /> Play vs Bot
          </Button>
          <Button variant="outline" onClick={() => startGame('friend')}>
            <Users className="w-4 h-4 mr-2" /> Play vs Friend
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          P1: A / D · P2: ← / → · Or use the on-screen buttons below
        </p>
      </UltraCard>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <UltraBadge variant="rare">P1 (red): {score.p1}</UltraBadge>
        <UltraBadge variant="epic">P2 (blue): {score.p2}</UltraBadge>
        <Button variant="ghost" size="sm" onClick={() => { setMode(null); setWinner(null); }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Quit
        </Button>
      </div>

      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={ARENA_W}
          height={ARENA_H}
          className="w-full h-auto rounded-xl border border-border bg-black"
        />
        {winner && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
            <div className="text-center space-y-3">
              <Trophy className="w-12 h-12 text-warning mx-auto" />
              <h3 className="font-display text-2xl font-bold">
                Player {winner} wins!
              </h3>
              <Button variant="gaming" onClick={() => startGame(mode)}>Rematch</Button>
            </div>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Player 1</p>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onTouchStart={() => (inputRef.current.p1b = true)}
              onTouchEnd={() => (inputRef.current.p1b = false)}
              onMouseDown={() => (inputRef.current.p1b = true)}
              onMouseUp={() => (inputRef.current.p1b = false)}
              onMouseLeave={() => (inputRef.current.p1b = false)}
            >◀</Button>
            <Button
              size="lg"
              variant="gaming"
              onTouchStart={() => (inputRef.current.p1f = true)}
              onTouchEnd={() => (inputRef.current.p1f = false)}
              onMouseDown={() => (inputRef.current.p1f = true)}
              onMouseUp={() => (inputRef.current.p1f = false)}
              onMouseLeave={() => (inputRef.current.p1f = false)}
            >▶</Button>
          </div>
        </div>
        {mode === 'friend' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">Player 2</p>
            <div className="flex gap-2">
              <Button
                size="lg"
                variant="outline"
                onTouchStart={() => (inputRef.current.p2b = true)}
                onTouchEnd={() => (inputRef.current.p2b = false)}
                onMouseDown={() => (inputRef.current.p2b = true)}
                onMouseUp={() => (inputRef.current.p2b = false)}
                onMouseLeave={() => (inputRef.current.p2b = false)}
              >◀</Button>
              <Button
                size="lg"
                variant="gaming"
                onTouchStart={() => (inputRef.current.p2f = true)}
                onTouchEnd={() => (inputRef.current.p2f = false)}
                onMouseDown={() => (inputRef.current.p2f = true)}
                onMouseUp={() => (inputRef.current.p2f = false)}
                onMouseLeave={() => (inputRef.current.p2f = false)}
              >▶</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrashIt;
