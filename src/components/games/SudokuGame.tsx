import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SudokuGameProps {
  onScoreUpdate?: (score: number) => void;
}

type Grid = (number | null)[][];

const SudokuGame: React.FC<SudokuGameProps> = ({ onScoreUpdate }) => {
  const [puzzle, setPuzzle] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [userGrid, setUserGrid] = useState<Grid>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const generatePuzzle = () => {
    // Simple puzzle generation
    const base: Grid = [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9]
    ];
    
    const sol: Grid = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];

    return { puzzle: base, solution: sol };
  };

  useEffect(() => {
    const { puzzle, solution } = generatePuzzle();
    setPuzzle(puzzle);
    setSolution(solution);
    setUserGrid(puzzle.map(row => [...row]));
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (puzzle[row]?.[col] === null) {
      setSelected([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selected) return;
    const [row, col] = selected;
    
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = num === 0 ? null : num;
    setUserGrid(newGrid);

    // Check for errors
    const newErrors = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (newGrid[r][c] !== null && newGrid[r][c] !== solution[r][c]) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    setErrors(newErrors);

    // Check if solved
    const isSolved = newGrid.every((row, r) => 
      row.every((cell, c) => cell === solution[r][c])
    );
    
    if (isSolved) {
      onScoreUpdate?.(500);
      toast.success('🎉 Congratulations! Puzzle solved!');
    }
  };

  const restart = () => {
    const { puzzle, solution } = generatePuzzle();
    setPuzzle(puzzle);
    setSolution(solution);
    setUserGrid(puzzle.map(row => [...row]));
    setSelected(null);
    setErrors(new Set());
  };

  const hint = () => {
    if (!selected) {
      toast.error('Select a cell first!');
      return;
    }
    const [row, col] = selected;
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = solution[row][col];
    setUserGrid(newGrid);
    
    const newErrors = new Set(errors);
    newErrors.delete(`${row}-${col}`);
    setErrors(newErrors);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <Button onClick={restart} variant="outline" size="sm">New Game</Button>
        <Button onClick={hint} variant="outline" size="sm">Hint</Button>
      </div>

      <div className="bg-card p-2 rounded-lg border-2 border-primary">
        <div className="grid grid-cols-9 gap-0">
          {userGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isOriginal = puzzle[rowIndex]?.[colIndex] !== null;
              const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
              const hasError = errors.has(`${rowIndex}-${colIndex}`);
              const borderRight = (colIndex + 1) % 3 === 0 && colIndex < 8;
              const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-8 h-8 md:w-10 md:h-10 text-lg font-bold flex items-center justify-center
                    border border-border transition-all
                    ${borderRight ? 'border-r-2 border-r-primary' : ''}
                    ${borderBottom ? 'border-b-2 border-b-primary' : ''}
                    ${isOriginal ? 'bg-muted text-foreground' : 'bg-card text-primary'}
                    ${isSelected ? 'bg-primary/20 ring-2 ring-primary' : ''}
                    ${hasError ? 'bg-red-500/20 text-red-500' : ''}
                    ${!isOriginal ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
          <Button
            key={num}
            size="sm"
            variant={num === 0 ? 'outline' : 'default'}
            className="w-10 h-10"
            onClick={() => handleNumberInput(num)}
          >
            {num === 0 ? '×' : num}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">Click a cell, then click a number</p>
    </div>
  );
};

export default SudokuGame;
