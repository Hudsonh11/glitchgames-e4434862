import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Types ───
interface PlatformData {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  type: 'normal' | 'kill' | 'moving' | 'disappearing' | 'bouncy' | 'speed' | 'checkpoint' | 'finish';
  moveAxis?: 'x' | 'y' | 'z';
  moveRange?: number;
  moveSpeed?: number;
}

const COLORS = {
  normal: '#5B8DEF',
  kill: '#FF4444',
  moving: '#FFA500',
  disappearing: '#BB86FC',
  bouncy: '#00E676',
  speed: '#00BCD4',
  checkpoint: '#FFD700',
  finish: '#76FF03',
};

// ─── Level Generation ───
const generateLevel = (levelNum: number): PlatformData[] => {
  const platforms: PlatformData[] = [];
  const difficulty = Math.min(levelNum / 10, 1);
  const baseY = levelNum * 2;
  let x = 0, y = baseY, z = 0;

  platforms.push({ position: [x, y, z], size: [4, 0.5, 4], color: COLORS.checkpoint, type: 'checkpoint' });

  const numPlatforms = 6 + Math.floor(levelNum / 5) * 2;
  for (let i = 0; i < numPlatforms; i++) {
    const dir = Math.random();
    if (dir < 0.4) x += 2 + Math.random() * (2 + difficulty * 2);
    else if (dir < 0.7) z += 2 + Math.random() * (2 + difficulty * 2);
    else { x += 1 + Math.random() * 2; z += 1 + Math.random() * 2; }
    y += (Math.random() - 0.3) * (1 + difficulty);

    const typeRoll = Math.random();
    let type: PlatformData['type'] = 'normal';
    let moveAxis: 'x' | 'y' | 'z' | undefined;
    let moveRange: number | undefined;
    let moveSpeed: number | undefined;

    if (typeRoll < 0.05 + difficulty * 0.08) {
      type = 'kill';
    } else if (typeRoll < 0.15 + difficulty * 0.1) {
      type = 'moving';
      moveAxis = ['x', 'z'][Math.floor(Math.random() * 2)] as 'x' | 'z';
      moveRange = 1.5 + difficulty * 2;
      moveSpeed = 0.5 + difficulty;
    } else if (typeRoll < 0.22 + difficulty * 0.08) {
      type = 'disappearing';
    } else if (typeRoll < 0.28 + difficulty * 0.05) {
      type = 'bouncy';
    } else if (typeRoll < 0.32 + difficulty * 0.03) {
      type = 'speed';
    }

    if ((i + 1) % 5 === 0 && i < numPlatforms - 1) type = 'checkpoint';

    const w = Math.max(1.5, 3 - difficulty * 1.5 - Math.random());
    const d = Math.max(1.5, 3 - difficulty * 1.5 - Math.random());
    platforms.push({
      position: [x, y, z],
      size: [w, 0.5, d],
      color: COLORS[type],
      type,
      moveAxis, moveRange, moveSpeed,
    });
  }

  x += 3; z += 2;
  platforms.push({ position: [x, y, z], size: [4, 0.5, 4], color: COLORS.finish, type: 'finish' });
  return platforms;
};

// ─── Floating Particles ───
const FloatingParticles: React.FC = () => {
  const count = 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => Array.from({ length: count }, () => 0.2 + Math.random() * 0.8), []);
  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random() * Math.PI * 2), []);
  const positions = useMemo(() => Array.from({ length: count }, () => [
    (Math.random() - 0.5) * 60,
    Math.random() * 30 - 5,
    (Math.random() - 0.5) * 60,
  ]), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i][0] + Math.sin(t * speeds[i] + offsets[i]) * 2,
        positions[i][1] + Math.sin(t * speeds[i] * 0.5 + offsets[i]) * 3,
        positions[i][2] + Math.cos(t * speeds[i] + offsets[i]) * 2,
      );
      dummy.scale.setScalar(0.05 + Math.sin(t * 2 + offsets[i]) * 0.03);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#4ECDC4" emissive="#4ECDC4" emissiveIntensity={2} transparent opacity={0.6} />
    </instancedMesh>
  );
};

