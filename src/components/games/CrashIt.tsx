import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';
import {
  Trophy, RotateCcw, Bot, Users, ChevronUp, ChevronDown, LogOut, Shuffle,
} from 'lucide-react';


/**
 * Crash It — 2D side-view physics duel (Drive Ahead-style).
 * - Random arena each round.
 * - Chassis is the weapon. Head/helmet is the weak spot.
 * - Touch ground/wall/opponent with your head = you lose the round.
 * - First to TARGET points wins.
 */

type Mode = 'bot' | 'friend';
type Diff = 'easy' | 'medium' | 'hard';

const TARGET_POINTS = 5;

// Logical world units. Canvas scales to fit.
const WORLD_W = 1280;
const WORLD_H = 720;
const GRAVITY = 2200;

// Car
const CHASSIS_W = 92;
const CHASSIS_H = 28;
const WHEEL_R = 16;
const WHEEL_DX = 30;
const WHEEL_DY = 16;
const HEAD_DY = -26;
const HEAD_R = 12;

const MAX_SPEED = 620;
const MAX_AV = 8;


interface Car {
  x: number; y: number;
  vx: number; vy: number;
  angle: number;
  av: number;
  facing: 1 | -1;
  color: string;
  rim: string;
  driver: string;
  smokeT: number;
  groundedT: number;       // seconds we've been grounded (for bot logic)
  airT: number;            // seconds airborne
  lastJumpT: number;
  hitFlashT: number;
}

