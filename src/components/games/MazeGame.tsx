import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

interface Position {
  x: number;
  y: number;
}

interface MazeGameProps {
  onScoreUpdate?: (score: number) => void;
}

const MazeGame: React.FC<MazeGameProps> = ({ onScoreUpdate }) => {
  const { updateGameStats, isLoggedIn } = useGame();
  const { toast } = useToast();
  
  const generateMaze = useCallback(() => {
    // Simple maze generation (1 = wall, 0 = path, 2 = goal)
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  }, []);

  const [maze] = useState(generateMaze);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 1 });
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const move = useCallback((dx: number, dy: number) => {
    if (gameOver) return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10 && maze[newY][newX] !== 1) {
      setPlayerPos({ x: newX, y: newY });
      setMoves(m => m + 1);
      
      if (maze[newY][newX] === 2) {
        const score = Math.max(1000 - moves * 10, 100);
        setGameOver(true);
        onScoreUpdate?.(score);
        
        if (isLoggedIn) {
          const timePlayed = Math.floor((Date.now() - startTime) / 1000);
          updateGameStats('maze', score, timePlayed);
        }
        
        toast({
          title: '🎉 Maze Complete!',
          description: `You escaped in ${moves + 1} moves! Score: ${score}`,
        });
      }
    }
  }, [playerPos, maze, moves, gameOver, onScoreUpdate, isLoggedIn, startTime, updateGameStats, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          move(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const restart = () => {
    setPlayerPos({ x: 0, y: 1 });
    setMoves(0);
    setGameOver(false);
  };

  const CELL_SIZE = 32;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Stats */}
      <div className="flex gap-6 text-lg font-display">
        <span>Moves: <span className="text-primary font-bold">{moves}</span></span>
      </div>

      {/* Maze Grid */}
      <div 
        className="relative bg-card rounded-xl p-2 border border-border"
        style={{ 
          width: CELL_SIZE * 10 + 16,
          height: CELL_SIZE * 10 + 16 
        }}
      >
        {maze.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute transition-all ${
                cell === 1 
                  ? 'bg-muted-foreground/50' 
                  : cell === 2 
                    ? 'bg-success/50' 
                    : 'bg-background/50'
              }`}
              style={{
                left: x * CELL_SIZE + 8,
                top: y * CELL_SIZE + 8,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: 4,
              }}
            >
              {cell === 2 && (
                <Trophy className="w-5 h-5 text-success absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
          ))
        ))}
        
        {/* Player */}
        <div
          className="absolute bg-primary rounded-full transition-all duration-150 shadow-neon"
          style={{
            left: playerPos.x * CELL_SIZE + 8 + 4,
            top: playerPos.y * CELL_SIZE + 8 + 4,
            width: CELL_SIZE - 10,
            height: CELL_SIZE - 10,
          }}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button variant="outline" size="icon" onClick={() => move(0, -1)}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <div />
        <Button variant="outline" size="icon" onClick={() => move(-1, 0)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => move(0, 1)}>
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => move(1, 0)}>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Use arrow keys or WASD to move. Reach the trophy!
      </p>
    </div>
  );
};

export default MazeGame;