// ─── Platform Component ───
const Platform: React.FC<{ data: PlatformData }> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);
  const initialPos = useRef(new THREE.Vector3(...data.position));

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (data.type === 'moving' && data.moveAxis && data.moveRange) {
      const t = clock.getElapsedTime() * (data.moveSpeed || 1);
      const offset = Math.sin(t) * data.moveRange;
      const pos = initialPos.current.clone();
      if (data.moveAxis === 'x') pos.x += offset;
      else if (data.moveAxis === 'z') pos.z += offset;
      else pos.y += offset;
      meshRef.current.position.copy(pos);
      if (glowRef.current) glowRef.current.position.copy(pos);
    }
    if (data.type === 'disappearing') {
      const show = Math.sin(clock.getElapsedTime() * 1.5) > -0.3;
      setVisible(show);
      meshRef.current.visible = show;
      if (glowRef.current) glowRef.current.visible = show;
    }
    // Pulse effect for special platforms
    if (glowRef.current && (data.type === 'kill' || data.type === 'bouncy' || data.type === 'finish' || data.type === 'checkpoint')) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.05;
      glowRef.current.scale.set(s, 1, s);
    }
  });

  if (!visible && data.type === 'disappearing') return null;

  const emissiveColor = data.type === 'kill' ? '#FF0000' : data.type === 'finish' ? '#00FF00' : data.type === 'bouncy' ? '#00E676' : data.type === 'checkpoint' ? '#FFD700' : '#000000';
  const emissiveIntensity = ['kill', 'finish', 'bouncy', 'checkpoint'].includes(data.type) ? 0.4 : 0;

  return (
    <group>
      <mesh ref={meshRef} position={data.position} castShadow receiveShadow>
        <boxGeometry args={data.size} />
        <meshStandardMaterial
          color={data.color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Glow underlight */}
      {['kill', 'bouncy', 'finish', 'checkpoint'].includes(data.type) && (
        <mesh ref={glowRef} position={[data.position[0], data.position[1] - 0.3, data.position[2]]}>
          <boxGeometry args={[data.size[0] + 0.2, 0.1, data.size[2] + 0.2]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={1.5} transparent opacity={0.4} />
        </mesh>
      )}
      {data.type === 'checkpoint' && (
        <group position={[data.position[0], data.position[1], data.position[2]]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, 3.2, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// ─── Player ───
const Player: React.FC<{
  platforms: PlatformData[];
  onLevelComplete: () => void;
  onDeath: () => void;
  checkpoint: [number, number, number];
  setCheckpoint: (p: [number, number, number]) => void;
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean }>;
}> = ({ platforms, onLevelComplete, onDeath, checkpoint, setCheckpoint, mobileInput }) => {
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useRef(new THREE.Vector3(...checkpoint));
  const grounded = useRef(false);
  const keys = useRef<Set<string>>(new Set());
  const { camera } = useThree();
  const trailPositions = useRef<THREE.Vector3[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const trailCount = 20;

  useEffect(() => {
    pos.current.set(...checkpoint);
    velocity.current.set(0, 0, 0);
  }, [checkpoint]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((_, delta) => {
    if (!bodyRef.current || !headRef.current) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const speed = 8;
    const jumpForce = 8;
    const gravity = -20;
    const mi = mobileInput.current;

    // Movement (keyboard + mobile joystick)
    const moveDir = new THREE.Vector3();
    if (k.has('w') || k.has('arrowup')) moveDir.z -= 1;
    if (k.has('s') || k.has('arrowdown')) moveDir.z += 1;
    if (k.has('a') || k.has('arrowleft')) moveDir.x -= 1;
    if (k.has('d') || k.has('arrowright')) moveDir.x += 1;

    // Add mobile joystick input
    moveDir.x += mi.x;
    moveDir.z += mi.z;

    moveDir.normalize().multiplyScalar(speed * dt);
    pos.current.x += moveDir.x;
    pos.current.z += moveDir.z;

    // Jump (keyboard + mobile button)
    if (((k.has(' ') || k.has('space')) || mi.jump) && grounded.current) {
      velocity.current.y = jumpForce;
      grounded.current = false;
      mi.jump = false;
    }

    // Gravity
    velocity.current.y += gravity * dt;
    pos.current.y += velocity.current.y * dt;

    // Platform collision
    grounded.current = false;
    for (const p of platforms) {
      const [px, py, pz] = p.position;
      const [pw, ph, pd] = p.size;
      const halfW = pw / 2, halfD = pd / 2;

      if (
        pos.current.x > px - halfW && pos.current.x < px + halfW &&
        pos.current.z > pz - halfD && pos.current.z < pz + halfD &&
        pos.current.y - 0.5 <= py + ph / 2 && pos.current.y - 0.5 > py - ph / 2 - 0.5 &&
        velocity.current.y <= 0
      ) {
        pos.current.y = py + ph / 2 + 0.5;
        velocity.current.y = 0;
        grounded.current = true;

        if (p.type === 'kill') { onDeath(); return; }
        if (p.type === 'bouncy') { velocity.current.y = 12; grounded.current = false; }
        if (p.type === 'speed') { pos.current.x += moveDir.x * 3; pos.current.z += moveDir.z * 3; }
        if (p.type === 'checkpoint') setCheckpoint([px, py + ph / 2 + 0.5, pz]);
        if (p.type === 'finish') { onLevelComplete(); return; }
        break;
      }
    }

    // Fall death
    if (pos.current.y < -20) { onDeath(); return; }

    bodyRef.current.position.copy(pos.current);
    headRef.current.position.set(pos.current.x, pos.current.y + 0.75, pos.current.z);

    // Trail effect
    trailPositions.current.unshift(pos.current.clone());
    if (trailPositions.current.length > trailCount) trailPositions.current.pop();
    if (trailRef.current) {
      for (let i = 0; i < trailCount; i++) {
        if (trailPositions.current[i]) {
          dummy.position.copy(trailPositions.current[i]);
          dummy.scale.setScalar(Math.max(0.01, (1 - i / trailCount) * 0.3));
          dummy.updateMatrix();
          trailRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }

    // Camera follow
    const camTarget = pos.current.clone().add(new THREE.Vector3(0, 8, 12));
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(pos.current);
  });

  return (
    <group>
      {/* Trail */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, trailCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#4ECDC4" emissive="#4ECDC4" emissiveIntensity={1} transparent opacity={0.3} />
      </instancedMesh>
      {/* Body */}
      <mesh ref={bodyRef} position={checkpoint} castShadow>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#4ECDC4" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Head */}
      <mesh ref={headRef} position={[checkpoint[0], checkpoint[1] + 0.75, checkpoint[2]]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#FFD93D" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
};

// ─── Scene ───
const ObbyScene: React.FC<{
  level: number;
  onComplete: () => void;
  onDeath: () => void;
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean }>;
}> = ({ level, onComplete, onDeath, mobileInput }) => {
  const platforms = useMemo(() => generateLevel(level), [level]);
  const startPos: [number, number, number] = useMemo(() => {
    const first = platforms[0];
    return [first.position[0], first.position[1] + 1, first.position[2]];
  }, [platforms]);
  const [checkpoint, setCheckpoint] = useState<[number, number, number]>(startPos);

  useEffect(() => { setCheckpoint(startPos); }, [startPos]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
      />
      <pointLight position={[0, 15, 0]} intensity={0.8} color="#4ECDC4" distance={50} />
      <pointLight position={[20, 10, 20]} intensity={0.5} color="#FF6B6B" distance={40} />
      <pointLight position={[-10, 8, -10]} intensity={0.4} color="#BB86FC" distance={35} />
      <hemisphereLight args={['#1a1a3e', '#0a0a1e', 0.3]} />

      <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} />
      <Stars radius={100} depth={50} count={3000} factor={5} saturation={1} />
      <fog attach="fog" args={['#0a0a2e', 40, 100]} />

      <FloatingParticles />

      {platforms.map((p, i) => (
        <Platform key={`${level}-${i}`} data={p} />
      ))}

      <Player
        platforms={platforms}
        onLevelComplete={onComplete}
        onDeath={onDeath}
        checkpoint={checkpoint}
        setCheckpoint={setCheckpoint}
        mobileInput={mobileInput}
      />

      {/* Lava ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -25, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#FF2200" emissive="#FF0000" emissiveIntensity={0.4} transparent opacity={0.85} />
      </mesh>
    </>
  );
};

// ─── Mobile Joystick ───
const MobileJoystick: React.FC<{
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean }>;
}> = ({ mobileInput }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });
  const radius = 50;

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    handleMove(touch.clientX, touch.clientY);
  }, []);

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - center.current.x;
    const dy = cy - center.current.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * dist;
    const ny = Math.sin(angle) * dist;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    mobileInput.current.x = (nx / radius);
    mobileInput.current.z = (ny / radius);
  }, [mobileInput]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, [handleMove]);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        touchId.current = null;
        if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
        mobileInput.current.x = 0;
        mobileInput.current.z = 0;
        break;
      }
    }
  }, [mobileInput]);

  return (
    <div
      ref={joystickRef}
      onTouchStart={handleStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      className="absolute bottom-8 left-8 w-32 h-32 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center touch-none z-50"
    >
      <div
        ref={knobRef}
        className="w-14 h-14 rounded-full bg-white/40 border-2 border-white/60 shadow-lg shadow-white/20 pointer-events-none"
      />
    </div>
  );
};

// ─── Mobile Jump Button ───
const MobileJumpButton: React.FC<{
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean }>;
}> = ({ mobileInput }) => {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        mobileInput.current.jump = true;
      }}
      className="absolute bottom-10 right-8 w-20 h-20 rounded-full bg-primary/40 border-2 border-primary/60 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30 active:scale-90 transition-transform touch-none z-50 select-none"
    >
      ⬆
    </button>
  );
};

// ─── Main Component ───
const RobloxObby: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [totalLevels] = useState(50);
  const isMobile = useIsMobile();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const mobileInput = useRef({ x: 0, z: 0, jump: false });

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const showTouchControls = isMobile || isTouchDevice;

  const handleComplete = useCallback(() => { setShowComplete(true); }, []);
  const handleDeath = useCallback(() => { setDeaths(d => d + 1); }, []);

  const nextLevel = () => {
    if (level < totalLevels) {
      setLevel(l => l + 1);
      setShowComplete(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-4xl mb-2 px-4 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-primary">Level {level}/{totalLevels}</span>
          <span className="text-sm text-muted-foreground">Deaths: {deaths}</span>
        </div>
        {!isMobile && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">🔵 Normal</span>
            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">🔴 Kill</span>
            <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">🟠 Moving</span>
            <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">🟣 Vanishing</span>
            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">🟢 Bouncy</span>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div className="w-full rounded-xl overflow-hidden border border-border relative" style={{ height: showTouchControls ? 400 : 500 }}>
        <Canvas
          shadows
          camera={{ position: [0, 10, 15], fov: 60 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <ObbyScene
            level={level}
            onComplete={handleComplete}
            onDeath={handleDeath}
            mobileInput={mobileInput}
          />
        </Canvas>

        {/* Mobile Controls */}
        {showTouchControls && (
          <>
            <MobileJoystick mobileInput={mobileInput} />
            <MobileJumpButton mobileInput={mobileInput} />
          </>
        )}
      </div>

      {/* Level complete overlay */}
      {showComplete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-primary mb-2">🎉 Level {level} Complete!</h2>
            <p className="text-muted-foreground mb-1">Deaths this run: {deaths}</p>
            <div className="w-full bg-muted rounded-full h-3 my-4">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${(level / totalLevels) * 100}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{level}/{totalLevels} levels completed</p>
            {level < totalLevels ? (
              <button onClick={nextLevel} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg">
                Next Level →
              </button>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">🏆 YOU BEAT ALL 50 LEVELS!</h3>
                <button onClick={() => { setLevel(1); setDeaths(0); setShowComplete(false); }}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Play Again</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground text-center">
        {showTouchControls ? (
          <span><strong>Joystick</strong> to move • <strong>⬆ Button</strong> to jump • Avoid red platforms!</span>
        ) : (
          <span><strong>WASD</strong> to move • <strong>Space</strong> to jump • Avoid red platforms • Reach the green goal!</span>
        )}
      </div>
    </div>
  );
};

export default RobloxObby;
