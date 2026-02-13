import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Entity { x: number; y: number; id: number; }

const CoinDash: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const playerRef = useRef({ x: 200, y: 350 });
  const coinsRef = useRef<Entity[]>([]);
  const enemiesRef = useRef<Entity[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const nextIdRef = useRef(0);

  const reset = () => {
    playerRef.current = { x: 200, y: 350 };
    coinsRef.current = [];
    enemiesRef.current = [];
    setScore(0);
    setLives(3);
    setGameOver(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 400, H = 400;

    const loop = () => {
      frameRef.current++;
      const p = playerRef.current;
      const speed = 4;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) p.x = Math.max(15, p.x - speed);
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) p.x = Math.min(W - 15, p.x + speed);
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) p.y = Math.max(15, p.y - speed);
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) p.y = Math.min(H - 15, p.y + speed);

      if (frameRef.current % 40 === 0) {
        coinsRef.current.push({ x: Math.random() * (W - 20) + 10, y: -10, id: nextIdRef.current++ });
      }
      if (frameRef.current % 80 === 0) {
        enemiesRef.current.push({ x: Math.random() * (W - 20) + 10, y: -10, id: nextIdRef.current++ });
      }

      coinsRef.current = coinsRef.current.filter(c => { c.y += 2; return c.y < H + 10; });
      enemiesRef.current = enemiesRef.current.filter(e => { e.y += 3; return e.y < H + 10; });

      // Collect coins
      coinsRef.current = coinsRef.current.filter(c => {
        if (Math.hypot(c.x - p.x, c.y - p.y) < 20) { setScore(s => s + 10); return false; }
        return true;
      });

      // Hit enemies
      enemiesRef.current = enemiesRef.current.filter(e => {
        if (Math.hypot(e.x - p.x, e.y - p.y) < 20) {
          setLives(l => { const n = l - 1; if (n <= 0) setGameOver(true); return n; });
          return false;
        }
        return true;
      });

      // Draw
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(100,100,255,0.1)';
      for (let i = 0; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Player
      ctx.fillStyle = '#4ECDC4';
      ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();

      // Coins
      coinsRef.current.forEach(c => {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFA500';
        ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
      });

      // Enemies
      enemiesRef.current.forEach(e => {
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
      });

      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-[400px] mb-2">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="font-bold text-destructive">{'❤️'.repeat(lives)}</span>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-border">
        <canvas ref={canvasRef} width={400} height={400} />
        {gameOver && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center flex-col gap-4">
            <h2 className="text-3xl font-bold">Game Over!</h2>
            <p className="text-xl text-primary">Score: {score}</p>
            <button onClick={reset} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Retry</button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">WASD or Arrow keys to move</p>
    </div>
  );
};

export default CoinDash;
