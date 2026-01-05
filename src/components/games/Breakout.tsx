import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BreakoutProps {
  onScoreUpdate?: (score: number) => void;
}

const Breakout: React.FC<BreakoutProps> = ({ onScoreUpdate }) => {
  const [paddleX, setPaddleX] = useState(160);
  const [ball, setBall] = useState({ x: 200, y: 300, vx: 4, vy: -4 });
  const [bricks, setBricks] = useState<{ x: number; y: number; color: string; alive: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();

  const initBricks = useCallback(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const newBricks: { x: number; y: number; color: string; alive: boolean }[] = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        newBricks.push({
          x: col * 50 + 5,
          y: row * 25 + 30,
          color: colors[row],
          alive: true
        });
      }
    }
    return newBricks;
  }, []);

  useEffect(() => {
    setBricks(initBricks());
  }, [initBricks]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPaddleX(x => Math.max(0, x - 20));
    if (e.key === 'ArrowRight') setPaddleX(x => Math.min(320, x + 20));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startGame = () => {
    setBall({ x: 200, y: 300, vx: 4, vy: -4 });
    setPaddleX(160);
    setBricks(initBricks());
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      setBall(prev => {
        let { x, y, vx, vy } = prev;

        // Move ball
        x += vx;
        y += vy;

        // Wall collisions
        if (x <= 0 || x >= 390) vx = -vx;
        if (y <= 0) vy = -vy;

        // Paddle collision
        if (y >= 360 && y <= 370 && x >= paddleX && x <= paddleX + 80) {
          vy = -Math.abs(vy);
          // Add angle based on where ball hits paddle
          const hitPos = (x - paddleX) / 80;
          vx = (hitPos - 0.5) * 8;
        }

        // Ball fell
        if (y > 400) {
          setLives(l => {
            if (l <= 1) {
              setGameOver(true);
              onScoreUpdate?.(score);
              toast.error(`Game Over! Score: ${score}`);
              return 0;
            }
            return l - 1;
          });
          return { x: 200, y: 300, vx: 4, vy: -4 };
        }

        // Brick collisions
        setBricks(prevBricks => {
          let hit = false;
          const newBricks = prevBricks.map(brick => {
            if (!brick.alive) return brick;
            if (x >= brick.x && x <= brick.x + 45 &&
                y >= brick.y && y <= brick.y + 20) {
              hit = true;
              setScore(s => s + 10);
              return { ...brick, alive: false };
            }
            return brick;
          });

          if (hit) {
            vy = -vy;
          }

          // Check if all bricks destroyed
          if (newBricks.every(b => !b.alive)) {
            setGameOver(true);
            const bonus = lives * 100;
            setScore(s => s + bonus);
            onScoreUpdate?.(score + bonus);
            toast.success(`🎉 You win! Bonus: ${bonus}`);
          }

          return newBricks;
        });

        return { x, y, vx, vy };
      });
    }, 20);

    return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, paddleX, lives, score, initBricks, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6">
        <div className="text-xl font-bold text-primary">Score: {score}</div>
        <div className="text-xl font-bold text-red-500">{'❤️'.repeat(lives)}</div>
      </div>

      <div 
        className="relative w-[400px] h-[400px] bg-gray-900 rounded-xl overflow-hidden border-2 border-primary"
      >
        {/* Bricks */}
        {bricks.filter(b => b.alive).map((brick, i) => (
          <div
            key={i}
            className="absolute rounded transition-all"
            style={{
              left: brick.x,
              top: brick.y,
              width: 45,
              height: 20,
              backgroundColor: brick.color,
              boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`
            }}
          />
        ))}

        {/* Ball */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white]"
          style={{ left: ball.x - 8, top: ball.y - 8 }}
        />

        {/* Paddle */}
        <div
          className="absolute h-3 rounded-full bg-gradient-to-r from-primary to-secondary"
          style={{ left: paddleX, top: 370, width: 80 }}
        />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Button onClick={startGame} variant="gaming" size="lg">Start Game</Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-xl mb-4">Score: {score}</p>
              <Button onClick={startGame} variant="gaming">Play Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setPaddleX(x => Math.max(0, x - 30))} size="lg" className="w-24">← Left</Button>
        <Button onClick={() => setPaddleX(x => Math.min(320, x + 30))} size="lg" className="w-24">Right →</Button>
      </div>

      <p className="text-sm text-muted-foreground">Arrow keys or buttons to move paddle</p>
    </div>
  );
};

export default Breakout;
