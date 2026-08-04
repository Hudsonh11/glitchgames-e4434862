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
  const difficulty = Math.min(levelNum / 20, 1);
  const baseY = 0;
  let x = 0, y = baseY, z = 0;

  // Start platform - extra big
  platforms.push({ position: [x, y, z], size: [7, 0.5, 7], color: COLORS.checkpoint, type: 'checkpoint' });

  const numPlatforms = 6 + Math.floor(levelNum / 5) * 2;
  for (let i = 0; i < numPlatforms; i++) {
    const dir = Math.random();
    if (dir < 0.4) x += 2 + Math.random() * (1.5 + difficulty);
    else if (dir < 0.7) z += 2 + Math.random() * (1.5 + difficulty);
    else { x += 1.5 + Math.random(); z += 1.5 + Math.random(); }
    y += (Math.random() - 0.3) * (0.6 + difficulty * 0.4);

    const typeRoll = Math.random();
    let type: PlatformData['type'] = 'normal';
    let moveAxis: 'x' | 'y' | 'z' | undefined;
    let moveRange: number | undefined;
    let moveSpeed: number | undefined;

    if (typeRoll < 0.03 + difficulty * 0.05) {
      type = 'kill';
    } else if (typeRoll < 0.1 + difficulty * 0.07) {
      type = 'moving';
      moveAxis = ['x', 'z'][Math.floor(Math.random() * 2)] as 'x' | 'z';
      moveRange = 1 + difficulty * 1.2;
      moveSpeed = 0.3 + difficulty * 0.5;
    } else if (typeRoll < 0.14 + difficulty * 0.04) {
      type = 'disappearing';
    } else if (typeRoll < 0.18 + difficulty * 0.03) {
      type = 'bouncy';
    } else if (typeRoll < 0.21 + difficulty * 0.02) {
      type = 'speed';
    }

    if ((i + 1) % 4 === 0 && i < numPlatforms - 1) type = 'checkpoint';

    const w = Math.max(3, 4.5 - difficulty * 1.2 - Math.random() * 0.3);
    const d = Math.max(3, 4.5 - difficulty * 1.2 - Math.random() * 0.3);
    platforms.push({
      position: [x, y, z],
      size: [w, 0.5, d],
      color: COLORS[type],
      type,
      moveAxis, moveRange, moveSpeed,
    });
  }

  x += 3; z += 2;
  platforms.push({ position: [x, y, z], size: [7, 0.5, 7], color: COLORS.finish, type: 'finish' });
  return platforms;
};

