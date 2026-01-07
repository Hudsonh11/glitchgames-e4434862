import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import GamePauseMenu from '@/components/GamePauseMenu';

const GRID_SIZE = 10;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C00'];

type Block = {
  shape: boolean[][];
  color: string;
};

const BLOCKS: Block[] = [
  { shape: [[true]], color: COLORS[0] },
  { shape: [[true, true]], color: COLORS[1] },
  { shape: [[true], [true]], color: COLORS[2] },
  { shape: [[true, true], [true, true]], color: COLORS[3] },
  { shape: [[true, true, true]], color: COLORS[4] },
  { shape: [[true], [true], [true]], color: COLORS[5] },
  { shape: [[true, true], [true, false]], color: COLORS[6] },
  { shape: [[true, true], [false, true]], color: COLORS[0] },
  { shape: [[true, false], [true, true]], color: COLORS[1] },
  { shape: [[false, true], [true, true]], color: COLORS[2] },
  { shape: [[true, true, true], [true, false, false]], color: COLORS[3] },
  { shape: [[true, true, true], [false, false, true]], color: COLORS[4] },
];

const BlockBlastExtreme: React.FC = () => {
  const { updateGameStats, addCoins, unlockAchievement, soundSettings } = useGame();
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const [level, setLevel] = useState(1);

  const generateBlocks = useCallback(() => {
    const blocks: Block[] = [];
    for (let i = 0; i < 3; i++) {
      blocks.push(BLOCKS[Math.floor(Math.random() * BLOCKS.length)]);
    }
    return blocks;
  }, []);

  useEffect(() => {
    setAvailableBlocks(generateBlocks());
  }, [generateBlocks]);

  const canPlaceBlock = (block: Block, startRow: number, startCol: number): boolean => {
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c]) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          if (
            gridRow < 0 || gridRow >= GRID_SIZE ||
            gridCol < 0 || gridCol >= GRID_SIZE ||
            grid[gridRow][gridCol] !== null
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placeBlock = (blockIndex: number, startRow: number, startCol: number) => {
    const block = availableBlocks[blockIndex];
    if (!canPlaceBlock(block, startRow, startCol)) return;

    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c]) {
          newGrid[startRow + r][startCol + c] = block.color;
        }
      }
    }

    // Check for completed rows and columns
    let clearedLines = 0;
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every(cell => cell !== null)) {
        rowsToClear.push(r);
        clearedLines++;
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid.every(row => row[c] !== null)) {
        colsToClear.push(c);
        clearedLines++;
      }
    }

    // Clear lines
    for (const r of rowsToClear) {
      for (let c = 0; c < GRID_SIZE; c++) {
        newGrid[r][c] = null;
      }
    }
    for (const c of colsToClear) {
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r][c] = null;
      }
    }

    setGrid(newGrid);

    // Update score with combo
    const newCombo = clearedLines > 0 ? combo + 1 : 0;
    const linePoints = clearedLines * 100 * (1 + newCombo * 0.5);
    const blockPoints = block.shape.flat().filter(Boolean).length * 10;
    setScore(prev => prev + linePoints + blockPoints);
    setCombo(newCombo);

    // Level up
    if (score + linePoints + blockPoints > level * 1000) {
      setLevel(prev => prev + 1);
    }

    // Update available blocks
    const newBlocks = [...availableBlocks];
    newBlocks.splice(blockIndex, 1);
    
    if (newBlocks.length === 0) {
      setAvailableBlocks(generateBlocks());
    } else {
      setAvailableBlocks(newBlocks);
    }

    setSelectedBlock(null);

    // Check achievements
    if (newCombo >= 5) {
      unlockAchievement('block_combo_5');
    }
    if (score + linePoints + blockPoints >= 1000) {
      unlockAchievement('block_score_1000');
    }
  };

  const checkGameOver = useCallback(() => {
    for (const block of availableBlocks) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlaceBlock(block, r, c)) {
            return false;
          }
        }
      }
    }
    return true;
  }, [availableBlocks, grid]);

  useEffect(() => {
    if (availableBlocks.length > 0 && checkGameOver()) {
      setGameOver(true);
      const timePlayed = Math.floor((Date.now() - startTime) / 1000);
      updateGameStats('block-blast-extreme', score, timePlayed);
      addCoins(Math.floor(score / 10));
    }
  }, [availableBlocks, checkGameOver]);

  const handleCellClick = (row: number, col: number) => {
    if (selectedBlock !== null && !gameOver && !isPaused) {
      placeBlock(selectedBlock, row, col);
    }
  };

  const resetGame = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setCombo(0);
    setLevel(1);
    setGameOver(false);
    setAvailableBlocks(generateBlocks());
    setSelectedBlock(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <GamePauseMenu
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        onRestart={resetGame}
        gameId="block-blast-extreme"
      />

      <div className="flex items-center gap-8 mb-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Score</p>
          <p className="text-3xl font-display font-bold text-primary">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Level</p>
          <p className="text-2xl font-display font-bold text-warning">{level}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Combo</p>
          <p className="text-2xl font-display font-bold text-success">x{combo}</p>
        </div>
        <Button variant="outline" onClick={() => setIsPaused(true)}>
          Pause
        </Button>
      </div>

      <div 
        className="grid gap-0.5 p-2 bg-card rounded-xl border-2 border-primary/30"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              className="w-7 h-7 rounded-sm cursor-pointer transition-all hover:scale-105 border border-border/30"
              style={{
                backgroundColor: cell || 'hsl(var(--muted))',
                boxShadow: cell ? `0 2px 8px ${cell}40` : 'none'
              }}
            />
          ))
        )}
      </div>

      <div className="flex gap-4 mt-4">
        {availableBlocks.map((block, index) => (
          <div
            key={index}
            onClick={() => setSelectedBlock(index)}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              selectedBlock === index 
                ? 'ring-2 ring-primary scale-110 bg-primary/20' 
                : 'bg-card border border-border hover:border-primary/50'
            }`}
          >
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)` }}>
              {block.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="w-5 h-5 rounded-sm"
                    style={{
                      backgroundColor: cell ? block.color : 'transparent'
                    }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-2xl border border-border text-center animate-in zoom-in">
            <h2 className="text-3xl font-display font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-2">Final Score: <span className="text-primary font-bold">{score}</span></p>
            <p className="text-muted-foreground mb-6">Level Reached: {level}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="gaming" onClick={resetGame}>Play Again</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockBlastExtreme;
