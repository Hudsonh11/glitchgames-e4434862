import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Game2048Props {
  onScoreUpdate?: (score: number) => void;
}

type Grid = number[][];

const Game2048: React.FC<Game2048Props> = ({ onScoreUpdate }) => {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initGrid = useCallback(() => {
    const newGrid: Grid = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }, []);

  const addRandomTile = (grid: Grid) => {
    const empty: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) empty.push([i, j]);
      }
    }
    if (empty.length > 0) {
      const [row, col] = empty[Math.floor(Math.random() * empty.length)];
      grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const canMove = (grid: Grid): boolean => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) return true;
        if (j < 3 && grid[i][j] === grid[i][j + 1]) return true;
        if (i < 3 && grid[i][j] === grid[i + 1][j]) return true;
      }
    }
    return false;
  };

  const moveLeft = (grid: Grid): [Grid, number] => {
    let points = 0;
    const newGrid = grid.map(row => {
      const filtered = row.filter(x => x !== 0);
      const merged: number[] = [];
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          points += filtered[i] * 2;
          if (filtered[i] * 2 === 2048) setWon(true);
          i++;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      return merged;
    });
    return [newGrid, points];
  };

  const rotate = (grid: Grid): Grid => {
    return grid[0].map((_, i) => grid.map(row => row[i]).reverse());
  };

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;

    let newGrid = grid.map(row => [...row]);
    let rotations = 0;

    switch (direction) {
      case 'right': rotations = 2; break;
      case 'up': rotations = 1; break;
      case 'down': rotations = 3; break;
    }

    for (let i = 0; i < rotations; i++) newGrid = rotate(newGrid);
    const [movedGrid, points] = moveLeft(newGrid);
    newGrid = movedGrid;
    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotate(newGrid);

    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(s => {
        const newScore = s + points;
        onScoreUpdate?.(newScore);
        return newScore;
      });

      if (!canMove(newGrid)) {
        setGameOver(true);
        toast.error('Game Over!');
      }
    }
  }, [grid, gameOver, onScoreUpdate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const dir = e.key.replace('Arrow', '').toLowerCase() as 'left' | 'right' | 'up' | 'down';
      move(dir);
    }
  }, [move]);

  useEffect(() => {
    setGrid(initGrid());
  }, [initGrid]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const restart = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const getTileColor = (value: number): string => {
    const colors: Record<number, string> = {
      0: 'bg-muted',
      2: 'bg-amber-100 text-amber-900',
      4: 'bg-amber-200 text-amber-900',
      8: 'bg-orange-300 text-white',
      16: 'bg-orange-400 text-white',
      32: 'bg-orange-500 text-white',
      64: 'bg-red-500 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-yellow-700 text-white',
      2048: 'bg-primary text-primary-foreground',
    };
    return colors[value] || 'bg-purple-600 text-white';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-bold text-primary">Score: {score}</div>
      
      <div className="p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-4 gap-2">
          {grid.map((row, i) =>
            row.map((value, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center font-bold text-lg md:text-2xl transition-all ${getTileColor(value)}`}
              >
                {value || ''}
              </div>
            ))
          )}
        </div>
      </div>

      {(gameOver || won) && (
        <div className="text-center">
          <p className="text-xl font-bold mb-2">
            {won ? '🎉 You reached 2048!' : 'Game Over!'}
          </p>
          <Button onClick={restart} variant="gaming">Play Again</Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div></div>
        <Button onClick={() => move('up')} size="lg">↑</Button>
        <div></div>
        <Button onClick={() => move('left')} size="lg">←</Button>
        <Button onClick={() => move('down')} size="lg">↓</Button>
        <Button onClick={() => move('right')} size="lg">→</Button>
      </div>
      
      <p className="text-sm text-muted-foreground">Arrow keys or buttons to move tiles</p>
    </div>
  );
};

export default Game2048;
