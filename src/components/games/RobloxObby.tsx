import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── Level Generation ───
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

const generateLevel = (levelNum: number): PlatformData[] => {
  const platforms: PlatformData[] = [];
  const difficulty = Math.min(levelNum / 10, 1);
  const baseY = levelNum * 2;
  let x = 0, y = baseY, z = 0;

  // Start platform
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

    // Checkpoint every ~5 platforms
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

  // Finish platform
  x += 3; z += 2;
  platforms.push({ position: [x, y, z], size: [4, 0.5, 4], color: COLORS.finish, type: 'finish' });

  return platforms;
};

// ─── Platform Component ───
const Platform: React.FC<{
  data: PlatformData;
  onPlayerTouch?: (type: PlatformData['type'], pos: THREE.Vector3) => void;
}> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
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
    }
    if (data.type === 'disappearing') {
      const t = clock.getElapsedTime();
      const show = Math.sin(t * 1.5) > -0.3;
      setVisible(show);
      meshRef.current.visible = show;
    }
  });

  if (!visible && data.type === 'disappearing') return null;

  return (
    <mesh ref={meshRef} position={data.position} castShadow receiveShadow>
      <boxGeometry args={data.size} />
      <meshStandardMaterial
        color={data.color}
        emissive={data.type === 'kill' ? '#FF0000' : data.type === 'finish' ? '#00FF00' : '#000000'}
        emissiveIntensity={data.type === 'kill' || data.type === 'finish' ? 0.3 : 0}
        roughness={0.4}
        metalness={0.3}
      />
      {data.type === 'checkpoint' && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
        </mesh>
      )}
    </mesh>
  );
};

// ─── Player ───
const Player: React.FC<{
  platforms: PlatformData[];
  onLevelComplete: () => void;
  onDeath: () => void;
  checkpoint: [number, number, number];
  setCheckpoint: (p: [number, number, number]) => void;
}> = ({ platforms, onLevelComplete, onDeath, checkpoint, setCheckpoint }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useRef(new THREE.Vector3(...checkpoint));
  const grounded = useRef(false);
  const keys = useRef<Set<string>>(new Set());
  const { camera } = useThree();

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
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const speed = 8;
    const jumpForce = 8;
    const gravity = -20;

    // Movement
    const moveDir = new THREE.Vector3();
    if (k.has('w') || k.has('arrowup')) moveDir.z -= 1;
    if (k.has('s') || k.has('arrowdown')) moveDir.z += 1;
    if (k.has('a') || k.has('arrowleft')) moveDir.x -= 1;
    if (k.has('d') || k.has('arrowright')) moveDir.x += 1;
    moveDir.normalize().multiplyScalar(speed * dt);

    pos.current.x += moveDir.x;
    pos.current.z += moveDir.z;

    // Jump
    if ((k.has(' ') || k.has('space')) && grounded.current) {
      velocity.current.y = jumpForce;
      grounded.current = false;
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

    meshRef.current.position.copy(pos.current);

    // Camera follow
    const camTarget = pos.current.clone().add(new THREE.Vector3(0, 8, 12));
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(pos.current);
  });

  return (
    <group>
      <mesh ref={meshRef} position={checkpoint} castShadow>
        {/* Roblox-style blocky character */}
        {/* Body */}
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#4ECDC4" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Head - offset relative to body */}
      <mesh position={[pos.current.x, pos.current.y + 0.7, pos.current.z]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#FFD93D" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
};

// ─── Scene ───
const ObbyScene: React.FC<{
  level: number;
  onComplete: () => void;
  onDeath: () => void;
  deaths: number;
}> = ({ level, onComplete, onDeath, deaths }) => {
  const platforms = useMemo(() => generateLevel(level), [level]);
  const startPos: [number, number, number] = useMemo(() => {
    const first = platforms[0];
    return [first.position[0], first.position[1] + 1, first.position[2]];
  }, [platforms]);
  const [checkpoint, setCheckpoint] = useState<[number, number, number]>(startPos);

  useEffect(() => { setCheckpoint(startPos); }, [startPos]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#4ECDC4" />
      <Sky sunPosition={[100, 50, 100]} />
      <Stars radius={100} depth={50} count={2000} factor={4} />
      <fog attach="fog" args={['#1a1a2e', 30, 80]} />

      {platforms.map((p, i) => (
        <Platform key={`${level}-${i}`} data={p} />
      ))}

      <Player
        platforms={platforms}
        onLevelComplete={onComplete}
        onDeath={onDeath}
        checkpoint={checkpoint}
        setCheckpoint={setCheckpoint}
      />

      {/* Ground plane (lava) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -25, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#FF4444" emissive="#FF0000" emissiveIntensity={0.2} transparent opacity={0.8} />
      </mesh>
    </>
  );
};

// ─── Main Component ───
const RobloxObby: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [totalLevels] = useState(50);

  const handleComplete = useCallback(() => {
    setShowComplete(true);
  }, []);

  const handleDeath = useCallback(() => {
    setDeaths(d => d + 1);
  }, []);

  const nextLevel = () => {
    if (level < totalLevels) {
      setLevel(l => l + 1);
      setShowComplete(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* HUD */}
      <div className="flex justify-between w-full max-w-4xl mb-2 px-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-primary">Level {level}/{totalLevels}</span>
          <span className="text-sm text-muted-foreground">Deaths: {deaths}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">🟢 Normal</span>
          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">🔴 Kill</span>
          <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">🟠 Moving</span>
          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">🟣 Vanishing</span>
          <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">🟢 Bouncy</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full rounded-xl overflow-hidden border border-border" style={{ height: 500 }}>
        <Canvas shadows camera={{ position: [0, 10, 15], fov: 60 }}>
          <ObbyScene
            level={level}
            onComplete={handleComplete}
            onDeath={handleDeath}
            deaths={deaths}
          />
        </Canvas>
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
                <h3 className="text-2xl font-bold text-warning mb-2">🏆 YOU BEAT ALL 50 LEVELS!</h3>
                <button onClick={() => { setLevel(1); setDeaths(0); setShowComplete(false); }}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Play Again</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground text-center">
        <strong>WASD</strong> to move • <strong>Space</strong> to jump • Avoid red platforms • Reach the green goal!
      </div>
    </div>
  );
};

export default RobloxObby;
