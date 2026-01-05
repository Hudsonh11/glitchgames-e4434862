import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SpaceInvadersProps {
  onScoreUpdate?: (score: number) => void;
}

const SpaceInvaders: React.FC<SpaceInvadersProps> = ({ onScoreUpdate }) => {
  const [playerX, setPlayerX] = useState(180);
  const [bullets, setBullets] = useState<{ x: number; y: number }[]>([]);
  const [aliens, setAliens] = useState<{ x: number; y: number; alive: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [alienDirection, setAlienDirection] = useState(1);
  const gameLoopRef = useRef<number>();

  const initAliens = useCallback(() => {
    const newAliens: { x: number; y: number; alive: boolean }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        newAliens.push({ x: col * 45 + 20, y: row * 40 + 20, alive: true });
      }
    }
    return newAliens;
  }, []);

  useEffect(() => {
    setAliens(initAliens());
  }, [initAliens]);

  const shoot = useCallback(() => {
    if (gameOver) return;
    setBullets(prev => [...prev, { x: playerX + 15, y: 340 }]);
  }, [playerX, gameOver]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft') setPlayerX(x => Math.max(0, x - 20));
    if (e.key === 'ArrowRight') setPlayerX(x => Math.min(360, x + 20));
    if (e.key === ' ') shoot();
  }, [gameOver, shoot]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      // Move bullets
      setBullets(prev => prev.map(b => ({ ...b, y: b.y - 10 })).filter(b => b.y > 0));

      // Move aliens
      setAliens(prev => {
        const needsReverse = prev.some(a => a.alive && (a.x <= 0 || a.x >= 360));
        if (needsReverse) {
          setAlienDirection(d => -d);
          return prev.map(a => ({ ...a, y: a.y + 20 }));
        }
        return prev.map(a => ({ ...a, x: a.x + alienDirection * 2 }));
      });

      // Check collisions
      setBullets(prevBullets => {
        setAliens(prevAliens => {
          return prevAliens.map(alien => {
            if (!alien.alive) return alien;
            const hit = prevBullets.some(b => 
              b.x >= alien.x && b.x <= alien.x + 30 &&
              b.y >= alien.y && b.y <= alien.y + 25
            );
            if (hit) {
              setScore(s => {
                const newScore = s + 100;
                onScoreUpdate?.(newScore);
                return newScore;
              });
              return { ...alien, alive: false };
            }
            return alien;
          });
        });
        return prevBullets;
      });

      // Check game over
      setAliens(prev => {
        if (prev.some(a => a.alive && a.y >= 320)) {
          setGameOver(true);
          toast.error('Game Over! The aliens invaded!');
        }
        if (prev.every(a => !a.alive)) {
          toast.success('Victory! All aliens destroyed!');
          setGameOver(true);
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, alienDirection, onScoreUpdate]);

  const restart = () => {
    setPlayerX(180);
    setBullets([]);
    setAliens(initAliens());
    setScore(0);
    setGameOver(false);
    setAlienDirection(1);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Score: {score}</div>
      
      <div 
        className="relative w-[400px] h-[400px] bg-black rounded-lg border-2 border-primary overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #0a0a20, #000)' }}
      >
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}

        {/* Aliens */}
        {aliens.filter(a => a.alive).map((alien, i) => (
          <div
            key={i}
            className="absolute text-2xl"
            style={{ left: alien.x, top: alien.y }}
          >
            👾
          </div>
        ))}

        {/* Bullets */}
        {bullets.map((bullet, i) => (
          <div
            key={i}
            className="absolute w-2 h-4 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]"
            style={{ left: bullet.x, top: bullet.y }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute text-3xl"
          style={{ left: playerX, top: 350 }}
        >
          🚀
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <Button onClick={restart} variant="gaming">Play Again</Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setPlayerX(x => Math.max(0, x - 20))} size="lg">←</Button>
        <Button onClick={shoot} variant="gaming" size="lg">FIRE</Button>
        <Button onClick={() => setPlayerX(x => Math.min(360, x + 20))} size="lg">→</Button>
      </div>
      
      <p className="text-sm text-muted-foreground">Arrow keys to move, Space to shoot</p>
    </div>
  );
};

export default SpaceInvaders;
