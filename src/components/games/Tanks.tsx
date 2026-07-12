import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Target, Trophy, RefreshCw, Crosshair } from 'lucide-react';
import { playSfx } from '@/lib/sfx';
import { useGame } from '@/contexts/GameContext';

interface TanksProps {
  onScoreUpdate?: (score: number) => void;
}

/* ─────────── constants (2D sim, projected to 3D X/Z plane) ─────────── */
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

// world scale: 1 px = 0.1 unit → arena is 72 × 48 units
const S = 0.1;
const WORLD_W = ARENA_W * S;
const WORLD_H = ARENA_H * S;
const px = (v: number) => v * S;

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
  turretRecoil: number;
  input: { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean; targetAngle: number | null };
};
type Bullet = { id: number; owner: 1 | 2; pos: Vec; vel: Vec; bounces: number; bornAt: number };
type Particle = { id: number; x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; y0: number };
type Wall = { x: number; y: number; w: number; h: number };
type Mode = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

/* ─────────── map ─────────── */
function buildMap(): Wall[] {
  const walls: Wall[] = [];
  const count = 8 + Math.floor(Math.random() * 5);
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

function tankBlocked(pos: Vec, walls: Wall[]) {
  if (pos.x - TANK_SIZE / 2 < 0 || pos.x + TANK_SIZE / 2 > ARENA_W) return true;
  if (pos.y - TANK_SIZE / 2 < 0 || pos.y + TANK_SIZE / 2 > ARENA_H) return true;
  const half = TANK_SIZE / 2;
  for (const w of walls) {
    if (pos.x - half < w.x + w.w && pos.x + half > w.x && pos.y - half < w.y + w.h && pos.y + half > w.y) return true;
  }
  return false;
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

/* ─────────── sensors ─────────── */
// Returns distance in px until a wall or arena border is hit along a ray.
function rayDistance(from: Vec, angle: number, walls: Wall[], maxDist = 120): number {
  const step = 6;
  const cx = Math.cos(angle), sy = Math.sin(angle);
  for (let d = 0; d <= maxDist; d += step) {
    const x = from.x + cx * d;
    const y = from.y + sy * d;
    if (x < 4 || x > ARENA_W - 4 || y < 4 || y > ARENA_H - 4) return d;
    for (const w of walls) {
      if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return d;
    }
  }
  return maxDist;
}

/* ─────────── shared game state ─────────── */
interface AiPlan {
  move: number;
  nextThink: number;
  lastShot: number;
  lastPos: Vec;
  stillSince: number;
  escapeUntil: number;
  escapeTurn: number;   // -1 left, +1 right
  wanderTarget: Vec | null;
}
interface GameStateRef {
  tanks: [Tank, Tank];
  bullets: Bullet[];
  particles: Particle[];
  walls: Wall[];
  bulletId: number;
  particleId: number;
  aiPlan: AiPlan;
  shake: number;
  onHit?: (winnerScores: [number, number]) => void;
  onWin?: (winner: 1 | 2) => void;
  difficulty: Difficulty;
  twoPlayer: boolean;
  running: boolean;
}

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
  turretRecoil: 0,
  input: { up: false, down: false, left: false, right: false, fire: false, targetAngle: null },
});

/* ─────────── 3D scene ─────────── */
const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[WORLD_W, WORLD_H]} />
      <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
    </mesh>
    {/* grid overlay */}
    <gridHelper args={[Math.max(WORLD_W, WORLD_H), Math.max(WORLD_W, WORLD_H) / (CELL * S), '#334155', '#1e293b']} position={[0, 0.01, 0]} />
    {/* arena border walls */}
    {[
      { x: 0, y: -WORLD_H / 2 - 0.5, w: WORLD_W + 2, h: 1 },
      { x: 0, y: WORLD_H / 2 + 0.5, w: WORLD_W + 2, h: 1 },
      { x: -WORLD_W / 2 - 0.5, y: 0, w: 1, h: WORLD_H + 2 },
      { x: WORLD_W / 2 + 0.5, y: 0, w: 1, h: WORLD_H + 2 },
    ].map((b, i) => (
      <mesh key={i} position={[b.x, 1, b.y]} castShadow receiveShadow>
        <boxGeometry args={[b.w, 2, b.h]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    ))}
  </>
);