interface Arena {
  name: string;
  ground: (x: number) => number;
  bgTop: string;
  bgBot: string;
  trackColor: string;
  trackEdge: string;
  accent: string;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

// ---------------- Arenas ----------------
function makeArenas(): Arena[] {
  const W = WORLD_W;
  const baseY = WORLD_H - 110;

  const flatHills: Arena = {
    name: 'Sunset Hills',
    ground: (x) => baseY - Math.sin(x / 220) * 28 - Math.cos(x / 90) * 6,
    bgTop: '#ffb597', bgBot: '#5b3a8a', trackColor: '#2a2740',
    trackEdge: '#ffd23f', accent: '#ff7aa2',
  };

  const valley: Arena = {
    name: 'Valley',
    ground: (x) => {
      const cx = W / 2;
      const d = (x - cx) / 380;
      const dip = Math.exp(-d * d) * 140;
      return baseY - 30 + dip - Math.sin(x / 140) * 6;
    },
    bgTop: '#a4d9ff', bgBot: '#3a2b78', trackColor: '#251e3a',
    trackEdge: '#7cf0ff', accent: '#52c9ff',
  };

  const stadium: Arena = {
    name: 'Stadium',
    ground: (x) => {
      const cx = W / 2;
      const t = (x - cx) / (W * 0.42);
      if (Math.abs(t) > 1) return baseY + 220;
      const h = Math.sqrt(1 - t * t) * 120;
      return baseY - h + 70;
    },
    bgTop: '#1b2a4a', bgBot: '#070c1c', trackColor: '#1a1424',
    trackEdge: '#b07cff', accent: '#8b5cf6',
  };

  const ramp: Arena = {
    name: 'Big Ramp',
    ground: (x) => {
      const cx = W / 2;
      const d = x - cx;
      const r = Math.max(0, 90 - Math.abs(d) / 3.2);
      return baseY - r;
    },
    bgTop: '#0f2342', bgBot: '#050a18', trackColor: '#161024',
    trackEdge: '#ff7aa2', accent: '#ff3b6b',
  };

  const dunes: Arena = {
    name: 'Dunes',
    ground: (x) => baseY - Math.sin(x / 90) * 40 - Math.sin(x / 180 + 1.2) * 28,
    bgTop: '#ffd28a', bgBot: '#6b2f6a', trackColor: '#3a1f2a',
    trackEdge: '#ffd23f', accent: '#ffa55a',
  };

  const skyline: Arena = {
    name: 'Skyline',
    ground: (x) => {
      const cx = W / 2;
      const d = (x - cx) / W;
      return baseY - 40 - Math.cos(d * Math.PI) * 60 + Math.sin(x / 100) * 10;
    },
    bgTop: '#0a1f3a', bgBot: '#000010', trackColor: '#0e0a1c',
    trackEdge: '#7cf0ff', accent: '#52c9ff',
  };

  return [flatHills, valley, stadium, ramp, dunes, skyline];
}

// ---------------- Helpers ----------------
function carHeadWorld(c: Car) {
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  return { x: c.x + 0 * cos - HEAD_DY * sin, y: c.y + 0 * sin + HEAD_DY * cos };
}
function carWheelsWorld(c: Car) {
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  const local: [number, number][] = [[-WHEEL_DX, WHEEL_DY], [WHEEL_DX, WHEEL_DY]];
  return local.map(([lx, ly]) => ({
    x: c.x + lx * cos - ly * sin,
    y: c.y + lx * sin + ly * cos,
  }));
}
function carCornersWorld(c: Car) {
  const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
  const hw = CHASSIS_W / 2, hh = CHASSIS_H / 2;
  const local: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  return local.map(([lx, ly]) => ({
    x: c.x + lx * cos - ly * sin,
    y: c.y + lx * sin + ly * cos,
  }));
}
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
function groundNormal(a: Arena, x: number) {
  const dx = 4;
  const yL = a.ground(x - dx), yR = a.ground(x + dx);
  // tangent dir = (2dx, yR - yL), normal = perpendicular pointing up
  const tx = 2 * dx, ty = yR - yL;
  const len = Math.hypot(tx, ty);
  // normal points "up" (negative y), so rotate tangent +90°
  const nx = -ty / len, ny = -tx / len; // since up is -y
  // Ensure ny is negative (upward)
  if (ny > 0) return { nx: -nx, ny: -ny };
  return { nx, ny };
}

function makeCar(x: number, y: number, color: string, rim: string, facing: 1 | -1, driver: string): Car {
  return {
    x, y, vx: 0, vy: 0, angle: 0, av: 0, facing, color, rim, driver,
    smokeT: 0, groundedT: 0, airT: 0, lastJumpT: 0, hitFlashT: 0,
  };
}

// ---------------- Component ----------------
const ARENAS = makeArenas();

const CrashIt: React.FC = () => {
  const { updateGameStats } = useGame();
  const [mode, setMode] = useState<Mode | null>(null);
  const [diff, setDiff] = useState<Diff>('medium');
  const [arenaIdx, setArenaIdx] = useState(0);
  const [arenaLabel, setArenaLabel] = useState(ARENAS[0].name);
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
  const lockRef = useRef(false);
  const timeRef = useRef(0);
  const smokePartsRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; t: number; max: number; r: number; c: string }>>([]);
  const sparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; t: number; max: number; c: string }>>([]);
  const runningRef = useRef(false);
  const shakeRef = useRef(0);
  const botMemRef = useRef({ flipDir: 0, flipUntil: 0, recoverUntil: 0, nextDecisionAt: 0 });

  const pickRandomArena = useCallback((excludeIdx?: number) => {
    let idx = Math.floor(Math.random() * ARENAS.length);
    if (excludeIdx !== undefined && ARENAS.length > 1) {
      while (idx === excludeIdx) idx = Math.floor(Math.random() * ARENAS.length);
    }
    return idx;
  }, []);

  const resetRound = useCallback((randomize: boolean) => {
    let idx = arenaIdx;
    if (randomize) idx = pickRandomArena(arenaIdx);
    const a = ARENAS[idx];
    arenaRef.current = a;
    setArenaIdx(idx);
    setArenaLabel(a.name);
    const x1 = WORLD_W * 0.22, x2 = WORLD_W * 0.78;
    carsRef.current = {
      p1: makeCar(x1, a.ground(x1) - 120, '#ff3b6b', '#ffd23f', 1, '#ffd9b3'),
      p2: makeCar(x2, a.ground(x2) - 120, '#36b3ff', '#ffd23f', -1, '#ffd9b3'),
    };
    smokePartsRef.current = [];
    sparksRef.current = [];
    lockRef.current = false;
    shakeRef.current = 0;
    botMemRef.current = { flipDir: 0, flipUntil: 0, recoverUntil: 0, nextDecisionAt: 0 };
    setRoundMsg(null);
  }, [arenaIdx, pickRandomArena]);

  const startGame = (m: Mode) => {
    const idx = pickRandomArena();
    setArenaIdx(idx);
    arenaRef.current = ARENAS[idx];
    setArenaLabel(ARENAS[idx].name);
    setMode(m);
    setScore({ p1: 0, p2: 0 });
    setWinner(null);
    setTimeout(() => resetRound(false), 0);
  };

  const shuffleArena = () => {
    const next = pickRandomArena(arenaIdx);
    setArenaIdx(next);
    arenaRef.current = ARENAS[next];
    setArenaLabel(ARENAS[next].name);
    resetRound(false);
  };

  const handleLoss = useCallback((loser: 1 | 2, reason: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    shakeRef.current = 14;
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
        // Random arena each round
        setTimeout(() => resetRound(true), 1100);
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
      const dt = Math.min(0.025, (t - (lastTimeRef.current || t)) / 1000);
      lastTimeRef.current = t;
      timeRef.current += dt;
      if (!winner) update(dt);
      render(ctx);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { runningRef.current = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, winner, diff]);

  // ---------------- BOT ----------------
  const runBot = (dt: number) => {
    const { p1, p2 } = carsRef.current;
    const a = arenaRef.current;
    const now = timeRef.current;
    const mem = botMemRef.current;

    // Personality from difficulty
    const reaction  = diff === 'easy' ? 0.35 : diff === 'medium' ? 0.18 : 0.08;
    const accuracy  = diff === 'easy' ? 0.55 : diff === 'medium' ? 0.8  : 0.95;
    const aggression= diff === 'easy' ? 0.35 : diff === 'medium' ? 0.7  : 1.0;

    // Defaults
    let L = false, R = false;

    // Always re-evaluate quickly enough to feel reactive
    if (now < mem.nextDecisionAt && (mem.flipUntil > now || mem.recoverUntil > now)) {
      // mid-action: continue
      if (mem.recoverUntil > now) {
        // try to right ourselves
        const upright = p2.angle - Math.round(p2.angle / (Math.PI * 2)) * (Math.PI * 2);
        if (upright > 0.15) L = true; else if (upright < -0.15) R = true;
      } else if (mem.flipUntil > now) {
        if (mem.flipDir < 0) L = true; else R = true;
      }
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
      return;
    }
    mem.nextDecisionAt = now + reaction;

    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.hypot(dx, dy);

    // Detect bad orientation (upside down) → schedule a recovery flip
    const norm = ((p2.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const tilted = norm > Math.PI * 0.55 && norm < Math.PI * 1.45;
    if (tilted && p2.groundedT < 0.15) {
      mem.recoverUntil = now + 0.35;
      // Choose flip direction toward shorter way up
      if (norm < Math.PI) { L = true; } else { R = true; }
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
      return;
    }

    // Predict p1 horizontal in 0.25s
    const predX = p1.x + p1.vx * 0.25;
    const desiredDx = predX - p2.x;

    // If p1 is roughly above us (dangerous head!) and close, escape under
    const headP1 = carHeadWorld(p1);
    const headP2 = carHeadWorld(p2);
    const p1AboveUs = p1.y < p2.y - 18 && Math.abs(p1.x - p2.x) < 90;
    const ourHeadExposedUnderP1 = headP1.y < headP2.y - 5 && Math.abs(headP1.x - headP2.x) < 70;

    if (p1AboveUs && ourHeadExposedUnderP1 && aggression > 0.4) {
      // bail sideways — choose opposite of p1
      if (dx < 0) R = true; else L = true;
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
      return;
    }

    // If we're airborne with p1 below + close → aim chassis down on top of p1's head
    if (p2.airT > 0.15 && p1.y > p2.y + 10 && Math.abs(dx) < 120 && aggression > 0.5) {
      // flip so chassis lands on p1
      const need = dx > 0 ? 1 : -1; // tilt forward toward p1
      mem.flipDir = need;
      mem.flipUntil = now + 0.18;
      if (need < 0) L = true; else R = true;
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
      return;
    }

    // Pop-flip attack: if very close on the ground, try a sudden flip to land chassis on top
    if (dist < 130 && p2.groundedT > 0.25 && aggression > 0.6 && Math.random() < accuracy * 0.6) {
      const need = dx > 0 ? 1 : -1;
      mem.flipDir = need;
      mem.flipUntil = now + 0.22;
      // accelerate hard toward target first
      if (need < 0) L = true; else R = true;
      inputRef.current.p2L = L;
      inputRef.current.p2R = R;
      return;
    }

    // Default: drive toward predicted p1
    if (Math.abs(desiredDx) > 14) {
      if (desiredDx < 0) L = true; else R = true;
    }

    // Add tiny inaccuracy on easy/medium
    if (Math.random() > accuracy * 0.9) {
      L = false; R = false;
    }

    inputRef.current.p2L = L;
    inputRef.current.p2R = R;
  };

  // PHYSICS UPDATE
  const update = (dt: number) => {
    const a = arenaRef.current;
    const { p1, p2 } = carsRef.current;

    if (mode === 'bot') runBot(dt);

    const cars: Car[] = [p1, p2];
    const inputs = [
      { L: inputRef.current.p1L, R: inputRef.current.p1R },
      { L: inputRef.current.p2L, R: inputRef.current.p2R },
    ];

    cars.forEach((c, i) => {
      const inp = inputs[i];
      const wheels = carWheelsWorld(c);
      const gL = a.ground(wheels[0].x);
      const gR = a.ground(wheels[1].x);
      const penL = (wheels[0].y + WHEEL_R) - gL;
      const penR = (wheels[1].y + WHEEL_R) - gR;
      const grounded = penL > -2 || penR > -2;

      if (grounded) {
        c.groundedT += dt;
        c.airT = 0;
      } else {
        c.airT += dt;
        c.groundedT = 0;
      }

      // Tangent-aligned drive on ground
      if (grounded) {
        const refX = penL > penR ? wheels[0].x : wheels[1].x;
        const dx = 4;
        const tx = 2 * dx, ty = a.ground(refX + dx) - a.ground(refX - dx);
        const tlen = Math.hypot(tx, ty) || 1;
        const tnx = tx / tlen, tny = ty / tlen; // unit tangent (pointing +x along slope)

        const motor = 1700;
        if (inp.R) { c.vx += tnx * motor * dt; c.vy += tny * motor * dt; c.av += 2.5 * dt; }
        if (inp.L) { c.vx -= tnx * motor * dt; c.vy -= tny * motor * dt; c.av -= 2.5 * dt; }

        // Project velocity: keep tangent component (with friction), kill normal component
        const nrm = groundNormal(a, c.x);
        const vt = c.vx * tnx + c.vy * tny;        // tangential
        const vn = c.vx * nrm.nx + c.vy * nrm.ny;  // normal (negative = into ground)
        const newVt = vt * Math.pow(0.04, dt);     // strong tangential friction when no input
        // if user is pushing, don't damp as hard
        const damped = (inp.L || inp.R) ? vt * Math.pow(0.55, dt) : newVt;
        const newVn = vn < 0 ? vn * 0.0 : vn * Math.pow(0.5, dt); // remove into-ground component
        c.vx = tnx * damped + nrm.nx * newVn;
        c.vy = tny * damped + nrm.ny * newVn;

        // Angular damping
        c.av *= Math.pow(0.001, dt);

        // Self-righting if mostly grounded and both wheels are near ground
        if (penL > -4 && penR > -4) {
          // align chassis to tangent slope angle
          const slopeAngle = Math.atan2(ty, tx);
          let diff = slopeAngle - c.angle;
          // wrap to [-pi, pi]
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          c.av += diff * 6 * dt;
        }
      } else {
        // Air control
        const air = 7.0;
        if (inp.R) c.av += air * dt;
        if (inp.L) c.av -= air * dt;
        c.av *= Math.pow(0.6, dt);
      }

      // Gravity
      c.vy += GRAVITY * dt;

      // Velocity caps for stability
      const sp = Math.hypot(c.vx, c.vy);
      if (sp > MAX_SPEED) { c.vx = (c.vx / sp) * MAX_SPEED; c.vy = (c.vy / sp) * MAX_SPEED; }
      c.av = clamp(c.av, -MAX_AV, MAX_AV);

      // Integrate
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.angle += c.av * dt;

      // Smoke trail
      c.smokeT += dt;
      const movingFast = Math.abs(c.vx) > 80 && grounded;
      if (movingFast && c.smokeT > 0.05) {
        c.smokeT = 0;
        const cos = Math.cos(c.angle), sin = Math.sin(c.angle);
        const ex = c.x + (-CHASSIS_W / 2) * cos - (-CHASSIS_H / 2 - 4) * sin;
        const ey = c.y + (-CHASSIS_W / 2) * sin + (-CHASSIS_H / 2 - 4) * cos;
        smokePartsRef.current.push({
          x: ex, y: ey,
          vx: (Math.random() - 0.5) * 30 - Math.sign(c.vx) * 25,
          vy: -20 - Math.random() * 30,
          t: 0, max: 0.9 + Math.random() * 0.5,
          r: 4 + Math.random() * 4,
          c: '#9aa3b2',
        });
      }

      // Walls
      const wallL = 30, wallR = WORLD_W - 30;
      if (c.x < wallL) { c.x = wallL; c.vx = Math.abs(c.vx) * 0.25; c.av += 2; }
      if (c.x > wallR) { c.x = wallR; c.vx = -Math.abs(c.vx) * 0.25; c.av -= 2; }
      if (c.y < 40) { c.y = 40; c.vy = Math.abs(c.vy) * 0.3; }

      // Wheel/terrain resolution
      const wheels2 = carWheelsWorld(c);
      [0, 1].forEach((wi) => {
        const w = wheels2[wi];
        const g = a.ground(w.x);
        const pen = (w.y + WHEEL_R) - g;
        if (pen > 0) {
          c.y -= pen;
          // landing impact effects
          if (c.vy > 240) {
            for (let k = 0; k < 6; k++) {
              smokePartsRef.current.push({
                x: w.x + (Math.random() - 0.5) * 14, y: g,
                vx: (Math.random() - 0.5) * 120,
                vy: -60 - Math.random() * 80,
                t: 0, max: 0.7, r: 5 + Math.random() * 4,
                c: '#d8d2c0',
              });
            }
          }
          if (c.vy > 0) c.vy = -c.vy * 0.18;
          // Apply tangential torque if only one wheel touching → tilt toward slope
          c.av *= 0.55;
        }
      });

      // Pit/fall-off
      if (c.y > WORLD_H + 200) {
        handleLoss((i === 0 ? 1 : 2) as 1 | 2, 'fell off');
      }

      if (c.hitFlashT > 0) c.hitFlashT = Math.max(0, c.hitFlashT - dt);
    });

    // Car–car chassis collision (push apart so they don't pass through)
    {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = CHASSIS_W * 0.78;
      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist, ny = dy / dist;
        const overlap = (minDist - dist) / 2;
        p1.x -= nx * overlap; p1.y -= ny * overlap * 0.4;
        p2.x += nx * overlap; p2.y += ny * overlap * 0.4;
        // exchange some momentum
        const rvx = p2.vx - p1.vx;
        const rvy = p2.vy - p1.vy;
        const rel = rvx * nx + rvy * ny;
        if (rel < 0) {
          const j = -rel * 0.7;
          p1.vx -= j * nx; p1.vy -= j * ny * 0.3;
          p2.vx += j * nx; p2.vy += j * ny * 0.3;
          // bump angular
          p1.av -= 0.6; p2.av += 0.6;
        }
      }
    }

    // HEAD COLLISION
    if (!lockRef.current) {
      const checkHead = (carIdx: number) => {
        const c = cars[carIdx];
        const head = carHeadWorld(c);
        const g = a.ground(head.x);
        if (head.y + HEAD_R >= g) {
          spawnHitFx(head.x, head.y, c.color);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head hit ground');
          return true;
        }
        if (head.x - HEAD_R <= 30 || head.x + HEAD_R >= WORLD_W - 30) {
          spawnHitFx(head.x, head.y, c.color);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head hit wall');
          return true;
        }
        const opp = cars[1 - carIdx];
        const oppPoly = carCornersWorld(opp);
        const inside = pointInPoly(head.x, head.y, oppPoly);
        const edgeDist = distPointToPoly(head.x, head.y, oppPoly);
        if (inside || edgeDist < HEAD_R) {
          spawnHitFx(head.x, head.y, opp.color);
          handleLoss((carIdx === 0 ? 1 : 2) as 1 | 2, 'head crushed');
          return true;
        }
        return false;
      };
      if (!checkHead(0)) checkHead(1);
    }

    // FX update
    smokePartsRef.current = smokePartsRef.current.filter((p) => {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 30 * dt; p.r += 8 * dt;
      return p.t < p.max;
    });
    sparksRef.current = sparksRef.current.filter((p) => {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 500 * dt;
      return p.t < p.max;
    });
    if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - dt * 30);
  };

  const spawnHitFx = (x: number, y: number, color: string) => {
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const s = 240 + Math.random() * 280;
      sparksRef.current.push({
        x, y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s - 60,
        t: 0, max: 0.55 + Math.random() * 0.35,
        c: Math.random() < 0.5 ? '#ffd23f' : color,
      });
    }
  };

  // ---------------- RENDER ----------------
  const render = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current!;
    const a = arenaRef.current;
    const W = canvas.width, H = canvas.height;
    const sx = W / WORLD_W, sy = H / WORLD_H;
    const s = Math.min(sx, sy);

    ctx.save();
    // Camera shake
    const sh = shakeRef.current;
    const shx = (Math.random() - 0.5) * sh;
    const shy = (Math.random() - 0.5) * sh;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, a.bgTop);
    grad.addColorStop(1, a.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const ox = (W - WORLD_W * s) / 2 + shx;
    const oy = (H - WORLD_H * s) / 2 + shy;
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    // Sun / moon
    const sunY = WORLD_H * 0.28;
    const sunGrad = ctx.createRadialGradient(WORLD_W * 0.78, sunY, 0, WORLD_W * 0.78, sunY, 240);
    sunGrad.addColorStop(0, a.accent);
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = a.accent;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(WORLD_W * 0.78, sunY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Distant mountain layer 1
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H);
    for (let x = 0; x <= WORLD_W; x += 40) {
      const y = WORLD_H * 0.55 + Math.sin(x / 180) * 50 + Math.cos(x / 90) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WORLD_W, WORLD_H);
    ctx.closePath();
    ctx.fill();

    // Distant mountain layer 2 (closer)
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H);
    for (let x = 0; x <= WORLD_W; x += 30) {
      const y = WORLD_H * 0.65 + Math.sin(x / 110 + 1.2) * 40 + Math.cos(x / 60) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WORLD_W, WORLD_H);
    ctx.closePath();
    ctx.fill();

    // Skyline silhouette
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 80; i++) {
      const bx = (i * 167) % WORLD_W;
      const bw = 18 + ((i * 37) % 40);
      const bh = 30 + ((i * 91) % 110);
      const by = WORLD_H * 0.62 - bh;
      ctx.fillRect(bx, by, bw, bh);
    }

    // Ground silhouette (fill)
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H + 50);
    for (let x = 0; x <= WORLD_W; x += 6) ctx.lineTo(x, a.ground(x));
    ctx.lineTo(WORLD_W, WORLD_H + 50);
    ctx.closePath();
    ctx.fillStyle = a.trackColor;
    ctx.fill();

    // Glowing track edge
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 6) {
      if (x === 0) ctx.moveTo(x, a.ground(x));
      else ctx.lineTo(x, a.ground(x));
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = a.trackEdge;
    ctx.shadowColor = a.trackEdge;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Track surface stripes
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 24) {
      const y = a.ground(x) + 12;
      ctx.moveTo(x, y); ctx.lineTo(x + 12, y);
    }
    ctx.stroke();

    // Walls (with neon edge)
    const wallGrad = ctx.createLinearGradient(0, 0, 30, 0);
    wallGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    wallGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 30, WORLD_H);
    const wallGrad2 = ctx.createLinearGradient(WORLD_W - 30, 0, WORLD_W, 0);
    wallGrad2.addColorStop(0, 'rgba(0,0,0,0.2)');
    wallGrad2.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = wallGrad2;
    ctx.fillRect(WORLD_W - 30, 0, 30, WORLD_H);

    ctx.fillStyle = a.trackEdge;
    ctx.shadowColor = a.trackEdge;
    ctx.shadowBlur = 16;
    ctx.fillRect(28, 0, 2, WORLD_H);
    ctx.fillRect(WORLD_W - 30, 0, 2, WORLD_H);
    ctx.shadowBlur = 0;

    // Smoke
    smokePartsRef.current.forEach((p) => {
      const al = 1 - p.t / p.max;
      ctx.beginPath();
      ctx.fillStyle = `rgba(190,196,210,${al * 0.55})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Car shadows
    [carsRef.current.p1, carsRef.current.p2].forEach((c) => {
      const gy = a.ground(c.x);
      const dy = Math.max(0, gy - c.y);
      const alpha = Math.max(0.05, 0.35 - dy / 600);
      const w = CHASSIS_W * (1 + Math.min(0.6, dy / 250));
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(c.x, gy - 2, w / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cars
    drawCar(ctx, carsRef.current.p1);
    drawCar(ctx, carsRef.current.p2);

    // Sparks (drawn over cars)
    sparksRef.current.forEach((p) => {
      const al = 1 - p.t / p.max;
      ctx.fillStyle = p.c;
      ctx.globalAlpha = al;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, c: Car) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);

    // Car glow
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 18;

    // Chassis (rounded)
    const w = CHASSIS_W, h = CHASSIS_H, r = 9;
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
    const chassisGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    chassisGrad.addColorStop(0, c.color);
    chassisGrad.addColorStop(1, '#0c0820');
    ctx.fillStyle = chassisGrad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();

    // Stripe
    ctx.fillStyle = c.rim;
    ctx.fillRect(-w / 2 + 8, -3, w - 16, 6);

    // Headlights (front)
    ctx.fillStyle = '#fff7c2';
    ctx.shadowColor = '#fff7c2';
    ctx.shadowBlur = 14;
    ctx.fillRect(w / 2 - 5, -h / 2 + 4, 4, 5);
    ctx.fillRect(w / 2 - 5, h / 2 - 9, 4, 5);
    ctx.shadowBlur = 0;

    // Head
    ctx.beginPath();
    ctx.arc(0, HEAD_DY, HEAD_R, 0, Math.PI * 2);
    ctx.fillStyle = c.driver;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
    // Helmet top
    ctx.beginPath();
    ctx.arc(0, HEAD_DY, HEAD_R, Math.PI, 0);
    ctx.fillStyle = c.color;
    ctx.fill();
    // Visor
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-HEAD_R * 0.65, HEAD_DY - 2, HEAD_R * 1.3, 3);

    // Wheels
    [[-WHEEL_DX, WHEEL_DY], [WHEEL_DX, WHEEL_DY]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#0c0c12';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, WHEEL_R * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#0c0c12';
      ctx.fill();
      // Spinning spoke (visual)
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate((c.x + lx) * 0.05);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-WHEEL_R * 0.55, 0);
      ctx.lineTo(WHEEL_R * 0.55, 0);
      ctx.stroke();
      ctx.restore();
    });

    // Exhaust pipe
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
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
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
    onPointerCancel: () => { inputRef.current[key] = false; },
    onPointerLeave:  () => { inputRef.current[key] = false; },
  });

  if (!mode) {
    return (
      <UltraCard className="p-6 max-w-2xl mx-auto text-center space-y-5">
        <h2 className="font-display text-3xl font-bold text-gradient">Crash It</h2>
        <p className="text-sm text-muted-foreground">
          Crush the opponent's head with your chassis. Don't let your own head touch
          the ground, walls, or the other car. First to {TARGET_POINTS} wins.
          Arena changes every round.
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
          <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{arenaLabel}</span>
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
