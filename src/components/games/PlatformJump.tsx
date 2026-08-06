import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
}

interface PlatformJumpProps {
  onScoreUpdate?: (score: number) => void;
}

const PlatformJump: React.FC<PlatformJumpProps> = ({ onScoreUpdate }) => {
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(80);
  const [velocityY, setVelocityY] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  
  const generatePlatforms = () => {
    const plats: Platform[] = [];
    for (let i = 0; i < 8; i++) {
      plats.push({
        id: i,
        x: Math.random() * 70 + 10,
        y: 90 - i * 12,
        width: 15 + Math.random() * 10,
      });
    }
    return plats;
  };
  
  const startGame = () => {
    setPlayerX(50);
    setPlayerY(80);
    setVelocityY(-8);
    setPlatforms(generatePlatforms());
    setScore(0);
    setGameActive(true);
    setGameOver(false);
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setPlayerX(x => Math.max(5, x - 5));
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      setPlayerX(x => Math.min(95, x + 5));
    }
  }, [gameActive]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    
    const gameLoop = setInterval(() => {
      setVelocityY(v => v + 0.4); // Gravity
      setPlayerY(y => {
        const newY = y + velocityY;
        
        // Check platform collisions when falling
        if (velocityY > 0) {
          for (const plat of platforms) {
            if (
              newY >= plat.y - 3 && newY <= plat.y + 3 &&
              playerX >= plat.x - 5 && playerX <= plat.x + plat.width + 5
            ) {
              setVelocityY(-10); // Bounce
              setScore(s => {
                const newScore = s + 10;
                onScoreUpdate?.(newScore);
                return newScore;
              });
              return plat.y - 3;
            }
          }
        }
        
        // Game over if fall below
        if (newY > 100) {
          setGameActive(false);
          setGameOver(true);
          setScore(s => { onScoreUpdate?.(s); return s; });
          return y;
        }
        
        return newY;
      });
      
      // Move platforms down and generate new ones
      if (playerY < 40) {
        setPlatforms(prev => {
          const moved = prev.map(p => ({ ...p, y: p.y + 2 })).filter(p => p.y < 100);
          
          while (moved.length < 8) {
            moved.push({
              id: Date.now() + Math.random(),
              x: Math.random() * 70 + 10,
              y: -10,
              width: 15 + Math.random() * 10,
            });
          }
          
          return moved;
        });
        setPlayerY(y => y + 2);
      }
    }, 30);
    
    return () => clearInterval(gameLoop);
  }, [gameActive, velocityY, playerX, playerY, platforms]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xl font-bold">Score: {score}</div>
      
      <div
        ref={gameRef}
        className="relative w-80 h-[500px] bg-gradient-to-b from-indigo-900 to-purple-900 rounded-xl border-2 border-border overflow-hidden"
      >
        {!gameActive && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">Platform Jump</h3>
            <p className="text-muted-foreground mb-4">Use ← → or A/D to move</p>
            <Button onClick={startGame} variant="gaming">
              <Play className="w-5 h-5 mr-2" /> Start
            </Button>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <div className="text-2xl font-bold mb-2">Game Over!</div>
            <div className="text-xl mb-4">Score: {score}</div>
            <Button onClick={startGame} variant="gaming">Play Again</Button>
          </div>
        )}
        
        {/* Platforms */}
        {platforms.map(plat => (
          <div
            key={plat.id}
            className="absolute h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            style={{
              left: `${plat.x}%`,
              top: `${plat.y}%`,
              width: `${plat.width}%`,
            }}
          />
        ))}
        
        {/* Player */}
        <div
          className="absolute w-8 h-8 bg-yellow-400 rounded-full transition-all flex items-center justify-center text-xl"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          😊
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">Use arrow keys or A/D to move</p>
    </div>
  );
};

export default PlatformJump;
