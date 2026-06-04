import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';
import { useGame } from '@/contexts/GameContext';
import { Trophy, RotateCcw, Bot, Users, ChevronUp, ChevronDown, LogOut } from 'lucide-react';

/**
 * Crash It — 3D "Drive Ahead"-style arena.
 * - Top-down angled camera over a stadium arena.
 * - Two cars with exposed driver heads. First clean hit on the opponent's
 *   head (by a wheel or by the ground) scores a point. First to 5 wins.
 * - Modes: vs Bot (single set of controls), vs Friend (split controls).
 * - Controls: per-car FORWARD (tilts/drives one way) + BACKWARD (the other).
 */

type Mode = 'bot' | 'friend';

interface CarState {
  // World position (x = left/right, y = up, z = forward/back). Arena lies on XZ plane.
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  // Rotation around Z axis (pitch in our XZ plane sense — tipping forward/back)
  rot: number;
  rotVel: number;
  // Which way the car faces along X (+1 or -1)
  facing: 1 | -1;
  color: string;
  dead: boolean;
}

const ARENA_HALF_W = 6;          // x bounds
const ARENA_HALF_D = 3.2;        // z bounds (depth)
const GROUND_Y = 0;
const CAR_W = 1.4;
const CAR_H = 0.5;
const CAR_D = 0.9;
const WHEEL_R = 0.32;
const HEAD_R = 0.22;
const HEAD_OFFSET = CAR_H / 2 + HEAD_R + 0.02; // local y of head above chassis center
const GRAVITY = -14;
const TARGET_POINTS = 5;

function makeCar(x: number, color: string, facing: 1 | -1): CarState {
  return {
    pos: new THREE.Vector3(x, CAR_H / 2 + WHEEL_R, 0),
    vel: new THREE.Vector3(),
    rot: 0,
    rotVel: 0,
    facing,
    color,
    dead: false,
  };
}

// Input ref shared with the game loop
interface Inputs {
  p1f: boolean; p1b: boolean;
  p2f: boolean; p2b: boolean;
}

const CarMesh: React.FC<{ state: CarState; label: string }> = ({ state, label }) => {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(state.pos);
    group.current.rotation.set(0, state.facing === 1 ? 0 : Math.PI, state.rot * state.facing);
  });
  return (
    <group ref={group}>
      {/* chassis */}
      <RoundedBox args={[CAR_W, CAR_H, CAR_D]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={state.color} metalness={0.4} roughness={0.35} />
      </RoundedBox>
      {/* yellow stripe */}
      <mesh position={[0, CAR_H / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CAR_W * 0.95, 0.18]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffaa00" emissiveIntensity={0.2} />
      </mesh>
      {/* wheels (4) */}
      {[
        [-CAR_W / 2 + 0.25, -CAR_H / 2, CAR_D / 2 - 0.05],
        [ CAR_W / 2 - 0.25, -CAR_H / 2, CAR_D / 2 - 0.05],
        [-CAR_W / 2 + 0.25, -CAR_H / 2, -CAR_D / 2 + 0.05],
        [ CAR_W / 2 - 0.25, -CAR_H / 2, -CAR_D / 2 + 0.05],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.18, 18]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
      {/* exhaust */}
      <mesh position={[-CAR_W / 2 - 0.05, CAR_H / 2 - 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.18, 10]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* driver head */}
      <mesh position={[0.1, HEAD_OFFSET, 0]} castShadow>
        <sphereGeometry args={[HEAD_R, 24, 24]} />
        <meshStandardMaterial color="#ffd9b3" roughness={0.6} />
      </mesh>
      {/* helmet rim */}
      <mesh position={[0.1, HEAD_OFFSET + HEAD_R * 0.4, 0]} castShadow>
        <sphereGeometry args={[HEAD_R * 1.02, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={state.color} metalness={0.6} roughness={0.25} />
      </mesh>
      {/* glow */}
      <pointLight color={state.color} intensity={0.6} distance={2.5} position={[0, 0.4, 0]} />
    </group>
  );
};

const Arena: React.FC = () => {
  return (
    <group>
      {/* floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]}>
        <planeGeometry args={[ARENA_HALF_W * 2.4, ARENA_HALF_D * 2.4]} />
        <meshStandardMaterial color="#2a1745" roughness={0.9} />
      </mesh>
      {/* stadium track inlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.005, 0]}>
        <planeGeometry args={[ARENA_HALF_W * 2, ARENA_HALF_D * 2]} />
        <meshStandardMaterial color="#3a1f5e" roughness={0.85} />
      </mesh>
      {/* glowing edge strip */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.02, s * ARENA_HALF_D]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_HALF_W * 2, 0.08]} />
          <meshStandardMaterial color="#ff3b6b" emissive="#ff3b6b" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * ARENA_HALF_W, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, ARENA_HALF_D * 2]} />
          <meshStandardMaterial color="#36b3ff" emissive="#36b3ff" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* walls (invisible-ish low) */}
      {[-1, 1].map((s) => (
        <mesh key={`wx${s}`} position={[s * ARENA_HALF_W, 0.35, 0]} castShadow>
          <boxGeometry args={[0.15, 0.7, ARENA_HALF_D * 2]} />
          <meshStandardMaterial color="#1a0d2e" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`wz${s}`} position={[0, 0.35, s * ARENA_HALF_D]} castShadow>
          <boxGeometry args={[ARENA_HALF_W * 2, 0.7, 0.15]} />
          <meshStandardMaterial color="#1a0d2e" />
        </mesh>
      ))}
      {/* center obstacle (small pillar — gives ramp feel) */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#5a2b8c" roughness={0.7} />
      </mesh>
    </group>
  );
};

