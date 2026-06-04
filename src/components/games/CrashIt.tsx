import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { useGame } from '@/contexts/GameContext';
import {
  Trophy, RotateCcw, Bot, Users, ChevronUp, ChevronDown, LogOut, Shuffle,
} from 'lucide-react';

/**
 * Crash It — 2D side-view physics duel (Drive Ahead-style).
 * - Two cars on a procedural arena. Each has wheels (chassis = weapon)
 *   and a vulnerable head/helmet on top.
 * - Lose the instant your head touches: opponent car, ground, wall.
 * - Land your chassis onto the opponent's head to score.
 * - First to TARGET points wins.
 * - Modes: vs Bot (Easy/Medium/Hard) or local 2-player split controls.
 * - Controls (per player): two buttons — left motor / right motor.
 *   On ground these drive; in air they spin the car.
 *   PC: P1 = A/D, P2 = ←/→
 */

type Mode = 'bot' | 'friend';
type Diff = 'easy' | 'medium' | 'hard';

const TARGET_POINTS = 5;

// Logical world units. Canvas scales to fit.
const WORLD_W = 1280;
const WORLD_H = 720;
const GRAVITY = 1800; // px/s^2

// Car
const CHASSIS_W = 92;
const CHASSIS_H = 30;
const WHEEL_R = 16;
const WHEEL_DX = 30; // wheel offset from chassis center along local x
const WHEEL_DY = 18; // below chassis center
const HEAD_DY = -28; // above chassis center (in local space, y- is up)
const HEAD_R = 13;

interface Car {
  x: number; y: number;        // chassis center
  vx: number; vy: number;
  angle: number;               // rotation (rad)
  av: number;                  // angular velocity
  facing: 1 | -1;              // visual facing
  color: string;
  rim: string;
  driver: string;
  dead: boolean;
  smokeT: number;
}

interface Arena {
  name: string;
  // Returns terrain height (y) at world x. Lower y = higher up on screen.
  ground: (x: number) => number;
  // Optional obstacle polygons (list of [x,y] points, closed)
  obstacles: Array<Array<[number, number]>>;
  // bg color (top), accent
  bgTop: string;
  bgBot: string;
  trackColor: string;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

// ---------------- Arenas ----------------
function makeArenas(): Arena[] {
  const W = WORLD_W;
  const baseY = WORLD_H - 110;

  const flatHills: Arena = {
    name: 'Sunset Hills',
    ground: (x) => baseY - Math.sin(x / 220) * 28 - Math.cos(x / 90) * 6,
    obstacles: [],
    bgTop: '#fbb9c5',
    bgBot: '#a07ab8',
    trackColor: '#2a2740',
  };

  const valley: Arena = {
    name: 'Valley',
    ground: (x) => {
      const cx = W / 2;
      const d = (x - cx) / 380;
      const dip = Math.exp(-d * d) * 140; // valley in middle
      return baseY - 30 + dip - Math.sin(x / 140) * 6;
    },
    obstacles: [],
    bgTop: '#fcd0d8',
    bgBot: '#8d6fb0',
    trackColor: '#262138',
  };

  const stadium: Arena = {
    name: 'Stadium',
    ground: (x) => {
      const cx = W / 2;
      // oval-ish bowl
      const t = (x - cx) / (W * 0.42);
      if (Math.abs(t) > 1) return baseY + 220; // outside oval
      const h = Math.sqrt(1 - t * t) * 120; // bowl depth
      return baseY - h + 70;
    },
    obstacles: [],
    bgTop: '#23314a',
    bgBot: '#0f1626',
    trackColor: '#cbb8d8',
  };

  const ramp: Arena = {
    name: 'Big Ramp',
    ground: (x) => {
      const cx = W / 2;
      const d = x - cx;
      const ramp = Math.max(0, 90 - Math.abs(d) / 3.2);
      return baseY - ramp;
    },
    obstacles: [],
    bgTop: '#1c2a44',
    bgBot: '#0a0f1f',
    trackColor: '#caa8e0',
  };

  return [flatHills, valley, stadium, ramp];
}

// ---------------- Physics helpers ----------------
function carHeadWorld(c: Car) {
  // head local point (0, HEAD_DY) rotated by angle, then + chassis pos
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  return { x: c.x + 0 * cos - HEAD_DY * sin, y: c.y + 0 * sin + HEAD_DY * cos };
}

function carWheelsWorld(c: Car) {
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  const local: [number, number][] = [
    [-WHEEL_DX, WHEEL_DY],
    [ WHEEL_DX, WHEEL_DY],
  ];
  return local.map(([lx, ly]) => ({
    x: c.x + lx * cos - ly * sin,
    y: c.y + lx * sin + ly * cos,
  }));
}

function carCornersWorld(c: Car) {
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  const hw = CHASSIS_W / 2, hh = CHASSIS_H / 2;
  const local: [number, number][] = [
    [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
  ];
  return local.map(([lx, ly]) => ({
    x: c.x + lx * cos - ly * sin,
    y: c.y + lx * sin + ly * cos,
  }));
}

// Distance from point to a (closed) polygon; positive outside / negative inside not computed —
// we only need a "point inside polygon?" + nearest-edge distance for head-vs-car.
function pointInPoly(px: number, py: number, poly: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function distPointToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy + 1e-9), 0, 1);
  const x = ax + dx * t, y = ay + dy * t;
  return Math.hypot(px - x, py - y);
}
function distPointToPoly(px: number, py: number, poly: { x: number; y: number }[]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    d = Math.min(d, distPointToSeg(px, py, a.x, a.y, b.x, b.y));
  }
  return d;
}

