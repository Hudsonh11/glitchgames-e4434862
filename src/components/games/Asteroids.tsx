import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AsteroidsProps {
  onScoreUpdate?: (score: number) => void;
}

const Asteroids: React.FC<AsteroidsProps> = ({ onScoreUpdate }) => {
  const [shipPos, setShipPos] = useState({ x: 200, y: 200 });
  const [shipAngle, setShipAngle] = useState(-90);
  const [asteroids, setAsteroids] = useState<{ x: number; y: number; size: number; vx: number; vy: number }[]>([]);
  const [bullets, setBullets] = useState<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number>();

  const spawnAsteroids = useCallback(() => {
    const newAsteroids = [];
    for (let i = 0; i < 5; i++) {
      newAsteroids.push({
        x: Math.random() * 400,
        y: Math.random() * 100,
        size: 30 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1
      });
    }
    return newAsteroids;
  }, []);

  useEffect(() => {
    setAsteroids(spawnAsteroids());
  }, [spawnAsteroids]);

  const shoot = useCallback(() => {
    if (gameOver) return;
    const rad = (shipAngle * Math.PI) / 180;
    setBullets(prev => [...prev, {
      x: shipPos.x,
      y: shipPos.y,
      vx: Math.cos(rad) * 10,
      vy: Math.sin(rad) * 10
    }]);
  }, [shipPos, shipAngle, gameOver]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    if (e.key === 'ArrowLeft') setShipAngle(a => a - 15);
    if (e.key === 'ArrowRight') setShipAngle(a => a + 15);
    if (e.key === 'ArrowUp') {
      const rad = (shipAngle * Math.PI) / 180;
      setShipPos(p => ({
        x: Math.max(0, Math.min(400, p.x + Math.cos(rad) * 10)),
        y: Math.max(0, Math.min(400, p.y + Math.sin(rad) * 10))
      }));
    }
    if (e.key === ' ') shoot();
  }, [gameOver, shipAngle, shoot]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = window.setInterval(() => {
      // Move bullets
      setBullets(prev => prev.map(b => ({
        ...b,
        x: b.x + b.vx,
        y: b.y + b.vy
      })).filter(b => b.x > 0 && b.x < 400 && b.y > 0 && b.y < 400));

      // Move asteroids
      setAsteroids(prev => prev.map(a => ({
        ...a,
        x: ((a.x + a.vx) % 400 + 400) % 400,
        y: ((a.y + a.vy) % 400 + 400) % 400
      })));

      // Check bullet collisions
      setAsteroids(prevAsteroids => {
        setBullets(prevBullets => {
          const remainingBullets = [...prevBullets];
          const remainingAsteroids = prevAsteroids.filter(asteroid => {
            const hit = remainingBullets.findIndex(b => 
              Math.hypot(b.x - asteroid.x, b.y - asteroid.y) < asteroid.size / 2
            );
            if (hit !== -1) {
              remainingBullets.splice(hit, 1);
              setScore(s => {
                const newScore = s + Math.round(50 - asteroid.size);
                onScoreUpdate?.(newScore);
                return newScore;
              });
              return false;
            }
            return true;
          });
          
          if (remainingAsteroids.length === 0) {
            setAsteroids(spawnAsteroids());
            toast.success('Wave cleared! +500 bonus!');
            setScore(s => s + 500);
          } else {
            setAsteroids(remainingAsteroids);
          }
          
          return remainingBullets;
        });
        return prevAsteroids;
      });

      // Check ship collision
      setAsteroids(prev => {
        const collision = prev.some(a => 
          Math.hypot(a.x - shipPos.x, a.y - shipPos.y) < a.size / 2 + 15
        );
        if (collision) {
          setGameOver(true);
          toast.error('Ship destroyed!');
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, [gameOver, shipPos, spawnAsteroids, onScoreUpdate]);

  const restart = () => {
    setShipPos({ x: 200, y: 200 });
    setShipAngle(-90);
    setAsteroids(spawnAsteroids());
    setBullets([]);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Score: {score}</div>
      
      <div 
        className="relative w-[400px] h-[400px] max-w-full bg-black rounded-lg border-2 border-primary overflow-hidden touch-none"
        style={{ aspectRatio: '1/1' }}
      >
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/50 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          />
        ))}

        {/* Asteroids */}
        {asteroids.map((asteroid, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-gray-500 to-gray-800 border-2 border-gray-600"
            style={{ 
              left: asteroid.x - asteroid.size / 2, 
              top: asteroid.y - asteroid.size / 2,
              width: asteroid.size,
              height: asteroid.size
            }}
          />
        ))}

        {/* Bullets */}
        {bullets.map((bullet, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_yellow]"
            style={{ left: bullet.x - 4, top: bullet.y - 4 }}
          />
        ))}

        {/* Ship */}
        <div
          className="absolute text-2xl transition-transform"
          style={{ 
            left: shipPos.x - 15, 
            top: shipPos.y - 15,
            transform: `rotate(${shipAngle + 90}deg)`
          }}
        >
          🚀
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <Button onClick={restart} variant="gaming">Play Again</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => setShipAngle(a => a - 15)} size="lg">↶</Button>
        <Button onClick={() => {
          const rad = (shipAngle * Math.PI) / 180;
          setShipPos(p => ({
            x: Math.max(0, Math.min(400, p.x + Math.cos(rad) * 10)),
            y: Math.max(0, Math.min(400, p.y + Math.sin(rad) * 10))
          }));
        }} size="lg">↑</Button>
        <Button onClick={() => setShipAngle(a => a + 15)} size="lg">↷</Button>
        <div></div>
        <Button onClick={shoot} variant="gaming" size="lg">FIRE</Button>
        <div></div>
      </div>
      
      <p className="text-sm text-muted-foreground">Arrows to move/rotate, Space to shoot</p>
    </div>
  );
};

export default Asteroids;
