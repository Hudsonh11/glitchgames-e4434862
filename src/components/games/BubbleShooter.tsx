import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'];

const BubbleShooter: React.FC = () => {
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [currentBubble, setCurrentBubble] = useState(colors[0]);
  const [nextBubble, setNextBubble] = useState(colors[1]);
  const [gameOver, setGameOver] = useState(false);
  
  const initGame = useCallback(() => {
    const newGrid: (string | null)[][] = [];
    for (let row = 0; row < 10; row++) {
      newGrid[row] = [];
      for (let col = 0; col < 10; col++) {
        if (row < 5) {
          newGrid[row][col] = colors[Math.floor(Math.random() * colors.length)];
        } else {
          newGrid[row][col] = null;
        }
      }
    }
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setCurrentBubble(colors[Math.floor(Math.random() * colors.length)]);
    setNextBubble(colors[Math.floor(Math.random() * colors.length)]);
  }, []);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  const handleShoot = (col: number) => {
    if (gameOver) return;
    
    let targetRow = -1;
    for (let row = 9; row >= 0; row--) {
      if (grid[row][col] === null) {
        targetRow = row;
        break;
      }
    }
    
    if (targetRow === -1) return;
    
    const newGrid = grid.map(r => [...r]);
    newGrid[targetRow][col] = currentBubble;
    
    // Check for matches (simplified)
    let matches = 0;
    const checkColor = currentBubble;
    for (let r = Math.max(0, targetRow - 1); r <= Math.min(9, targetRow + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
        if (newGrid[r][c] === checkColor) {
          matches++;
        }
      }
    }
    
    if (matches >= 3) {
      for (let r = Math.max(0, targetRow - 1); r <= Math.min(9, targetRow + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
          if (newGrid[r][c] === checkColor) {
            newGrid[r][c] = null;
            setScore(s => s + 10);
          }
        }
      }
    }
    
    setGrid(newGrid);
    setCurrentBubble(nextBubble);
    setNextBubble(colors[Math.floor(Math.random() * colors.length)]);
    
    // Check game over
    if (targetRow === 0) {
      setGameOver(true);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Next:</span>
          <div 
            className="w-8 h-8 rounded-full border-2 border-border"
            style={{ backgroundColor: nextBubble }}
          />
        </div>
        <Button onClick={initGame} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>
      
      <div className="bg-gradient-to-b from-blue-900/50 to-blue-950/50 p-4 rounded-xl border border-border">
        <div className="grid grid-cols-10 gap-1">
          {grid.map((row, rowIndex) =>
            row.map((bubble, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleShoot(colIndex)}
                className="w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110"
                style={{ 
                  backgroundColor: bubble || 'transparent',
                  border: bubble ? 'none' : '1px dashed rgba(255,255,255,0.2)'
                }}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Shooting:</span>
        <div 
          className="w-12 h-12 rounded-full border-4 border-white shadow-lg animate-pulse"
          style={{ backgroundColor: currentBubble }}
        />
      </div>
      
      {gameOver && (
        <div className="text-xl font-bold text-destructive animate-bounce">
          Game Over! Final Score: {score}
        </div>
      )}
    </div>
  );
};

export default BubbleShooter;
