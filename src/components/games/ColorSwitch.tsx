import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308'];

interface Obstacle {
  id: number;
  y: number;
  gapColor: string;
}

const ColorSwitch: React.FC = () => {
  const [playerY, setPlayerY] = useState(70);
  const [playerColor, setPlayerColor] = useState(colors[0]);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const startGame = () => {
    setPlayerY(70);
    setPlayerColor(colors[0]);
    setVelocity(0);
    setObstacles([{ id: 0, y: 20, gapColor: colors[Math.floor(Math.random() * colors.length)] }]);
    setScore(0);
    setGameActive(true);
    setGameOver(false);
  };
  
  const jump = useCallback(() => {
    if (!gameActive) return;
    setVelocity(-6);
  }, [gameActive]);
  
  const switchColor = useCallback(() => {
    setPlayerColor(prev => {
      const currentIndex = colors.indexOf(prev);
      return colors[(currentIndex + 1) % colors.length];
    });
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      } else if (e.code === 'KeyC') {
        switchColor();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, switchColor]);
  
  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    
    const gameLoop = setInterval(() => {
      // Apply gravity
      setVelocity(v => v + 0.3);
      setPlayerY(y => {
        const newY = y + velocity;
        
        // Check bounds
        if (newY < 5 || newY > 95) {
          setGameActive(false);
          setGameOver(true);
          return y;
        }
        
        return newY;
      });
      
      // Move obstacles
      setObstacles(prev => {
        const updated = prev.map(obs => ({ ...obs, y: obs.y + 0.5 }));
        
        // Check collisions
        for (const obs of updated) {
          if (Math.abs(obs.y - playerY) < 8) {
            if (playerColor !== obs.gapColor) {
              setGameActive(false);
              setGameOver(true);
              return prev;
            } else if (Math.abs(obs.y - playerY) < 3) {
              setScore(s => s + 1);
              obs.y = 200; // Remove
            }
          }
        }
        
        // Remove passed obstacles and add new ones
        const filtered = updated.filter(obs => obs.y < 100);
        while (filtered.length < 3) {
          const lastY = filtered.length > 0 ? filtered[filtered.length - 1].y : 0;
          filtered.push({
            id: Date.now() + Math.random(),
            y: lastY - 30,
            gapColor: colors[Math.floor(Math.random() * colors.length)],
          });
        }
        
        return filtered;
      });
    }, 30);
    
    return () => clearInterval(gameLoop);
  }, [gameActive, velocity, playerY, playerColor]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xl font-bold">Score: {score}</div>
      
      <div
        onClick={jump}
        className="relative w-64 h-[500px] bg-gray-900 rounded-xl border-2 border-border overflow-hidden cursor-pointer"
      >
        {!gameActive && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">Color Switch</h3>
            <p className="text-muted-foreground mb-2">Space to jump, C to switch color</p>
            <p className="text-muted-foreground mb-4">Match your color to pass!</p>
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
        
        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className="absolute left-0 right-0 flex"
            style={{ top: `${obs.y}%` }}
          >
            {colors.map(color => (
              <div
                key={color}
                className="flex-1 h-6"
                style={{ 
                  backgroundColor: color,
                  opacity: color === obs.gapColor ? 0.3 : 1
                }}
              />
            ))}
          </div>
        ))}
        
        {/* Player */}
        <div
          className="absolute left-1/2 w-8 h-8 rounded-full border-2 border-white shadow-lg transition-all"
          style={{
            top: `${playerY}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: playerColor,
          }}
        />
        
        {/* Color indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {colors.map(color => (
            <div
              key={color}
              className={`w-6 h-6 rounded-full border-2 ${color === playerColor ? 'border-white scale-125' : 'border-transparent opacity-50'}`}
              style={{ backgroundColor: color }}
              onClick={(e) => { e.stopPropagation(); setPlayerColor(color); }}
            />
          ))}
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">Click/Space to jump • C to switch color</p>
    </div>
  );
};

export default ColorSwitch;