const GameScene: React.FC<{
  carsRef: React.MutableRefObject<{ p1: CarState; p2: CarState }>;
  inputs: React.MutableRefObject<Inputs>;
  mode: Mode;
  onHit: (loser: 1 | 2) => void;
  paused: boolean;
}> = ({ carsRef, inputs, mode, onHit, paused }) => {
  const lastHit = useRef(false);

  useFrame((_, dtRaw) => {
    if (paused) return;
    const dt = Math.min(dtRaw, 0.033);

    const { p1, p2 } = carsRef.current;

    // Bot AI for p2 in solo
    let p2f = inputs.current.p2f, p2b = inputs.current.p2b;
    if (mode === 'bot') {
      const dx = p1.pos.x - p2.pos.x;
      p2f = false; p2b = false;
      // Drive toward p1
      if (Math.abs(dx) > 0.6) {
        // facing -1 means forward = -x, so we want forward when dx<0
        if ((p2.facing === -1 && dx < 0) || (p2.facing === 1 && dx > 0)) p2f = true;
        else p2b = true;
      }
      // backflip jump occasionally if we're being mounted
      if (Math.random() < 0.012 && Math.abs(dx) < 1.2) p2b = true;
    }

    const applyDrive = (c: CarState, f: boolean, b: boolean) => {
      const grounded = c.pos.y <= CAR_H / 2 + WHEEL_R + 0.02;
      const fwd = c.facing; // +1 right, -1 left
      const accel = 22;
      if (grounded) {
        if (f) { c.vel.x += accel * fwd * dt; c.rotVel -= 1.2 * fwd * dt; }
        if (b) { c.vel.x -= accel * fwd * dt; c.rotVel += 1.8 * fwd * dt; }
      } else {
        // air rotation control
        if (f) c.rotVel -= 4 * fwd * dt;
        if (b) c.rotVel += 4 * fwd * dt;
      }
    };

    applyDrive(p1, inputs.current.p1f, inputs.current.p1b);
    applyDrive(p2, p2f, p2b);

    const step = (c: CarState) => {
      c.vel.y += GRAVITY * dt;
      c.pos.addScaledVector(c.vel, dt);
      c.rot += c.rotVel * dt;
      // friction
      c.vel.x *= 0.985;
      c.vel.z *= 0.95;
      c.rotVel *= 0.96;
      // pin to z=0 plane (2.5D)
      c.pos.z = 0;
      // walls
      const limX = ARENA_HALF_W - CAR_W / 2;
      if (c.pos.x < -limX) { c.pos.x = -limX; c.vel.x = Math.abs(c.vel.x) * 0.4; c.rotVel += 1; }
      if (c.pos.x >  limX) { c.pos.x =  limX; c.vel.x = -Math.abs(c.vel.x) * 0.4; c.rotVel -= 1; }
      // ground
      const groundY = CAR_H / 2 + WHEEL_R;
      if (c.pos.y < groundY) {
        c.pos.y = groundY;
        c.vel.y = Math.max(0, -c.vel.y * 0.25);
        // settle rotation
        const target = Math.round(c.rot / (Math.PI * 2)) * Math.PI * 2;
        c.rot += (target - c.rot) * 0.18;
        c.rotVel *= 0.7;
      }
    };
    step(p1);
    step(p2);

    // Head world positions
    const headWorld = (c: CarState) => {
      const local = new THREE.Vector3(0.1 * c.facing, HEAD_OFFSET, 0);
      const m = new THREE.Matrix4()
        .makeRotationZ(c.rot * c.facing)
        .setPosition(c.pos);
      return local.applyMatrix4(m);
    };
    const h1 = headWorld(p1);
    const h2 = headWorld(p2);

    const headTouchesGround = (h: THREE.Vector3) => h.y <= 0.05 + HEAD_R * 0.4;

    // Wheel positions for each car
    const wheelHits = (attacker: CarState, victimHead: THREE.Vector3) => {
      const cos = Math.cos(attacker.rot * attacker.facing);
      const sin = Math.sin(attacker.rot * attacker.facing);
      const locals: [number, number][] = [
        [-CAR_W / 2 + 0.25, -CAR_H / 2],
        [ CAR_W / 2 - 0.25, -CAR_H / 2],
      ];
      for (const [lx, ly] of locals) {
        const wx = attacker.pos.x + (lx * cos - ly * sin) * attacker.facing;
        const wy = attacker.pos.y + (lx * sin + ly * cos);
        const dx = wx - victimHead.x, dy = wy - victimHead.y;
        if (dx * dx + dy * dy < (WHEEL_R + HEAD_R) * (WHEEL_R + HEAD_R)) return true;
      }
      return false;
    };

    if (!lastHit.current) {
      let loser: 1 | 2 | null = null;
      if (headTouchesGround(h1) || wheelHits(p2, h1)) loser = 1;
      else if (headTouchesGround(h2) || wheelHits(p1, h2)) loser = 2;
      if (loser) {
        lastHit.current = true;
        onHit(loser);
        setTimeout(() => { lastHit.current = false; }, 200);
      }
    }
  });

  return null;
};

