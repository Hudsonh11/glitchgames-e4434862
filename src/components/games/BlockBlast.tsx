import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';
import { Pause, RotateCcw } from 'lucide-react';

const GRID_SIZE = 8;
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
];

type Cell = { color: string; id: number } | null;

const BlockBlast: React.FC = () => {
  const { updateGameStats, addCoins, unlockAchievement } = useGame();
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const initGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    let id = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        row.push({
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          id: id++,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, []);

  useEffect(() => {
    setGrid(initGrid());
  }, [initGrid]);

  const findConnected = (row: number, col: number, color: string, visited: Set<string>): [number, number][] => {
    const key = `${row}-${col}`;
    if (
      row < 0 || row >= GRID_SIZE ||
      col < 0 || col >= GRID_SIZE ||
      visited.has(key) ||
      !grid[row][col] ||
      grid[row][col]!.color !== color
    ) {
      return [];
    }

    visited.add(key);
    const connected: [number, number][] = [[row, col]];

    connected.push(...findConnected(row - 1, col, color, visited));
    connected.push(...findConnected(row + 1, col, color, visited));
    connected.push(...findConnected(row, col - 1, color, visited));
    connected.push(...findConnected(row, col + 1, color, visited));

    return connected;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isPaused || gameOver || !grid[row][col]) return;

    const color = grid[row][col]!.color;
    const connected = findConnected(row, col, color, new Set());

    if (connected.length < 2) return;

    // Remove connected cells
    const newGrid = grid.map(r => [...r]);
    connected.forEach(([r, c]) => {
      newGrid[r][c] = null;
    });

    // Apply gravity
    for (let c = 0; c < GRID_SIZE; c++) {
      const column = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (newGrid[r][c]) {
          column.push(newGrid[r][c]);
        }
      }
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        newGrid[r][c] = column[GRID_SIZE - 1 - r] || {
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          id: Date.now() + r * GRID_SIZE + c,
        };
      }
    }

    setGrid(newGrid);

    // Calculate score
    const points = connected.length * 10 * (combo + 1);
    setScore(prev => prev + points);
    setCombo(prev => prev + 1);

    // Check achievements
    if (connected.length >= 5) {
      unlockAchievement('block_combo_5');
    }
    if (score + points >= 1000) {
      unlockAchievement('block_score_1000');
    }

    // Reset combo after delay
    setTimeout(() => setCombo(0), 1000);
  };

  const handleRestart = () => {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('block-blast', score, timePlayed);
    addCoins(Math.floor(score / 10));
    
    setGrid(initGrid());
    setScore(0);
    setCombo(0);
    setGameOver(false);
  };

  const handleQuit = () => {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    updateGameStats('block-blast', score, timePlayed);
    addCoins(Math.floor(score / 10));
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">Block Blast</h1>
            <p className="text-muted-foreground text-sm">Match 2+ blocks to clear them!</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(true)}>
            <Pause className="w-5 h-5" />
          </Button>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-card border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Score</p>
            <p className="font-display text-3xl font-bold text-primary">{score}</p>
          </div>
          {combo > 0 && (
            <div className="px-4 py-2 rounded-full bg-accent/20 border border-accent/30 animate-pulse-glow">
              <span className="text-accent font-bold">x{combo + 1} COMBO!</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleRestart}>
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Game Grid */}
        <div className="grid gap-1 p-4 rounded-xl bg-card border border-border" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={cell?.id || `${rowIndex}-${colIndex}`}
                className="aspect-square rounded-lg transition-all duration-200 hover:scale-110 hover:z-10"
                style={{
                  backgroundColor: cell?.color || 'transparent',
                  boxShadow: cell ? `0 0 10px ${cell.color}` : 'none',
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              />
            ))
          )}
        </div>

        {/* Tutorial */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <h3 className="font-display font-bold mb-2">How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tap on groups of 2+ same-colored blocks</li>
            <li>• Larger groups = more points</li>
            <li>• Chain combos for bonus multipliers</li>
          </ul>
        </div>
      </div>

      {/* Pause Menu */}
      <GamePauseMenu
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onQuit={handleQuit}
        score={score}
      />
    </div>
  );
};

export default BlockBlast;
