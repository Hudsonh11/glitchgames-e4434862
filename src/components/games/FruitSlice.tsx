import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playSfx } from '@/lib/sfx';

interface FruitSliceProps {
  onScoreUpdate?: (score: number) => void;
}

interface FruitInfo { emoji: string; color: string; points: number }

const FRUITS: FruitInfo[] = [
  { emoji: '🍉', color: '#ff3355', points: 10 },
  { emoji: '🍌', color: '#ffe135', points: 10 },
  { emoji: '🍍', color: '#ffcc00', points: 12 },
  { emoji: '🥝', color: '#88cc33', points: 12 },
  { emoji: '🍎', color: '#dd1111', points: 10 },
  { emoji: '🍊', color: '#ff8800', points: 10 },
  { emoji: '🍇', color: '#a259ff', points: 14 },
  { emoji: '🍓', color: '#ff4477', points: 14 },
];

type EntityType = 'fruit' | 'bomb' | 'ice' | 'half' | 'juice';

interface Entity {
  id: number;
  type: EntityType;
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vRot: number;
  size: number;
  emoji: string;
  color: string;
  points: number;
  life: number;
  half?: 'left' | 'right';
}

const W = 420;
const H = 480;
const GRAVITY = 0.34;

const FruitSlice: React.FC<FruitSliceProps> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('fruitSliceBest') || 0));
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [hardMode, setHardMode] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [penalty, setPenalty] = useState('');

  // refs mirror state for the render loop
  const entities = useRef<Entity[]>([]);
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);
  const slicing = useRef(false);
  const idRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const comboTimer = useRef(0);
  const hardRef = useRef(false);
  const frozenUntil = useRef(0);
  const playingRef = useRef(false);
  const shake = useRef(0);
  const floaters = useRef<{ x: number; y: number; text: string; life: number; color: string }[]>([]);

  const endGame = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    slicing.current = false;
    const final = scoreRef.current;
    onScoreUpdate?.(final);
    setBest(prev => {
      if (final > prev) {
        localStorage.setItem('fruitSliceBest', String(final));
        return final;
      }
      return prev;
    });
    playSfx('lose');
    toast.error(`Game Over! Score: ${final}`);
  }, [onScoreUpdate]);

  const loseLife = useCallback((reason: string) => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    comboRef.current = 0;
    setCombo(0);
    setPenalty(reason);
    setTimeout(() => setPenalty(''), 900);
    if (livesRef.current <= 0) endGame();
  }, [endGame]);

  const spawn = useCallback(() => {
    const roll = Math.random();
    const startX = 40 + Math.random() * (W - 80);
    const base: Omit<Entity, 'type' | 'emoji' | 'color' | 'points'> = {
      id: idRef.current++,
      x: startX,
      y: H + 40,
      vx: (W / 2 - startX) / 55 + (Math.random() - 0.5) * 1.6,
      vy: -(11.5 + Math.random() * 2.2) * (hardRef.current ? 1.08 : 1),
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.16,
      size: 42,
      life: 1,
    };
    if (roll < (hardRef.current ? 0.22 : 0.13)) {
      entities.current.push({ ...base, type: 'bomb', emoji: '💣', color: '#444', points: 0 });
    } else if (roll > 0.965) {
      entities.current.push({ ...base, type: 'ice', emoji: '🧊', color: '#7fd8ff', points: 0 });
    } else {
      const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      entities.current.push({ ...base, type: 'fruit', emoji: f.emoji, color: f.color, points: f.points });
    }
  }, []);

  const burst = useCallback((e: Entity) => {
    for (const side of ['left', 'right'] as const) {
      entities.current.push({
        ...e,
        id: idRef.current++,
        type: 'half',
        half: side,
        vx: side === 'left' ? -2.6 : 2.6,
        vy: -3,
        vRot: side === 'left' ? -0.14 : 0.14,
        life: 1,
      });
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      entities.current.push({
        id: idRef.current++, type: 'juice', x: e.x, y: e.y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        rot: 0, vRot: 0, size: 3 + Math.random() * 5,
        emoji: '', color: e.color, points: 0, life: 1,
      });
    }
  }, []);

  const sliceAt = useCallback((px: number, py: number) => {
    if (!playingRef.current) return;
    for (const e of entities.current) {
      if (e.type !== 'fruit' && e.type !== 'bomb' && e.type !== 'ice') continue;
      const d = Math.hypot(e.x - px, e.y - py);
      if (d > e.size * 0.72) continue;

      if (e.type === 'bomb') {
        e.life = 0;
        shake.current = 18;
        playSfx('crash');
        burst({ ...e, color: '#ff6a00' });
        loseLife('💥 Bomb hit! -1 life');
        return;
      }
      if (e.type === 'ice') {
        e.life = 0;
        frozenUntil.current = performance.now() + 5000;
        setFrozen(true);
        playSfx('powerup');
        floaters.current.push({ x: e.x, y: e.y, text: 'FREEZE!', life: 1, color: '#7fd8ff' });
        burst(e);
        return;
      }

      // fruit
      e.life = 0;
      comboTimer.current = performance.now() + 700;
      comboRef.current += 1;
      setCombo(comboRef.current);
      const bonus = comboRef.current > 1 ? (comboRef.current - 1) * 5 : 0;
      const gained = e.points + bonus;
      scoreRef.current += gained;
      setScore(scoreRef.current);
      floaters.current.push({
        x: e.x, y: e.y,
        text: bonus > 0 ? `+${gained} x${comboRef.current}` : `+${gained}`,
        life: 1, color: e.color,
      });
      playSfx(comboRef.current > 2 ? 'success' : 'pop');
      burst(e);
      if (scoreRef.current >= 200 && !hardRef.current) {
        hardRef.current = true;
        setHardMode(true);
        playSfx('levelup');
        toast('🔥 HARD MODE ENGAGED');
      }
    }
  }, [burst, loseLife]);

  const startGame = () => {
    entities.current = [];
    floaters.current = [];
    trail.current = [];
    idRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;
    hardRef.current = false;
    frozenUntil.current = 0;
    shake.current = 0;
    setScore(0); setLives(3); setCombo(0); setHardMode(false); setFrozen(false); setPenalty('');
    playingRef.current = true;
    setIsPlaying(true);
    playSfx('whoosh');
  };

  // pointer handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
    };
    const down = (ev: PointerEvent) => {
      slicing.current = true;
      canvas.setPointerCapture(ev.pointerId);
      const p = pos(ev);
      trail.current.push({ ...p, t: performance.now() });
      sliceAt(p.x, p.y);
    };
    const move = (ev: PointerEvent) => {
      if (!slicing.current) return;
      const p = pos(ev);
      const last = trail.current[trail.current.length - 1];
      trail.current.push({ ...p, t: performance.now() });
      // interpolate so fast swipes still register
      if (last) {
        const steps = Math.min(12, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 10));
        for (let i = 1; i <= steps; i++) {
          sliceAt(last.x + (p.x - last.x) * (i / steps), last.y + (p.y - last.y) * (i / steps));
        }
      }
      sliceAt(p.x, p.y);
    };
    const up = () => { slicing.current = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [sliceAt]);

  // main loop (runs always so the idle screen still renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let lastSpawn = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const isFrozen = now < frozenUntil.current;
      if (frozen !== isFrozen) setFrozen(isFrozen);
      const slow = isFrozen ? 0.4 : 1;

      if (playingRef.current) {
        const interval = (hardRef.current ? 620 : 950) * (isFrozen ? 2 : 1);
        if (now - lastSpawn > interval) {
          lastSpawn = now;
          spawn();
          if (hardRef.current && Math.random() < 0.45) spawn();
        }
        if (comboRef.current > 0 && now > comboTimer.current) {
          comboRef.current = 0;
          setCombo(0);
        }
      }

      // physics
      const next: Entity[] = [];
      for (const e of entities.current) {
        if (e.life <= 0 && (e.type === 'fruit' || e.type === 'bomb' || e.type === 'ice')) continue;
        e.vy += GRAVITY * slow;
        e.x += e.vx * slow;
        e.y += e.vy * slow;
        e.rot += e.vRot * slow;
        if (e.type === 'juice') e.life -= 0.02;
        if (e.y > H + 90 || e.life <= 0) {
          if (e.type === 'fruit' && playingRef.current) {
            scoreRef.current = Math.max(0, scoreRef.current - 10);
            setScore(scoreRef.current);
            loseLife('⬇ Missed! -10 pts & -1 life');
            playSfx('error');
          }
          continue;
        }
        next.push(e);
      }
      entities.current = next;

      // draw
      ctx.save();
      if (shake.current > 0) {
        shake.current *= 0.86;
        ctx.translate((Math.random() - 0.5) * shake.current, (Math.random() - 0.5) * shake.current);
      }
      const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H);
      bg.addColorStop(0, hardRef.current ? '#4a1020' : '#2c3e50');
      bg.addColorStop(1, '#05070c');
      ctx.fillStyle = bg;
      ctx.fillRect(-40, -40, W + 80, H + 80);

      if (isFrozen) {
        ctx.fillStyle = 'rgba(127,216,255,0.10)';
        ctx.fillRect(-40, -40, W + 80, H + 80);
      }

      for (const e of entities.current) {
        if (e.type === 'juice') {
          ctx.globalAlpha = Math.max(0, e.life);
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rot);
        ctx.font = `${e.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (e.type === 'half' && e.half) {
          ctx.beginPath();
          if (e.half === 'left') ctx.rect(-e.size, -e.size, e.size, e.size * 2);
          else ctx.rect(0, -e.size, e.size, e.size * 2);
          ctx.clip();
        }
        if (e.type === 'bomb') {
          ctx.shadowColor = '#ff5533';
          ctx.shadowBlur = 18;
        }
        ctx.fillText(e.emoji, 0, 0);
        ctx.restore();
      }

      // floaters
      floaters.current = floaters.current.filter(f => f.life > 0);
      for (const f of floaters.current) {
        f.life -= 0.02;
        f.y -= 0.9;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = f.color;
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      }

      // blade trail
      const cutoff = now - 180;
      trail.current = trail.current.filter(p => p.t > cutoff);
      if (trail.current.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          ctx.moveTo(trail.current[0].x, trail.current[0].y);
          for (const p of trail.current) ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = pass === 0 ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.95)';
          ctx.lineWidth = pass === 0 ? 14 : 4;
          ctx.stroke();
        }
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [spawn, loseLife, frozen]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-wrap gap-6 justify-center text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-warning">{best}</div>
          <div className="text-xs text-muted-foreground">Best</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{lives > 0 ? '❤️'.repeat(lives) : '💀'}</div>
          <div className="text-xs text-muted-foreground">Lives</div>
        </div>
        {combo > 1 && (
          <div className="animate-pulse">
            <div className="text-2xl font-bold text-yellow-400">{combo}x</div>
            <div className="text-xs text-muted-foreground">Combo</div>
          </div>
        )}
      </div>

      <div className="flex gap-2 h-6 items-center">
        {hardMode && <span className="text-xs font-bold text-red-400 animate-pulse">🔥 HARD MODE</span>}
        {frozen && <span className="text-xs font-bold text-cyan-300 animate-pulse">🧊 TIME FROZEN</span>}
        {penalty && <span className="text-xs font-bold text-destructive">{penalty}</span>}
      </div>

      <div className="relative w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-xl border-4 border-primary touch-none cursor-crosshair"
          style={{ aspectRatio: `${W}/${H}` }}
        />
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center px-6">
              <h3 className="font-display text-2xl font-bold text-gradient mb-2">Fruit Slice</h3>
              {scoreRef.current > 0 && <p className="text-white text-lg mb-2">Final Score: {score}</p>}
              <p className="text-xs text-muted-foreground mb-4">
                Swipe to slice fruit. Avoid 💣 bombs, grab 🧊 to slow time. Missed fruit costs a life.
              </p>
              <Button onClick={startGame} variant="gaming" size="lg">
                {scoreRef.current > 0 ? 'Play Again' : 'Start Game'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Drag across the board to swipe — chain slices fast for combo bonuses.
      </p>
    </div>
  );
};

export default FruitSlice;
