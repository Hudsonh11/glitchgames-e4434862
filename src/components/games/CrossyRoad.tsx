import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CrossyRoadProps {
  onScoreUpdate?: (score: number) => void;
}

type Lane = {
  type: 'grass' | 'road' | 'water';
  speed: number;
  obstacles: { x: number; width: number; emoji: string }[];
};

const CrossyRoad: React.FC<CrossyRoadProps> = ({ onScoreUpdate }) => {
  const [playerX, setPlayerX] = useState(200);
  const [playerY, setPlayerY] = useState(380);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lanes, setLanes] = useState<Lane[]>([]);

  const generateLane = useCallback((index: number): Lane => {
    const types: ('grass' | 'road' | 'water')[] = ['grass', 'road', 'road', 'water'];
    const type = index === 0 ? 'grass' : types[Math.floor(Math.random() * types.length)];
    const speed = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
    
    const obstacles: { x: number; width: number; emoji: string }[] = [];
    if (type === 'road') {
      const numCars = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numCars; i++) {
        obstacles.push({
          x: Math.random() * 400,
          width: 40,
          emoji: ['🚗', '🚙', '🚕', '🚌'][Math.floor(Math.random() * 4)]
        });
      }
    } else if (type === 'water') {
      const numLogs = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numLogs; i++) {
        obstacles.push({
          x: i * 150 + Math.random() * 50,
          width: 60 + Math.random() * 40,
          emoji: '🪵'
        });
      }
    }
    
    return { type, speed, obstacles };
  }, []);

  useEffect(() => {
    const initialLanes = Array(10).fill(null).map((_, i) => generateLane(i));
    setLanes(initialLanes);
  }, [generateLane]);

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    
    switch (direction) {
      case 'up':
        setPlayerY(y => Math.max(0, y - 40));
        setScore(s => {
          const newScore = s + 1;
          onScoreUpdate?.(newScore);
          return newScore;
        });
        break;
      case 'down':
        setPlayerY(y => Math.min(380, y + 40));
        break;
      case 'left':
        setPlayerX(x => Math.max(0, x - 40));
        break;
      case 'right':
        setPlayerX(x => Math.min(360, x + 40));
        break;
    }
  }, [gameOver, onScoreUpdate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'w') move('up');
    if (e.key === 'ArrowDown' || e.key === 's') move('down');
    if (e.key === 'ArrowLeft' || e.key === 'a') move('left');
    if (e.key === 'ArrowRight' || e.key === 'd') move('right');
  }, [move]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setLanes(prev => prev.map(lane => ({
        ...lane,
        obstacles: lane.obstacles.map(obs => ({
          ...obs,
          x: ((obs.x + lane.speed) % 450 + 450) % 450
        }))
      })));

      // Check collisions
      const laneIndex = Math.floor((380 - playerY) / 40);
      const lane = lanes[laneIndex];
      
      if (lane?.type === 'road') {
        const hit = lane.obstacles.some(obs => 
          playerX >= obs.x - 20 && playerX <= obs.x + obs.width
        );
        if (hit) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          toast.error('💥 Hit by a car!');
        }
      } else if (lane?.type === 'water') {
        const onLog = lane.obstacles.some(obs =>
          playerX >= obs.x - 10 && playerX <= obs.x + obs.width - 20
        );
        if (!onLog) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
          toast.error('💦 Fell in the water!');
        }
      }
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameOver, playerX, playerY, lanes, score, highScore]);

  const restart = () => {
    setPlayerX(200);
    setPlayerY(380);
    setScore(0);
    setGameOver(false);
    setLanes(Array(10).fill(null).map((_, i) => generateLane(i)));
  };

  const getLaneColor = (type: string) => {
    switch (type) {
      case 'grass': return 'bg-green-600';
      case 'road': return 'bg-gray-700';
      case 'water': return 'bg-blue-500';
      default: return 'bg-green-600';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-secondary">{highScore}</div>
          <div className="text-sm text-muted-foreground">Best</div>
        </div>
      </div>

      <div className="relative w-[400px] h-[400px] overflow-hidden rounded-xl border-2 border-primary">
        {/* Lanes */}
        {lanes.map((lane, index) => (
          <div
            key={index}
            className={`absolute w-full h-10 ${getLaneColor(lane.type)}`}
            style={{ bottom: index * 40 }}
          >
            {lane.type === 'road' && (
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-yellow-400 opacity-50" />
            )}
            {lane.obstacles.map((obs, i) => (
              <span
                key={i}
                className="absolute text-2xl"
                style={{ left: obs.x, top: '50%', transform: 'translateY(-50%)' }}
              >
                {obs.emoji}
              </span>
            ))}
          </div>
        ))}

        {/* Player */}
        <div
          className="absolute text-3xl z-10 transition-all duration-100"
          style={{ left: playerX, top: playerY }}
        >
          🐔
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center">
              <p className="text-white text-xl mb-4">Score: {score}</p>
              <Button onClick={restart} variant="gaming">Play Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div></div>
        <Button onClick={() => move('up')} size="lg">↑</Button>
        <div></div>
        <Button onClick={() => move('left')} size="lg">←</Button>
        <Button onClick={() => move('down')} size="lg">↓</Button>
        <Button onClick={() => move('right')} size="lg">→</Button>
      </div>

      <p className="text-sm text-muted-foreground">Arrow keys or WASD to move</p>
    </div>
  );
};

export default CrossyRoad;