function makeCar(x: number, y: number, color: string, rim: string, facing: 1 | -1, driver: string): Car {
  return { x, y, vx: 0, vy: 0, angle: 0, av: 0, facing, color, rim, driver, dead: false, smokeT: 0 };
}

// ---------------- Component ----------------
const ARENAS = makeArenas();

const CrashIt: React.FC = () => {
  const { updateGameStats } = useGame();
  const [mode, setMode] = useState<Mode | null>(null);
  const [diff, setDiff] = useState<Diff>('medium');
  const [arenaIdx, setArenaIdx] = useState(0);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [roundMsg, setRoundMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const carsRef = useRef<{ p1: Car; p2: Car }>({
    p1: makeCar(WORLD_W * 0.28, 200, '#ff3b6b', '#ffd23f', 1, '#ffd9b3'),
    p2: makeCar(WORLD_W * 0.72, 200, '#36b3ff', '#ffd23f', -1, '#ffd9b3'),
  });
  const inputRef = useRef({ p1L: false, p1R: false, p2L: false, p2R: false });
  const arenaRef = useRef<Arena>(ARENAS[0]);
  const lastTimeRef = useRef<number>(0);
  const lockRef = useRef(false); // round transitioning
  const smokePartsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; t: number; max: number; r: number; c: string }>>([]);
  const sparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; t: number; max: number }>>([]);
  const runningRef = useRef(false);

  const resetRound = useCallback(() => {
    const a = arenaRef.current;
    const x1 = WORLD_W * 0.22, x2 = WORLD_W * 0.78;
    carsRef.current = {
      p1: makeCar(x1, a.ground(x1) - 120, '#ff3b6b', '#ffd23f', 1, '#ffd9b3'),
      p2: makeCar(x2, a.ground(x2) - 120, '#36b3ff', '#ffd23f', -1, '#ffd9b3'),
    };
    smokePartsRef.current = [];
    sparksRef.current = [];
    lockRef.current = false;
    setRoundMsg(null);
  }, []);

  const startGame = (m: Mode) => {
    arenaRef.current = ARENAS[arenaIdx];
    setMode(m);
    setScore({ p1: 0, p2: 0 });
    setWinner(null);
    resetRound();
  };

  const shuffleArena = () => {
    const next = (arenaIdx + 1) % ARENAS.length;
    setArenaIdx(next);
    arenaRef.current = ARENAS[next];
    resetRound();
  };

  // Score handling
  const handleLoss = useCallback((loser: 1 | 2, reason: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setRoundMsg(`P${loser === 1 ? 2 : 1} scored — ${reason}`);
    setScore((s) => {
      const winnerSide: 1 | 2 = loser === 1 ? 2 : 1;
      const next = winnerSide === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 };
      if (next.p1 >= TARGET_POINTS) {
        setWinner(1);
        updateGameStats('crash-it', next.p1 * 200, 60).catch(() => {});
      } else if (next.p2 >= TARGET_POINTS) {
        setWinner(2);
        updateGameStats('crash-it', next.p1 * 100, 60).catch(() => {});
      } else {
        setTimeout(resetRound, 1000);
      }
      return next;
    });
  }, [resetRound, updateGameStats]);

  // Main loop
  useEffect(() => {
    if (!mode) { runningRef.current = false; return; }
    runningRef.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const step = (t: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(0.033, (t - (lastTimeRef.current || t)) / 1000);
      lastTimeRef.current = t;
      if (!winner) update(dt);
      render(ctx);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { runningRef.current = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, winner, diff, arenaIdx]);

  // PHYSICS UPDATE
  const update = (dt: number) => {
    const a = arenaRef.current;
    const { p1, p2 } = carsRef.current;

    // Bot for p2
    if (mode === 'bot') {
      const speed = diff === 'easy' ? 0.55 : diff === 'medium' ? 0.85 : 1.05;
      const react = diff === 'easy' ? 0.4 : diff === 'medium' ? 0.75 : 0.95;
      const dx = p1.x - p2.x;
      const close = Math.abs(dx) < 160;
      // approach
      let L = false, R = false;
      if (dx < -10) L = true;
      else if (dx > 10) R = true;
      // if close & above us, try to flip toward p1
      const p1Above = p1.y < p2.y - 10;
      if (close && p1Above && Math.random() < 0.05 * react) {
        if (dx < 0) L = true; else R = true;
      }
      // random jitter to avoid being predictable
      if (Math.random() < 0.02 * (1 - react)) { L = !L; R = !R; }
      // intensity gating via probabilistic on/off based on speed
      if (Math.random() > speed) { L = false; R = false; }
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
    }

    const cars: Car[] = [p1, p2];
    const inputs = [
      { L: inputRef.current.p1L, R: inputRef.current.p1R },
      { L: inputRef.current.p2L, R: inputRef.current.p2R },
    ];

    cars.forEach((c, i) => {
      const inp = inputs[i];
      const wheels = carWheelsWorld(c);
      const groundAtLeft = a.ground(wheels[0].x);
      const groundAtRight = a.ground(wheels[1].x);
      const leftDist = groundAtLeft - wheels[0].y;
      const rightDist = groundAtRight - wheels[1].y;
      const grounded = leftDist <= WHEEL_R + 1 || rightDist <= WHEEL_R + 1;

      // Drive: left wheel motor / right wheel motor (Drive Ahead style:
      // pressing one side flips you that way)
      const motor = 1500;
      const air = 6.5;
      if (grounded) {
        // accelerate along facing-forward direction (use car's current angle's right vector projected)
        const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
        // forward direction = local +x rotated
        const fx = cos, fy = sin;
        if (inp.R) { c.vx += fx * motor * dt; c.vy += fy * motor * dt; c.av += 3.5 * dt; }
        if (inp.L) { c.vx -= fx * motor * dt; c.vy -= fy * motor * dt; c.av -= 3.5 * dt; }
        // friction
        c.vx *= Math.pow(0.06, dt);
        c.vy *= Math.pow(0.5, dt);
        c.av *= Math.pow(0.001, dt);
      } else {
        if (inp.R) c.av += air * dt;
        if (inp.L) c.av -= air * dt;
        c.av *= Math.pow(0.5, dt);
      }

      // gravity + integrate
      c.vy += GRAVITY * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.angle += c.av * dt;

      // smoke
      c.smokeT += dt;
      const moving = Math.abs(c.vx) > 60;
      if (moving && c.smokeT > 0.06) {
        c.smokeT = 0;
        // exhaust position: behind car
        const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
        const ex = c.x + (-CHASSIS_W / 2) * cos - (-CHASSIS_H / 2 - 6) * sin;
        const ey = c.y + (-CHASSIS_W / 2) * sin + (-CHASSIS_H / 2 - 6) * cos;
        smokePartsRef.current.push({
          x: ex, y: ey,
          vx: (Math.random() - 0.5) * 30 - Math.sign(c.vx) * 20,
          vy: -20 - Math.random() * 30,
          t: 0, max: 0.9 + Math.random() * 0.4,
          r: 4 + Math.random() * 4,
          c: '#9aa3b2',
        });
      }

      // World walls
      const wallL = 30, wallR = WORLD_W - 30;
      if (c.x < wallL) { c.x = wallL; c.vx = Math.abs(c.vx) * 0.3; c.av += 2; }
      if (c.x > wallR) { c.x = wallR; c.vx = -Math.abs(c.vx) * 0.3; c.av -= 2; }
      // ceiling
      if (c.y < 40) { c.y = 40; c.vy = Math.abs(c.vy) * 0.3; }

      // Terrain collision per wheel — push up
      [0, 1].forEach((wi) => {
        const w = wheels[wi];
        const g = a.ground(w.x);
        if (w.y + WHEEL_R > g) {
          const pen = (w.y + WHEEL_R) - g;
          // move chassis up by pen
          c.y -= pen;
          // bounce velocity
          if (c.vy > 0) c.vy = -c.vy * 0.15;
          // slight stabilizing torque toward upright when both wheels grounded
          c.av *= 0.6;
        }
      });

      // Outside arena pit (oval/ramp arenas can have walls)
      if (c.y > WORLD_H + 200) {
        // fell off — count as head loss
        handleLoss((i === 0 ? 1 : 2) as 1 | 2, 'fell off');
      }
    });

    // ---------- HEAD COLLISION CHECKS ----------
    if (!lockRef.current) {
      const checkHead = (carIdx: number) => {
        const c = cars[carIdx];
        const head = carHeadWorld(c);
        const g = a.ground(head.x);
        // Head touches ground?
        if (head.y + HEAD_R >= g) {
          spawnHitFx(head.x, head.y);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head hit ground');
          return true;
        }
        // Walls?
        if (head.x - HEAD_R <= 30 || head.x + HEAD_R >= WORLD_W - 30) {
          spawnHitFx(head.x, head.y);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head hit wall');
          return true;
        }
        // Opponent chassis poly?
        const opp = cars[1 - carIdx];
        const oppPoly = carCornersWorld(opp);
        const inside = pointInPoly(head.x, head.y, oppPoly);
        const edgeDist = distPointToPoly(head.x, head.y, oppPoly);
        if (inside || edgeDist < HEAD_R) {
          spawnHitFx(head.x, head.y);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head crushed');
          return true;
        }
        return false;
      };
      if (!checkHead(0)) checkHead(1);
    }

    // smoke update
    smokePartsRef.current = smokePartsRef.current.filter((p) => {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 30 * dt;
      p.r += 8 * dt;
      return p.t < p.max;
    });
    sparksRef.current = sparksRef.current.filter((p) => {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 400 * dt;
      return p.t < p.max;
    });
  };

  const spawnHitFx = (x: number, y: number) => {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 200 + Math.random() * 250;
      sparksRef.current.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80,
        t: 0, max: 0.5 + Math.random() * 0.3,
      });
    }
  };

  // RENDER
  const render = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current!;
    const a = arenaRef.current;
    const W = canvas.width, H = canvas.height;
    const sx = W / WORLD_W, sy = H / WORLD_H;
    const s = Math.min(sx, sy);
    ctx.save();
    // fit
    ctx.fillStyle = a.bgTop;
    ctx.fillRect(0, 0, W, H);
    // gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, a.bgTop);
    grad.addColorStop(1, a.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // center scaling
    const ox = (W - WORLD_W * s) / 2;
    const oy = (H - WORLD_H * s) / 2;
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    // distant city silhouettes (decorative dashes)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 60; i++) {
      const bx = (i * 137) % WORLD_W;
      const by = 80 + ((i * 53) % 220);
      ctx.fillRect(bx, by, 60, 12);
    }
    // light dashes
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 40; i++) {
      const bx = (i * 211 + 30) % WORLD_W;
      const by = (i * 97) % WORLD_H;
      ctx.fillRect(bx, by, 5, 16);
    }

    // ground/track silhouette
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H + 50);
    for (let x = 0; x <= WORLD_W; x += 8) {
      ctx.lineTo(x, a.ground(x));
    }
    ctx.lineTo(WORLD_W, WORLD_H + 50);
    ctx.closePath();
    ctx.fillStyle = a.trackColor;
    ctx.fill();

    // track inner lighter line
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 8) {
      if (x === 0) ctx.moveTo(x, a.ground(x));
      else ctx.lineTo(x, a.ground(x));
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();

    // walls
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, 30, WORLD_H);
    ctx.fillRect(WORLD_W - 30, 0, 30, WORLD_H);

    // smoke
    smokePartsRef.current.forEach((p) => {
      const al = 1 - p.t / p.max;
      ctx.beginPath();
      ctx.fillStyle = `rgba(170,176,190,${al * 0.55})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // cars
    drawCar(ctx, carsRef.current.p1);
    drawCar(ctx, carsRef.current.p2);

    // sparks
    sparksRef.current.forEach((p) => {
      const al = 1 - p.t / p.max;
      ctx.fillStyle = `rgba(255,200,80,${al})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });

    ctx.restore();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, c: Car) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);

    // chassis body (rounded rect)
    const w = CHASSIS_W, h = CHASSIS_H, r = 8;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    ctx.closePath();
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.stroke();

    // yellow stripe
    ctx.fillStyle = c.rim;
    ctx.fillRect(-w / 2 + 8, -3, w - 16, 6);

    // head/helmet on top
    ctx.beginPath();
    ctx.arc(0, HEAD_DY, HEAD_R, 0, Math.PI * 2);
    ctx.fillStyle = c.driver;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
    // helmet stripe
    ctx.beginPath();
    ctx.arc(0, HEAD_DY, HEAD_R, Math.PI, 0);
    ctx.fillStyle = c.color;
    ctx.fill();

    // wheels
    [[-WHEEL_DX, WHEEL_DY], [WHEEL_DX, WHEEL_DY]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    });

    // exhaust pipe
    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(-w / 2 - 6, -h / 2 - 6, 6, 8);

    ctx.restore();
  };

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor((rect.width * (WORLD_H / WORLD_W)) * dpr);
      canvas.style.height = `${rect.width * (WORLD_H / WORLD_W)}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [mode]);

  // Keyboard
  useEffect(() => {
    if (!mode) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a') inputRef.current.p1L = true;
      if (k === 'd') inputRef.current.p1R = true;
      if (mode === 'friend') {
        if (k === 'arrowleft') inputRef.current.p2L = true;
        if (k === 'arrowright') inputRef.current.p2R = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a') inputRef.current.p1L = false;
      if (k === 'd') inputRef.current.p1R = false;
      if (mode === 'friend') {
        if (k === 'arrowleft') inputRef.current.p2L = false;
        if (k === 'arrowright') inputRef.current.p2R = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [mode]);

  const press = (key: 'p1L' | 'p1R' | 'p2L' | 'p2R') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); inputRef.current[key] = true; },
    onPointerUp:   (e: React.PointerEvent) => { e.preventDefault(); inputRef.current[key] = false; },
    onPointerCancel:() => { inputRef.current[key] = false; },
    onPointerLeave:() => { inputRef.current[key] = false; },
  });

  if (!mode) {
    return (
      <UltraCard className="p-6 max-w-2xl mx-auto text-center space-y-5">
        <h2 className="font-display text-3xl font-bold text-gradient">Crash It</h2>
        <p className="text-sm text-muted-foreground">
          Smash your car's chassis onto the opponent's head. Don't let your own head touch
          the ground, walls, or the other car. First to {TARGET_POINTS} wins.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-display uppercase text-muted-foreground">Bot difficulty</p>
          <div className="flex gap-2 justify-center">
            {(['easy', 'medium', 'hard'] as Diff[]).map((d) => (
              <Button key={d} size="sm" variant={diff === d ? 'gaming' : 'outline'} onClick={() => setDiff(d)}>
                {d[0].toUpperCase() + d.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-display uppercase text-muted-foreground">Arena</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {ARENAS.map((ar, i) => (
              <Button key={ar.name} size="sm" variant={arenaIdx === i ? 'gaming' : 'outline'} onClick={() => setArenaIdx(i)}>
                {ar.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button variant="gaming" onClick={() => startGame('bot')}>
            <Bot className="w-4 h-4 mr-2" /> Play vs Bot
          </Button>
          <Button variant="outline" onClick={() => startGame('friend')}>
            <Users className="w-4 h-4 mr-2" /> Local 2-Player
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          PC: P1 A / D &middot; P2 ← / → &middot; Mobile: on-screen buttons
        </p>
      </UltraCard>
    );
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto select-none">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <UltraBadge variant="rare">P1 {score.p1}</UltraBadge>
          <span className="font-display text-muted-foreground">:</span>
          <UltraBadge variant="epic">{score.p2} P2</UltraBadge>
          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{arenaRef.current.name}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shuffleArena}>
            <Shuffle className="w-4 h-4 mr-1" /> Arena
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setMode(null); setWinner(null); }}>
            <LogOut className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-[#0a0518] shadow-premium">
        <canvas ref={canvasRef} className="w-full block" />

        {roundMsg && !winner && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-display">
            {roundMsg}
          </div>
        )}

        {winner && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <Trophy className="w-12 h-12 text-warning mx-auto" />
              <h3 className="font-display text-2xl font-bold">Player {winner} wins!</h3>
              <Button variant="gaming" onClick={() => startGame(mode)}>
                <RotateCcw className="w-4 h-4 mr-2" /> Rematch
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <div className={`grid gap-3 ${mode === 'friend' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
          <p className="text-xs font-display text-[hsl(var(--destructive))]">PLAYER 1</p>
          <div className="flex gap-4">
            <Button size="lg" variant="outline" className="h-16 w-16 p-0 rounded-full" {...press('p1L')} aria-label="P1 left">
              <ChevronDown className="w-8 h-8" />
            </Button>
            <Button size="lg" variant="gaming" className="h-16 w-16 p-0 rounded-full" {...press('p1R')} aria-label="P1 right">
              <ChevronUp className="w-8 h-8" />
            </Button>
          </div>
        </div>
        {mode === 'friend' && (
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
            <p className="text-xs font-display text-[hsl(var(--primary))]">PLAYER 2</p>
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="h-16 w-16 p-0 rounded-full" {...press('p2L')} aria-label="P2 left">
                <ChevronDown className="w-8 h-8" />
              </Button>
              <Button size="lg" variant="default" className="h-16 w-16 p-0 rounded-full" {...press('p2R')} aria-label="P2 right">
                <ChevronUp className="w-8 h-8" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrashIt;