// ─── Floating Particles ───
const FloatingParticles: React.FC = () => {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => Array.from({ length: count }, () => 0.2 + Math.random() * 0.6), []);
  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random() * Math.PI * 2), []);
  const positions = useMemo(() => Array.from({ length: count }, () => [
    (Math.random() - 0.5) * 60,
    Math.random() * 25 - 5,
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
const Platform: React.FC<{ data: PlatformData }> = React.memo(({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);
  const initialPos = useMemo(() => new THREE.Vector3(...data.position), [data.position]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (data.type === 'moving' && data.moveAxis && data.moveRange) {
      const t = clock.getElapsedTime() * (data.moveSpeed || 1);
      const offset = Math.sin(t) * data.moveRange;
      const pos = initialPos.clone();
      if (data.moveAxis === 'x') pos.x += offset;
      else if (data.moveAxis === 'z') pos.z += offset;
      else pos.y += offset;
      meshRef.current.position.copy(pos);
      if (glowRef.current) glowRef.current.position.copy(pos);
    }
    if (data.type === 'disappearing') {
      const show = Math.sin(clock.getElapsedTime() * 0.8) > -0.3;
      if (meshRef.current) meshRef.current.visible = show;
      if (glowRef.current) glowRef.current.visible = show;
    }
    if (glowRef.current && ['kill', 'bouncy', 'finish', 'checkpoint'].includes(data.type)) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.05;
      glowRef.current.scale.set(s, 1, s);
    }
  });

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
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[data.position[0], data.position[1] + 0.26, data.position[2]]}>
        <boxGeometry args={[data.size[0] - 0.1, 0.02, data.size[2] - 0.1]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
      {['kill', 'bouncy', 'finish', 'checkpoint'].includes(data.type) && (
        <mesh ref={glowRef} position={[data.position[0], data.position[1] - 0.3, data.position[2]]}>
          <boxGeometry args={[data.size[0] + 0.3, 0.1, data.size[2] + 0.3]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={1.5} transparent opacity={0.4} />
        </mesh>
      )}
      {data.type === 'checkpoint' && (
        <group position={[data.position[0], data.position[1], data.position[2]]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 3, 8]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, 3.2, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
          </mesh>
        </group>
      )}
      {data.type === 'kill' && (
        <group position={[data.position[0], data.position[1] + 0.4, data.position[2]]}>
          {[[-0.3, 0, -0.3], [0.3, 0, 0.3], [-0.3, 0, 0.3], [0.3, 0, -0.3], [0, 0, 0]].map(([sx, sy, sz], idx) => (
            <mesh key={idx} position={[sx, sy, sz]}>
              <coneGeometry args={[0.12, 0.4, 4]} />
              <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
});

// ─── Roblox Character ───
const RobloxCharacter: React.FC<{
  bodyRef: React.RefObject<THREE.Group>;
  checkpoint: [number, number, number];
  isMoving: boolean;
  moveDir: THREE.Vector3;
}> = ({ bodyRef, checkpoint, isMoving }) => {
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const swing = isMoving ? Math.sin(t * 10) * 0.6 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
  });

  return (
    <group ref={bodyRef} position={checkpoint}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 1.0, 0.5]} />
        <meshStandardMaterial color="#2196F3" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color="#FFD093" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[-0.15, 0.9, 0.36]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 0.9, 0.36]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.15, 0.9, 0.34]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.15, 0.9, 0.34]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.72, 0.36]}>
        <boxGeometry args={[0.25, 0.05, 0.02]} />
        <meshStandardMaterial color="#cc4444" />
      </mesh>
      <mesh position={[0, 1.22, -0.02]}>
        <boxGeometry args={[0.72, 0.12, 0.74]} />
        <meshStandardMaterial color="#3E2723" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.1, -0.35]}>
        <boxGeometry args={[0.72, 0.35, 0.1]} />
        <meshStandardMaterial color="#3E2723" roughness={0.6} />
      </mesh>
      <group position={[-0.6, 0.0, 0]}>
        <mesh ref={leftArmRef} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.45]} />
          <meshStandardMaterial color="#2196F3" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial color="#FFD093" roughness={0.4} />
        </mesh>
      </group>
      <group position={[0.6, 0.0, 0]}>
        <mesh ref={rightArmRef} castShadow>
          <boxGeometry args={[0.35, 1.0, 0.45]} />
          <meshStandardMaterial color="#2196F3" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial color="#FFD093" roughness={0.4} />
        </mesh>
      </group>
      <group position={[-0.2, -0.85, 0]}>
        <mesh ref={leftLegRef} castShadow>
          <boxGeometry args={[0.4, 0.7, 0.45]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.4, 0.05]}>
          <boxGeometry args={[0.42, 0.15, 0.55]} />
          <meshStandardMaterial color="#333333" roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.2, -0.85, 0]}>
        <mesh ref={rightLegRef} castShadow>
          <boxGeometry args={[0.4, 0.7, 0.45]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.4, 0.05]}>
          <boxGeometry args={[0.42, 0.15, 0.55]} />
          <meshStandardMaterial color="#333333" roughness={0.5} />
        </mesh>
      </group>
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
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean; cameraAngle: number }>;
  deathCount: number;
}> = ({ platforms, onLevelComplete, onDeath, checkpoint, setCheckpoint, mobileInput, deathCount }) => {
  const bodyRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useRef(new THREE.Vector3(...checkpoint));
  const grounded = useRef(false);
  const keys = useRef<Set<string>>(new Set());
  const { camera } = useThree();
  const moveDirRef = useRef(new THREE.Vector3());
  const [isMoving, setIsMoving] = useState(false);
  const coyoteTime = useRef(0);
  const jumpBufferTime = useRef(0);
  const hasCompletedLevel = useRef(false);
  const hasDied = useRef(false);

  // Keep the latest checkpoint without teleporting the player when it updates.
  const checkpointRef = useRef<[number, number, number]>(checkpoint);
  useEffect(() => { checkpointRef.current = checkpoint; }, [checkpoint]);

  // Respawn only when the player actually dies (or the level remounts us).
  useEffect(() => {
    pos.current.set(...checkpointRef.current);
    velocity.current.set(0, 0, 0);
    grounded.current = false;
    hasCompletedLevel.current = false;
    hasDied.current = false;
  }, [deathCount]);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current.add(key);
      // Buffer jump input
      if (key === ' ' || key === 'space') {
        jumpBufferTime.current = 0.15;
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Get current platform position (for moving platforms)
  const getPlatformCurrentPos = useCallback((p: PlatformData, time: number): [number, number, number] => {
    if (p.type === 'moving' && p.moveAxis && p.moveRange) {
      const offset = Math.sin(time * (p.moveSpeed || 1)) * p.moveRange;
      const pos: [number, number, number] = [...p.position];
      if (p.moveAxis === 'x') pos[0] += offset;
      else if (p.moveAxis === 'z') pos[2] += offset;
      else pos[1] += offset;
      return pos;
    }
    return p.position;
  }, []);

  useFrame(({ clock }, delta) => {
    if (!bodyRef.current || hasCompletedLevel.current || hasDied.current) return;
    const dt = Math.min(delta, 0.04);
    const k = keys.current;
    const speed = 7;
    const jumpForce = 10;
    const gravity = -20;
    const mi = mobileInput.current;
    const time = clock.getElapsedTime();

    // Movement
    const rawDir = new THREE.Vector3();
    if (k.has('w') || k.has('arrowup')) rawDir.z -= 1;
    if (k.has('s') || k.has('arrowdown')) rawDir.z += 1;
    if (k.has('a') || k.has('arrowleft')) rawDir.x -= 1;
    if (k.has('d') || k.has('arrowright')) rawDir.x += 1;
    rawDir.x += mi.x;
    rawDir.z += mi.z;
    const moving = rawDir.length() > 0.05;
    setIsMoving(moving);
    rawDir.normalize();

    const angle = mi.cameraAngle;
    const moveDir = new THREE.Vector3(
      rawDir.x * Math.cos(angle) - rawDir.z * Math.sin(angle),
      0,
      rawDir.x * Math.sin(angle) + rawDir.z * Math.cos(angle),
    ).multiplyScalar(speed * dt);
    moveDirRef.current.copy(moveDir);
    pos.current.x += moveDir.x;
    pos.current.z += moveDir.z;

    // Rotate character
    if (moving && bodyRef.current) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, targetAngle, 0.15);
    }

    // Coyote time
    if (grounded.current) {
      coyoteTime.current = 0.15;
    } else {
      coyoteTime.current = Math.max(0, coyoteTime.current - dt);
    }

    // Jump buffer
    jumpBufferTime.current = Math.max(0, jumpBufferTime.current - dt);
    if (mi.jump) {
      jumpBufferTime.current = 0.15;
      mi.jump = false;
    }

    // Execute jump
    const wantJump = jumpBufferTime.current > 0 || k.has(' ');
    if (wantJump && (grounded.current || coyoteTime.current > 0)) {
      velocity.current.y = jumpForce;
      grounded.current = false;
      coyoteTime.current = 0;
      jumpBufferTime.current = 0;
    }

    // Gravity
    velocity.current.y += gravity * dt;
    if (velocity.current.y < -30) velocity.current.y = -30; // terminal velocity
    pos.current.y += velocity.current.y * dt;

    // Platform collision - improved
    grounded.current = false;
    const playerBottom = pos.current.y - 0.9;
    const playerRadius = 0.35;

    for (const p of platforms) {
      // Skip invisible disappearing platforms
      if (p.type === 'disappearing') {
        const show = Math.sin(time * 0.8) > -0.3;
        if (!show) continue;
      }

      const [px, py, pz] = getPlatformCurrentPos(p, time);
      const [pw, ph, pd] = p.size;
      const halfW = pw / 2;
      const halfD = pd / 2;
      const platTop = py + ph / 2;
      const platBottom = py - ph / 2;

      // Check horizontal overlap with player radius
      const inX = pos.current.x > px - halfW - playerRadius && pos.current.x < px + halfW + playerRadius;
      const inZ = pos.current.z > pz - halfD - playerRadius && pos.current.z < pz + halfD + playerRadius;

      if (inX && inZ) {
        // Landing on top
        if (playerBottom <= platTop && playerBottom > platTop - 1.0 && velocity.current.y <= 0) {
          pos.current.y = platTop + 0.9;
          velocity.current.y = 0;
          grounded.current = true;

          if (p.type === 'kill') {
            hasDied.current = true;
            onDeath();
            return;
          }
          if (p.type === 'bouncy') {
            velocity.current.y = 14;
            grounded.current = false;
          }
          if (p.type === 'speed') {
            pos.current.x += moveDir.x * 3;
            pos.current.z += moveDir.z * 3;
          }
          if (p.type === 'checkpoint') {
            setCheckpoint([px, platTop + 0.9, pz]);
          }
          if (p.type === 'finish') {
            hasCompletedLevel.current = true;
            onLevelComplete();
            return;
          }
          break;
        }
      }
    }

    // Fall death
    if (pos.current.y < -25) {
      hasDied.current = true;
      onDeath();
      return;
    }

    bodyRef.current.position.copy(pos.current);

    // Smooth camera follow
    const camDist = 14;
    const camHeight = 8;
    const camAngle = mi.cameraAngle;
    const camOffset = new THREE.Vector3(
      Math.sin(camAngle) * camDist,
      camHeight,
      Math.cos(camAngle) * camDist,
    );
    const camTarget = pos.current.clone().add(camOffset);
    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(pos.current.x, pos.current.y + 1, pos.current.z);
  });

  return (
    <RobloxCharacter
      bodyRef={bodyRef}
      checkpoint={checkpoint}
      isMoving={isMoving}
      moveDir={moveDirRef.current}
    />
  );
};

