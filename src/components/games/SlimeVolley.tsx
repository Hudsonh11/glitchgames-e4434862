import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { RotateCcw } from 'lucide-react';

const W = 600, H = 360;
const GROUND = H - 30;
const SLIME_R = 50;
const BALL_R = 12;
const NET_W = 6, NET_H = 80;
const GRAVITY = 0.45;

const SlimeVolley: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateGameStats } = useGame();
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [over, setOver] = useState(false);
  const stateRef = useRef({
    p: { x: 150, y: GROUND, vx: 0, vy: 0 },
    a: { x: W - 150, y: GROUND, vx: 0, vy: 0 },
    b: { x: 150, y: 100, vx: 3, vy: 0 },
    keys: { left: false, right: false, up: false },
  });

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    let raf = 0;
    let pScore = 0, aScore = 0;

    const reset = (toRight: boolean) => {
      const s = stateRef.current;
      s.b.x = toRight ? W - 150 : 150;
      s.b.y = 100;
      s.b.vx = toRight ? -3 : 3;
      s.b.vy = 0;
    };

    const loop = () => {
      const s = stateRef.current;
      // Player
      if (s.keys.left) s.p.vx = -5;
      else if (s.keys.right) s.p.vx = 5;
      else s.p.vx = 0;
      if (s.keys.up && s.p.y >= GROUND) s.p.vy = -10;
      s.p.vy += GRAVITY;
      s.p.x += s.p.vx;
      s.p.y += s.p.vy;
      if (s.p.y > GROUND) { s.p.y = GROUND; s.p.vy = 0; }
      s.p.x = Math.max(SLIME_R, Math.min(W / 2 - NET_W / 2 - SLIME_R, s.p.x));

      // AI
      const targetX = s.b.x;
      if (targetX > W / 2 + 20) {
        if (s.a.x < targetX - 5) s.a.vx = 4;
        else if (s.a.x > targetX + 5) s.a.vx = -4;
        else s.a.vx = 0;
        if (s.b.y > 150 && s.a.y >= GROUND && Math.abs(s.b.x - s.a.x) < 80) s.a.vy = -10;
      } else {
        s.a.vx = 0;
      }
      s.a.vy += GRAVITY;
      s.a.x += s.a.vx;
      s.a.y += s.a.vy;
      if (s.a.y > GROUND) { s.a.y = GROUND; s.a.vy = 0; }
      s.a.x = Math.max(W / 2 + NET_W / 2 + SLIME_R, Math.min(W - SLIME_R, s.a.x));

      // Ball
      s.b.vy += GRAVITY * 0.6;
      s.b.x += s.b.vx;
      s.b.y += s.b.vy;
      if (s.b.x < BALL_R) { s.b.x = BALL_R; s.b.vx *= -1; }
      if (s.b.x > W - BALL_R) { s.b.x = W - BALL_R; s.b.vx *= -1; }
      // Net
      if (s.b.y > GROUND - NET_H && Math.abs(s.b.x - W / 2) < NET_W / 2 + BALL_R) {
        s.b.vx *= -1;
        s.b.x += s.b.vx > 0 ? 5 : -5;
      }
      // Slime collision
      [s.p, s.a].forEach(slime => {
        const dx = s.b.x - slime.x;
        const dy = s.b.y - slime.y;
        const dist = Math.hypot(dx, dy);
        if (dist < SLIME_R + BALL_R && dy < 0) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.max(8, Math.hypot(s.b.vx, s.b.vy));
          s.b.vx = Math.cos(angle) * speed;
          s.b.vy = Math.sin(angle) * speed;
        }
      });

      // Score
      if (s.b.y >= GROUND - BALL_R) {
        if (s.b.x < W / 2) {
          aScore++;
          setAiScore(aScore);
          reset(false);
        } else {
          pScore++;
          setPlayerScore(pScore);
          reset(true);
        }
        if (pScore >= 7 || aScore >= 7) {
          setOver(true);
          updateGameStats('slime-volley', pScore * 100, 60);
          cancelAnimationFrame(raf);
          return;
        }
      }

      // Draw
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);
      // Ground
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      // Net
      ctx.fillStyle = '#475569';
      ctx.fillRect(W / 2 - NET_W / 2, GROUND - NET_H, NET_W, NET_H);
      // Slimes
      const drawSlime = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, SLIME_R, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + (color === '#ef4444' ? 15 : -15), y - 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + (color === '#ef4444' ? 17 : -13), y - 25, 3, 0, Math.PI * 2);
        ctx.fill();
      };
      drawSlime(s.p.x, s.p.y, '#3b82f6');
      drawSlime(s.a.x, s.a.y, '#ef4444');
      // Ball
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s.b.x, s.b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') stateRef.current.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') stateRef.current.keys.up = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') stateRef.current.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') stateRef.current.keys.up = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [updateGameStats]);

  const restart = () => window.location.reload();
  const setKey = (k: 'left' | 'right' | 'up', v: boolean) => { stateRef.current.keys[k] = v; };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6 font-bold">
        <span className="text-blue-400">You: {playerScore}</span>
        <span className="text-muted-foreground">First to 7</span>
        <span className="text-red-400">CPU: {aiScore}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="rounded-xl border border-border max-w-full" />
      <div className="flex gap-2 sm:hidden">
        <Button onTouchStart={() => setKey('left', true)} onTouchEnd={() => setKey('left', false)} variant="outline">←</Button>
        <Button onTouchStart={() => setKey('up', true)} onTouchEnd={() => setKey('up', false)} variant="gaming">JUMP</Button>
        <Button onTouchStart={() => setKey('right', true)} onTouchEnd={() => setKey('right', false)} variant="outline">→</Button>
      </div>
      <p className="text-xs text-muted-foreground">Arrow keys / WASD / Space to jump</p>
      {over && (
        <div className="text-center">
          <p className="font-bold mb-2">{playerScore > aiScore ? '🏆 You Win!' : '😢 CPU Wins'}</p>
          <Button variant="gaming" onClick={restart}><RotateCcw className="w-4 h-4 mr-1" />Rematch</Button>
        </div>
      )}
    </div>
  );
};

export default SlimeVolley;
