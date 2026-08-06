import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GravityRunnerProps {
  onScoreUpdate?: (score: number) => void;
}

const GravityRunner: React.FC<GravityRunnerProps> = ({ onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({ y: 200, vy: 0, gravity: 0.5, flipped: false, obstacles: [] as { x: number; y: number; h: number; top: boolean }[], speed: 3, frame: 0, alive: true });

  const flip = useCallback(() => {
    if (!stateRef.current.alive) return;
    stateRef.current.flipped = !stateRef.current.flipped;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); flip(); } };
    const handleClick = () => flip();
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handleClick);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('click', handleClick); };
  }, [flip]);

  useEffect(() => {
    onScoreUpdate?.(score);
  }, [score, onScoreUpdate]);

  const reset = () => {
    stateRef.current = { y: 200, vy: 0, gravity: 0.5, flipped: false, obstacles: [], speed: 3, frame: 0, alive: true };
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 400, H = 400;

    const loop = () => {
      const s = stateRef.current;
      if (!s.alive) return;
      s.frame++;
      const gDir = s.flipped ? -1 : 1;
      s.vy += s.gravity * gDir;
      s.y += s.vy;
      s.vy *= 0.98;

      if (s.y < 15) { s.y = 15; s.vy = 0; }
      if (s.y > H - 15) { s.y = H - 15; s.vy = 0; }

      if (s.frame % 60 === 0) {
        const top = Math.random() > 0.5;
        s.obstacles.push({ x: W + 20, y: top ? 0 : H - 80, h: 60 + Math.random() * 60, top });
        s.speed = Math.min(6, 3 + s.frame / 500);
      }

      s.obstacles = s.obstacles.filter(o => { o.x -= s.speed; return o.x > -30; });

      // Collision
      s.obstacles.forEach(o => {
        if (50 > o.x && 50 < o.x + 25) {
          if (o.top && s.y - 10 < o.h) { s.alive = false; setGameOver(true); }
          if (!o.top && s.y + 10 > o.y) { s.alive = false; setGameOver(true); }
        }
      });

      if (s.frame % 5 === 0) setScore(Math.floor(s.frame / 5));

      // Draw
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137 + s.frame * 0.5) % W;
        const sy = (i * 97) % H;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Player
      const gradient = ctx.createRadialGradient(50, s.y, 0, 50, s.y, 15);
      gradient.addColorStop(0, s.flipped ? '#FF6B6B' : '#4ECDC4');
      gradient.addColorStop(1, s.flipped ? '#C44569' : '#45B7D1');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(50, s.y, 12, 0, Math.PI * 2); ctx.fill();

      // Gravity indicator
      ctx.fillStyle = s.flipped ? '#FF6B6B' : '#4ECDC4';
      ctx.beginPath();
      const arrowY = s.flipped ? s.y - 20 : s.y + 20;
      ctx.moveTo(50, arrowY);
      ctx.lineTo(45, arrowY + (s.flipped ? 5 : -5));
      ctx.lineTo(55, arrowY + (s.flipped ? 5 : -5));
      ctx.fill();

      // Obstacles
      s.obstacles.forEach(o => {
        const grad = ctx.createLinearGradient(o.x, o.y, o.x + 25, o.y + o.h);
        grad.addColorStop(0, '#FF6B6B');
        grad.addColorStop(1, '#C44569');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, 25, o.h);
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
        <span className="text-xs text-muted-foreground">Click/Space to flip gravity</span>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-border">
        <canvas ref={canvasRef} width={400} height={400} />
        {gameOver && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center flex-col gap-4">
            <h2 className="text-3xl font-bold">Crashed!</h2>
            <p className="text-xl text-primary">Score: {score}</p>
            <button onClick={reset} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GravityRunner;