// ─── Scene ───
const ObbyScene: React.FC<{
  level: number;
  onComplete: () => void;
  onDeath: () => void;
  deathCount: number;
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean; cameraAngle: number }>;
}> = ({ level, onComplete, onDeath, deathCount, mobileInput }) => {
  const platforms = useMemo(() => generateLevel(level), [level]);
  const startPos: [number, number, number] = useMemo(() => {
    const first = platforms[0];
    return [first.position[0], first.position[1] + 1.3, first.position[2]];
  }, [platforms]);
  const [checkpoint, setCheckpoint] = useState<[number, number, number]>(startPos);

  useEffect(() => { setCheckpoint(startPos); }, [startPos]);

  return (
    <>
      <ambientLight intensity={0.5} />
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
      <pointLight position={[0, 15, 0]} intensity={0.6} color="#4ECDC4" distance={50} />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.5]} />

      <Sky sunPosition={[100, 60, 100]} turbidity={6} rayleigh={1.5} />
      <Stars radius={100} depth={50} count={2000} factor={5} saturation={1} />
      <fog attach="fog" args={['#1a1a3e', 60, 140]} />

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
        deathCount={deathCount}
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
  const radius = 55;

  const handleMove = useCallback((cx: number, cy: number) => {
    const dx = cx - center.current.x;
    const dy = cy - center.current.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * dist;
    const ny = Math.sin(angle) * dist;
    if (knobRef.current) knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    mobileInput.current.x = nx / radius;
    mobileInput.current.z = ny / radius;
  }, [mobileInput]);

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

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
      className="absolute bottom-6 left-6 w-36 h-36 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center touch-none z-50"
      style={{ border: '3px solid rgba(255,255,255,0.25)', boxShadow: '0 0 20px rgba(78,205,196,0.3)' }}
    >
      <div
        ref={knobRef}
        className="w-16 h-16 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(78,205,196,0.8) 0%, rgba(78,205,196,0.4) 100%)',
          border: '3px solid rgba(255,255,255,0.5)',
          boxShadow: '0 0 15px rgba(78,205,196,0.5)',
        }}
      />
    </div>
  );
};