const CrashIt: React.FC = () => {
  const { updateGameStats } = useGame();
  const [mode, setMode] = useState<Mode | null>(null);
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [paused, setPaused] = useState(false);

  const carsRef = useRef<{ p1: CarState; p2: CarState }>({
    p1: makeCar(-ARENA_HALF_W * 0.55, '#ff3b6b', 1),
    p2: makeCar( ARENA_HALF_W * 0.55, '#36b3ff', -1),
  });
  const inputs = useRef<Inputs>({ p1f: false, p1b: false, p2f: false, p2b: false });
  const keysRef = useRef<Record<string, boolean>>({});

  const resetRound = useCallback(() => {
    carsRef.current = {
      p1: makeCar(-ARENA_HALF_W * 0.55, '#ff3b6b', 1),
      p2: makeCar( ARENA_HALF_W * 0.55, '#36b3ff', -1),
    };
  }, []);

  const startGame = (m: Mode) => {
    setMode(m); setScore({ p1: 0, p2: 0 }); setWinner(null); setPaused(false);
    resetRound();
  };

  const handleHit = useCallback((loser: 1 | 2) => {
    setScore((s) => {
      const next = loser === 2 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 };
      if (next.p1 >= TARGET_POINTS) {
        setWinner(1);
        updateGameStats('crash-it', next.p1 * 200, 60).catch(() => {});
      } else if (next.p2 >= TARGET_POINTS) {
        setWinner(2);
        updateGameStats('crash-it', next.p1 * 100, 60).catch(() => {});
      } else {
        setTimeout(resetRound, 800);
      }
      return next;
    });
  }, [resetRound, updateGameStats]);

  // Keyboard bindings
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === 'd' || k === 'arrowright') inputs.current.p1f = true;
      if (k === 'a' || k === 'arrowleft')  inputs.current.p1b = true;
      if (mode === 'friend') {
        if (k === 'arrowright') inputs.current.p2f = true;
        if (k === 'arrowleft')  inputs.current.p2b = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      if (k === 'd' || k === 'arrowright') inputs.current.p1f = false;
      if (k === 'a' || k === 'arrowleft')  inputs.current.p1b = false;
      if (mode === 'friend') {
        if (k === 'arrowright') inputs.current.p2f = false;
        if (k === 'arrowleft')  inputs.current.p2b = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [mode]);

  // Helper to wire press/release for on-screen buttons
  const press = (key: keyof Inputs) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); inputs.current[key] = true; },
    onPointerUp:   (e: React.PointerEvent) => { e.preventDefault(); inputs.current[key] = false; },
    onPointerLeave:() => { inputs.current[key] = false; },
    onPointerCancel:() => { inputs.current[key] = false; },
  });

  if (!mode) {
    return (
      <UltraCard className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="font-display text-3xl font-bold text-gradient">Crash It 3D</h2>
        <p className="text-sm text-muted-foreground">
          Smash your wheels into the opponent's exposed head. Don't let yours touch the ground. First to {TARGET_POINTS} wins.
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
          Solo: A / D &middot; Friend P2: ← / → &middot; Or use the on-screen buttons
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
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setMode(null); setWinner(null); }}>
          <LogOut className="w-4 h-4 mr-1" /> Exit
        </Button>
      </div>

      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border bg-[#0a0518] shadow-premium">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 5.2, 7.8], fov: 38 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[ '#0a0518' ]} />
          <fog attach="fog" args={[ '#0a0518', 14, 28 ]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[6, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />
          <pointLight position={[0, 4, -4]} color="#ff3b6b" intensity={0.5} />
          <pointLight position={[0, 4,  4]} color="#36b3ff" intensity={0.5} />
          <Suspense fallback={null}>
            <Arena />
            <CarMesh state={carsRef.current.p1} label="P1" />
            <CarMesh state={carsRef.current.p2} label="P2" />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={20} blur={2} far={4} />
            <Environment preset="city" />
          </Suspense>
          <GameScene
            carsRef={carsRef}
            inputs={inputs}
            mode={mode}
            onHit={handleHit}
            paused={paused || !!winner}
          />
        </Canvas>

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

      {/* On-screen controls. Solo: P1 only (4 small buttons). Friend: both. */}
      <div className={`grid gap-3 ${mode === 'friend' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
          <p className="text-xs font-display text-[hsl(var(--destructive))]">PLAYER 1</p>
          <div className="flex gap-3">
            <Button size="lg" variant="outline" className="h-14 w-14 p-0" {...press('p1b')} aria-label="P1 back">
              <ChevronDown className="w-7 h-7" />
            </Button>
            <Button size="lg" variant="gaming" className="h-14 w-14 p-0" {...press('p1f')} aria-label="P1 forward">
              <ChevronUp className="w-7 h-7" />
            </Button>
          </div>
        </div>
        {mode === 'friend' && (
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card/40">
            <p className="text-xs font-display text-[hsl(var(--primary))]">PLAYER 2</p>
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="h-14 w-14 p-0" {...press('p2b')} aria-label="P2 back">
                <ChevronDown className="w-7 h-7" />
              </Button>
              <Button size="lg" variant="default" className="h-14 w-14 p-0" {...press('p2f')} aria-label="P2 forward">
                <ChevronUp className="w-7 h-7" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrashIt;