const WallMesh: React.FC<{ w: Wall }> = ({ w }) => {
  const wx = px(w.x + w.w / 2) - WORLD_W / 2;
  const wz = px(w.y + w.h / 2) - WORLD_H / 2;
  return (
    <mesh position={[wx, 1.1, wz]} castShadow receiveShadow>
      <boxGeometry args={[px(w.w), 2.2, px(w.h)]} />
      <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.3} />
    </mesh>
  );
};

const TankMesh: React.FC<{ tankIndex: 0 | 1; gs: React.MutableRefObject<GameStateRef> }> = ({ tankIndex, gs }) => {
  const groupRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMeshRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const t = gs.current.tanks[tankIndex];
    if (!t || !groupRef.current) return;
    const wx = px(t.pos.x) - WORLD_W / 2;
    const wz = px(t.pos.y) - WORLD_H / 2;
    groupRef.current.position.set(wx, 0.7, wz);
    groupRef.current.rotation.y = -t.angle;
    groupRef.current.visible = t.alive;
    if (turretRef.current) {
      turretRef.current.position.x = -Math.min(0.35, t.turretRecoil * 0.01);
    }
    const flashOn = t.muzzleFlash > 0;
    if (flashRef.current) flashRef.current.intensity = flashOn ? (t.muzzleFlash / 120) * 6 : 0;
    if (flashMeshRef.current) {
      (flashMeshRef.current.material as THREE.MeshBasicMaterial).opacity = flashOn ? t.muzzleFlash / 120 : 0;
      flashMeshRef.current.scale.setScalar(flashOn ? 0.4 + (t.muzzleFlash / 120) * 0.6 : 0.01);
    }
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity = t.alive ? 0.25 : 0;
    }
  });

  const t = gs.current.tanks[tankIndex];
  const color = tankIndex === 0 ? '#22d3ee' : '#f43f5e';
  const accent = tankIndex === 0 ? '#0e7490' : '#9f1239';

  return (
    <group ref={groupRef}>
      {/* hull */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 1, 2.2]} />
        <meshStandardMaterial ref={bodyMatRef} color={accent} metalness={0.5} roughness={0.5} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      {/* tread bulges */}
      <mesh castShadow position={[0, -0.15, 1.25]}>
        <boxGeometry args={[3.0, 0.7, 0.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, -0.15, -1.25]}>
        <boxGeometry args={[3.0, 0.7, 0.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* turret */}
      <group ref={turretRef} position={[0, 0.55, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.85, 1, 0.7, 24]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={0.15} />
        </mesh>
        {/* barrel */}
        <mesh castShadow position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 2, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.35} />
        </mesh>
        {/* muzzle flash */}
        <pointLight ref={flashRef} position={[2.7, 0, 0]} color="#fde047" distance={6} intensity={0} />
        <mesh ref={flashMeshRef} position={[2.7, 0, 0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
};

const Bullets: React.FC<{ gs: React.MutableRefObject<GameStateRef>; tick: number }> = ({ gs, tick }) => {
  const bullets = gs.current.bullets;
  const refs = useRef<Map<number, THREE.Group>>(new Map());

  useFrame(() => {
    for (const b of gs.current.bullets) {
      const g = refs.current.get(b.id);
      if (!g) continue;
      const wx = px(b.pos.x) - WORLD_W / 2;
      const wz = px(b.pos.y) - WORLD_H / 2;
      g.position.set(wx, 0.7, wz);
    }
  });

  return (
    <>
      {bullets.map((b) => {
        const c = b.owner === 1 ? '#22d3ee' : '#f43f5e';
        return (
          <group
            key={b.id}
            ref={(el) => {
              if (el) refs.current.set(b.id, el);
              else refs.current.delete(b.id);
            }}
          >
            <mesh castShadow>
              <sphereGeometry args={[px(BULLET_R) * 1.6, 12, 12]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.6} metalness={0.6} roughness={0.2} />
            </mesh>
            <pointLight color={c} intensity={2.2} distance={4} />
          </group>
        );
      })}
    </>
  );
};

const Particles: React.FC<{ gs: React.MutableRefObject<GameStateRef>; tick: number }> = ({ gs, tick }) => {
  const parts = gs.current.particles;
  const refs = useRef<Map<number, THREE.Mesh>>(new Map());
  useFrame(() => {
    for (const p of gs.current.particles) {
      const m = refs.current.get(p.id);
      if (!m) continue;
      const wx = px(p.x) - WORLD_W / 2;
      const wz = px(p.y) - WORLD_H / 2;
      m.position.set(wx, 0.4 + p.y0, wz);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - p.life / p.max);
    }
  });
  return (
    <>
      {parts.map((p) => (
        <mesh
          key={p.id}
          ref={(el) => {
            if (el) refs.current.set(p.id, el);
            else refs.current.delete(p.id);
          }}
        >
          <sphereGeometry args={[p.size * 0.08, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent />
        </mesh>
      ))}
    </>
  );
};

const CameraShake: React.FC<{ gs: React.MutableRefObject<GameStateRef> }> = ({ gs }) => {
  const { camera } = useThree();
  const base = useRef<THREE.Vector3>(new THREE.Vector3(0, 34, 26));
  useEffect(() => {
    camera.position.copy(base.current);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  useFrame(() => {
    const s = gs.current.shake;
    const jx = s > 0 ? (Math.random() - 0.5) * s * 0.1 : 0;
    const jz = s > 0 ? (Math.random() - 0.5) * s * 0.1 : 0;
    camera.position.set(base.current.x + jx, base.current.y, base.current.z + jz);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const GameLoop: React.FC<{
  gs: React.MutableRefObject<GameStateRef>;
  bump: () => void;
}> = ({ gs, bump }) => {
  const lastRef = useRef(performance.now());
  const lastBumpRef = useRef(0);

  useFrame(() => {
    if (!gs.current.running) return;
    const now = performance.now();
    const raw = Math.min(50, now - lastRef.current);
    lastRef.current = now;
    const dt = raw / 16.67;
    const { tanks, walls } = gs.current;

    const spawnParticles = (x: number, y: number, color: string, count: number, spread = 3, y0 = 0) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * spread + 0.6;
        gs.current.particles.push({
          id: ++gs.current.particleId,
          x, y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 0, max: 400 + Math.random() * 400, color,
          size: 1.5 + Math.random() * 2.5,
          y0,
        });
      }
    };

    const fire = (t: Tank) => {
      if (!t.alive || now - t.lastFire < FIRE_COOLDOWN_MS) return;
      t.lastFire = now;
      t.muzzleFlash = 120;
      t.turretRecoil = 18;
      const nose = TANK_SIZE / 2 + 10;
      gs.current.bullets.push({
        id: ++gs.current.bulletId, owner: t.id,
        pos: { x: t.pos.x + Math.cos(t.angle) * nose, y: t.pos.y + Math.sin(t.angle) * nose },
        vel: { x: Math.cos(t.angle) * BULLET_SPEED, y: Math.sin(t.angle) * BULLET_SPEED },
        bounces: 0, bornAt: now,
      });
      spawnParticles(t.pos.x + Math.cos(t.angle) * nose, t.pos.y + Math.sin(t.angle) * nose, '#fde047', 5, 2.5, 0.4);
      playSfx('pop');
    };

    const stepTank = (t: Tank) => {
      if (!t.alive) return;
      const turn = 0.06 * dt;
      const speed = TANK_SPEED * dt;
      if (t.input.targetAngle !== null) {
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
        if (Math.random() < 0.25) spawnParticles(t.pos.x, t.pos.y, '#64748b', 1, 0.4, 0);
      }
      // hard clamp — never allow leaving the arena regardless of state
      const half = TANK_SIZE / 2;
      t.pos.x = Math.max(half, Math.min(ARENA_W - half, t.pos.x));
      t.pos.y = Math.max(half, Math.min(ARENA_H - half, t.pos.y));
      if (t.input.fire) fire(t);
      if (t.muzzleFlash > 0) t.muzzleFlash -= dt * 16;
      if (t.turretRecoil > 0) t.turretRecoil = Math.max(0, t.turretRecoil - dt * 1.4);
    };

    const aiTick = (bot: Tank, target: Tank) => {
      const st = gs.current.aiPlan;
      const diffLvl = gs.current.difficulty;
      const dx = target.pos.x - bot.pos.x;
      const dy = target.pos.y - bot.pos.y;
      const dist = Math.hypot(dx, dy);
      const targetAngle = Math.atan2(dy, dx);
      const hasLos = losClear(bot.pos, target.pos, walls);

      // ---- wall sensors (in pixels of clearance ahead) ----
      const senseAhead = rayDistance(bot.pos, bot.angle, walls, 90);
      const senseLeft  = rayDistance(bot.pos, bot.angle - 0.55, walls, 70);
      const senseRight = rayDistance(bot.pos, bot.angle + 0.55, walls, 70);
      const senseBack  = rayDistance(bot.pos, bot.angle + Math.PI, walls, 60);
      const SAFE = TANK_SIZE * 0.9; // ~24px

      // ---- stuck detection ----
      const moved = Math.hypot(bot.pos.x - st.lastPos.x, bot.pos.y - st.lastPos.y);
      if (moved > 2) { st.lastPos = { ...bot.pos }; st.stillSince = now; }
      const stuck = now - st.stillSince > 600;
      if (stuck && now > st.escapeUntil) {
        st.escapeUntil = now + 700;
        st.escapeTurn = Math.random() < 0.5 ? -1 : 1;
        st.stillSince = now; // avoid re-triggering immediately
      }

      // ---- bullet dodging ----
      let dodgePerpendicular = 0;
      let incomingBullet = false;
      for (const b of gs.current.bullets) {
        if (b.owner === bot.id) continue;
        const bx = b.pos.x - bot.pos.x, by = b.pos.y - bot.pos.y;
        const d = Math.hypot(bx, by);
        if (d < 130) {
          // is bullet roughly heading at us?
          const bl = Math.hypot(b.vel.x, b.vel.y) || 1;
          const towards = (-bx * b.vel.x - by * b.vel.y) / (d * bl);
          if (towards > 0.6) {
            incomingBullet = true;
            const cross = b.vel.x * by - b.vel.y * bx;
            dodgePerpendicular = cross > 0 ? 1 : -1;
            break;
          }
        }
      }

      // ---- decide facing ----
      let desiredAngle = targetAngle;
      const inEscape = now < st.escapeUntil;
      if (inEscape) {
        // face away from closest wall (whichever side has more room)
        desiredAngle = bot.angle + (senseLeft > senseRight ? -0.9 : 0.9) * st.escapeTurn;
      } else if (!hasLos) {
        // pick a wander target near the enemy but reachable
        if (!st.wanderTarget ||
            Math.hypot(bot.pos.x - st.wanderTarget.x, bot.pos.y - st.wanderTarget.y) < 40 ||
            now > st.nextThink) {
          st.wanderTarget = {
            x: Math.max(60, Math.min(ARENA_W - 60, target.pos.x + (Math.random() - 0.5) * 260)),
            y: Math.max(60, Math.min(ARENA_H - 60, target.pos.y + (Math.random() - 0.5) * 260)),
          };
          st.nextThink = now + 1200;
        }
        desiredAngle = Math.atan2(st.wanderTarget.y - bot.pos.y, st.wanderTarget.x - bot.pos.x);
      }

      let diff = desiredAngle - bot.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const aimTol = diffLvl === 'easy' ? 0.14 : diffLvl === 'medium' ? 0.07 : 0.03;
      bot.input.left  = diff < -aimTol;
      bot.input.right = diff > aimTol;
      bot.input.targetAngle = null;

      // ---- decide movement (never drive into a wall) ----
      let move = 0;
      if (inEscape) {
        // reverse if back is clear, else creep forward slowly
        move = senseBack > SAFE ? -1 : (senseAhead > SAFE ? 1 : 0);
      } else if (incomingBullet && dodgePerpendicular !== 0) {
        // strafe by driving forward at an angle (only if we can)
        move = senseAhead > SAFE ? 1 : (senseBack > SAFE ? -1 : 0);
      } else if (hasLos && dist < 220 && Math.abs(diff) < aimTol * 3) {
        // in optimal range and aimed — hold and shoot
        move = 0;
      } else if (hasLos && dist > 340) {
        move = senseAhead > SAFE ? 1 : 0;
      } else if (!hasLos) {
        move = senseAhead > SAFE ? 1 : (senseBack > SAFE ? -1 : 0);
      } else {
        // reposition
        move = senseAhead > SAFE ? 1 : (senseBack > SAFE ? -1 : 0);
      }
      // hard safety: never press forward when almost touching a wall
      if (move === 1 && senseAhead <= SAFE) move = senseBack > SAFE ? -1 : 0;
      if (move === -1 && senseBack <= SAFE) move = 0;

      bot.input.up = move === 1;
      bot.input.down = move === -1;

      // ---- shooting ----
      const aimedAtTarget = (() => {
        let td = targetAngle - bot.angle;
        while (td > Math.PI) td -= Math.PI * 2;
        while (td < -Math.PI) td += Math.PI * 2;
        return Math.abs(td) < (diffLvl === 'hard' ? 0.10 : diffLvl === 'medium' ? 0.18 : 0.30);
      })();
      const canShoot = now - st.lastShot > (diffLvl === 'hard' ? 550 : diffLvl === 'medium' ? 850 : 1250);
      // don't shoot into a wall you're facing point-blank
      const shotClear = rayDistance(bot.pos, bot.angle, walls, 400) > TANK_SIZE + 8;
      if (aimedAtTarget && hasLos && canShoot && shotClear) {
        bot.input.fire = true;
        st.lastShot = now;
      } else {
        bot.input.fire = false;
      }
    };


    const stepBullets = () => {
      const { bullets, tanks } = gs.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (now - b.bornAt > BULLET_LIFE_MS) { bullets.splice(i, 1); continue; }
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        // arena border bounce
        if (b.pos.x < BULLET_R || b.pos.x > ARENA_W - BULLET_R) {
          b.vel.x *= -1; b.bounces++;
          b.pos.x = Math.max(BULLET_R, Math.min(ARENA_W - BULLET_R, b.pos.x));
          spawnParticles(b.pos.x, b.pos.y, '#fbbf24', 3, 1.5, 0.4);
          playSfx('tick');
          if (b.bounces > MAX_BOUNCES) { bullets.splice(i, 1); continue; }
        }
        if (b.pos.y < BULLET_R || b.pos.y > ARENA_H - BULLET_R) {
          b.vel.y *= -1; b.bounces++;
          b.pos.y = Math.max(BULLET_R, Math.min(ARENA_H - BULLET_R, b.pos.y));
          spawnParticles(b.pos.x, b.pos.y, '#fbbf24', 3, 1.5, 0.4);
          playSfx('tick');
          if (b.bounces > MAX_BOUNCES) { bullets.splice(i, 1); continue; }
        }
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
            spawnParticles(b.pos.x, b.pos.y, '#fbbf24', 4, 1.8, 0.4);
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
            gs.current.shake = 16;
            spawnParticles(t.pos.x, t.pos.y, t.color, 40, 5, 0.5);
            spawnParticles(t.pos.x, t.pos.y, '#fbbf24', 25, 4, 0.7);
            gs.current.onHit?.([tanks[0].score, tanks[1].score]);
            bullets.splice(i, 1);
            if (other.score >= HITS_TO_WIN) {
              gs.current.onWin?.(other.id);
              gs.current.running = false;
            }
            break;
          }
        }
      }
      const parts = gs.current.particles;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt * 16;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        if (p.life >= p.max) parts.splice(i, 1);
      }
      if (gs.current.shake > 0) gs.current.shake -= dt * 1.2;
    };

    const respawn = (t: Tank) => {
      if (t.alive || now < t.respawnAt) return;
      t.alive = true;
      t.pos = t.id === 1 ? { x: 70, y: 70 } : { x: ARENA_W - 70, y: ARENA_H - 70 };
      t.angle = t.id === 1 ? 0 : Math.PI;
      spawnParticles(t.pos.x, t.pos.y, t.color, 24, 3, 0.5);
      playSfx('powerup');
    };

    if (!gs.current.twoPlayer && tanks[1]?.alive) aiTick(tanks[1], tanks[0]);
    stepTank(tanks[0]);
    stepTank(tanks[1]);
    stepBullets();
    respawn(tanks[0]);
    respawn(tanks[1]);

    // request React re-render at ~30 fps to sync bullets/particles children
    if (now - lastBumpRef.current > 33) {
      lastBumpRef.current = now;
      bump();
    }
  });

  return null;
};

/* ─────────── main component ─────────── */
const Tanks: React.FC<TanksProps> = ({ onScoreUpdate }) => {
  const { addCoins } = useGame();
  const [mode, setMode] = useState<Mode>('menu');
  const [twoPlayer, setTwoPlayer] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => (n + 1) % 1000000), []);

  const gs = useRef<GameStateRef>({
    tanks: [makeTank(1, 0), makeTank(2, 0)],
    bullets: [],
    particles: [],
    walls: buildMap(),
    bulletId: 0,
    particleId: 0,
    aiPlan: { move: 1, nextThink: 0, lastShot: 0, lastPos: { x: 0, y: 0 }, stillSince: 0, escapeUntil: 0, escapeTurn: 1, wanderTarget: null },
    shake: 0,
    difficulty: 'medium',
    twoPlayer: false,
    running: false,
  });

  const initRound = useCallback((resetScore: boolean) => {
    gs.current.walls = buildMap();
    gs.current.tanks = [makeTank(1, resetScore ? 0 : scores[0]), makeTank(2, resetScore ? 0 : scores[1])];
    gs.current.bullets = [];
    gs.current.particles = [];
    gs.current.bulletId = 0;
    gs.current.particleId = 0;
    gs.current.aiPlan = { move: 1, nextThink: 0, lastShot: 0, lastPos: { x: ARENA_W - 70, y: ARENA_H - 70 }, stillSince: performance.now(), escapeUntil: 0, escapeTurn: 1, wanderTarget: null };
    gs.current.shake = 0;
    gs.current.difficulty = difficulty;
    gs.current.twoPlayer = twoPlayer;
    gs.current.onHit = (s) => { setScores(s); onScoreUpdate?.(s[0] * 100); };
    gs.current.onWin = (w) => {
      setWinner(w);
      setMode('gameover');
      if (w === 1) { addCoins(50); playSfx('win'); } else playSfx('lose');
    };
    if (resetScore) setScores([0, 0]);
    setWinner(0);
    bump();
  }, [scores, difficulty, twoPlayer, addCoins, onScoreUpdate, bump]);

  const startGame = () => {
    initRound(true);
    gs.current.running = true;
    setMode('playing');
    playSfx('powerup');
  };

  /* keyboard */
  useEffect(() => {
    if (mode !== 'playing') return;
    const p1 = () => gs.current.tanks[0];
    const p2 = () => gs.current.tanks[1];
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
      const t = gs.current.tanks[player - 1];
      if (!t) return;
      const norm = d / max;
      if (norm > 0.25) {
        t.input.targetAngle = Math.atan2(dy, dx);
        t.input.up = true; t.input.down = false;
      } else {
        t.input.targetAngle = null;
        t.input.up = false; t.input.down = false;
      }
    };
    const reset = () => {
      setKnob({ x: 0, y: 0 });
      const t = gs.current.tanks[player - 1];
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
          className={`absolute top-1/2 left-1/2 w-12 h-12 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg ${player === 1 ? 'bg-cyan-400' : 'bg-rose-500'}`}
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    );
  };

  const FireBtn: React.FC<{ player: 1 | 2 }> = ({ player }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); const t = gs.current.tanks[player - 1]; if (t) t.input.fire = true; }}
      onPointerUp={() => { const t = gs.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      onPointerLeave={() => { const t = gs.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      onPointerCancel={() => { const t = gs.current.tanks[player - 1]; if (t) t.input.fire = false; }}
      className={`w-20 h-20 rounded-full border-2 flex items-center justify-center active:scale-90 transition-transform touch-none shadow-lg ${player === 1 ? 'text-cyan-400 border-cyan-400 bg-cyan-500/20' : 'text-rose-400 border-rose-400 bg-rose-500/20'}`}
    >
      <Crosshair className="w-8 h-8" />
    </button>
  );

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 w-full max-w-lg animate-slide-up-fade">
        <h2 className="font-display text-3xl font-bold text-gradient animate-text-pop">TANKS 3D</h2>
        <p className="text-sm text-muted-foreground text-center">
          Fully 3D arena. First to <strong>{HITS_TO_WIN}</strong> hits wins. Bullets bounce — use walls for cover!
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

      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border animate-slide-up-fade w-full max-w-[720px] aspect-[3/2] bg-slate-950">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 34, 26], fov: 45 }}>
          <color attach="background" args={['#020617']} />
          <fog attach="fog" args={['#020617', 40, 90]} />
          <hemisphereLight args={['#93c5fd', '#0f172a', 0.55]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[20, 30, 15]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-45}
            shadow-camera-right={45}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
            shadow-camera-near={1}
            shadow-camera-far={80}
          />
          <Suspense fallback={null}>
            <Ground />
            {gs.current.walls.map((w, i) => <WallMesh key={i} w={w} />)}
            <TankMesh tankIndex={0} gs={gs} />
            <TankMesh tankIndex={1} gs={gs} />
            <Bullets gs={gs} tick={0} />
            <Particles gs={gs} tick={0} />
          </Suspense>
          <CameraShake gs={gs} />
          <GameLoop gs={gs} bump={bump} />
        </Canvas>
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