// ─── Mobile Jump Button ───
const MobileJumpButton: React.FC<{
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean }>;
}> = ({ mobileInput }) => (
  <button
    onTouchStart={(e) => {
      e.preventDefault();
      mobileInput.current.jump = true;
    }}
    className="absolute bottom-8 right-6 w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold active:scale-90 transition-transform touch-none z-50 select-none"
    style={{
      background: 'radial-gradient(circle, rgba(33,150,243,0.7) 0%, rgba(33,150,243,0.3) 100%)',
      border: '3px solid rgba(255,255,255,0.35)',
      boxShadow: '0 0 20px rgba(33,150,243,0.4)',
    }}
  >
    JUMP
  </button>
);

// ─── Swipe to Look ───
const SwipeToLook: React.FC<{
  mobileInput: React.MutableRefObject<{ x: number; z: number; jump: boolean; cameraAngle: number }>;
}> = ({ mobileInput }) => {
  const touchId = useRef<number | null>(null);
  const lastX = useRef(0);

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    lastX.current = touch.clientX;
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        const dx = e.changedTouches[i].clientX - lastX.current;
        lastX.current = e.changedTouches[i].clientX;
        mobileInput.current.cameraAngle += dx * 0.008;
        break;
      }
    }
  }, [mobileInput]);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        touchId.current = null;
        break;
      }
    }
  }, []);

  return (
    <div
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      className="absolute inset-0 z-40 touch-none"
      style={{ pointerEvents: 'auto' }}
    />
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
  const mobileInput = useRef({ x: 0, z: 0, jump: false, cameraAngle: 0 });

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
          <span className="text-lg font-bold text-primary">🏔️ Level {level}/{totalLevels}</span>
          <span className="text-sm text-muted-foreground">💀 {deaths}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">Normal</span>
          <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">☠️ Kill</span>
          <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">↔ Moving</span>
          <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">🦘 Bouncy</span>
          <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">⭐ Check</span>
        </div>
      </div>

      <div className="w-full max-w-4xl px-4 mb-2">
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${(level / totalLevels) * 100}%` }} />
        </div>
      </div>

      <div className="w-full rounded-xl overflow-hidden border border-border relative" style={{ height: showTouchControls ? 450 : 550 }}>
        <Canvas
          shadows
          camera={{ position: [0, 10, 15], fov: 55 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <ObbyScene
            level={level}
            onComplete={handleComplete}
            onDeath={handleDeath}
            deathCount={deaths}
            mobileInput={mobileInput}
          />
        </Canvas>

        {showTouchControls && <SwipeToLook mobileInput={mobileInput} />}
        {showTouchControls && (
          <>
            <MobileJoystick mobileInput={mobileInput} />
            <MobileJumpButton mobileInput={mobileInput} />
          </>
        )}
      </div>

      {showComplete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-3xl font-bold text-primary mb-2">Level {level} Complete!</h2>
            <p className="text-muted-foreground mb-1">Deaths: {deaths}</p>
            <div className="w-full bg-muted rounded-full h-3 my-4">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${(level / totalLevels) * 100}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{level}/{totalLevels} levels completed</p>
            {level < totalLevels ? (
              <button onClick={nextLevel} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity">
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
        {showTouchControls ? (
          <span><strong>Joystick</strong> to move • <strong>JUMP</strong> to jump • <strong>Swipe</strong> to look around • Avoid red platforms!</span>
        ) : (
          <span><strong>WASD/Arrows</strong> to move • <strong>Space</strong> to jump • Avoid red platforms • Reach the green goal!</span>
        )}
      </div>
    </div>
  );
};

export default RobloxObby;
