import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface WordSearchProps {
  onScoreUpdate?: (score: number) => void;
}

const GRID_SIZE = 10;
const WORDS = ['REACT', 'GAME', 'CODE', 'PLAY', 'FUN'];

const WordSearch: React.FC<WordSearchProps> = ({ onScoreUpdate }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [score, setScore] = useState(0);

  const generateGrid = useCallback(() => {
    // Initialize empty grid
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill('')
    );

    // Place words
    const wordPositions: Map<string, [number, number][]> = new Map();

    for (const word of WORDS) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const direction = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        let canPlace = true;
        const positions: [number, number][] = [];

        for (let i = 0; i < word.length; i++) {
          let r = row, c = col;
          if (direction === 0) c += i;
          else if (direction === 1) r += i;
          else { r += i; c += i; }

          if (r >= GRID_SIZE || c >= GRID_SIZE) {
            canPlace = false;
            break;
          }
          if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) {
            canPlace = false;
            break;
          }
          positions.push([r, c]);
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            newGrid[positions[i][0]][positions[i][1]] = word[i];
          }
          wordPositions.set(word, positions);
          placed = true;
        }
      }
    }

    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    return newGrid;
  }, []);

  useEffect(() => {
    setGrid(generateGrid());
  }, [generateGrid]);

  const handleCellClick = (row: number, col: number) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedCells([[row, col]]);
    } else {
      // Check if adjacent to last selected
      const last = selectedCells[selectedCells.length - 1];
      const dr = Math.abs(row - last[0]);
      const dc = Math.abs(col - last[1]);
      
      if ((dr <= 1 && dc <= 1) && !(dr === 0 && dc === 0)) {
        setSelectedCells([...selectedCells, [row, col]]);
      }
    }
  };

  const checkWord = () => {
    const word = selectedCells.map(([r, c]) => grid[r][c]).join('');
    
    if (WORDS.includes(word) && !foundWords.has(word)) {
      setFoundWords(new Set([...foundWords, word]));
      const points = word.length * 20;
      setScore(s => s + points);
      onScoreUpdate?.(score + points);
      toast.success(`Found "${word}"! +${points} points`);

      if (foundWords.size + 1 === WORDS.length) {
        toast.success('🎉 You found all words!');
      }
    }

    setSelectedCells([]);
    setIsSelecting(false);
  };

  const isSelected = (row: number, col: number) => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  };

  const restart = () => {
    setGrid(generateGrid());
    setFoundWords(new Set());
    setSelectedCells([]);
    setIsSelecting(false);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-secondary">{foundWords.size}/{WORDS.length}</div>
          <div className="text-sm text-muted-foreground">Found</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center max-w-xs">
        {WORDS.map(word => (
          <span 
            key={word}
            className={`px-2 py-1 rounded text-sm font-mono ${foundWords.has(word) ? 'bg-green-500 text-white line-through' : 'bg-muted'}`}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="p-2 bg-card rounded-lg border-2 border-primary">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-8 h-8 md:w-9 md:h-9 rounded font-bold text-lg transition-all
                  ${isSelected(rowIndex, colIndex) ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted hover:bg-muted/80'}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={checkWord} variant="gaming" disabled={selectedCells.length === 0}>
          Check Word
        </Button>
        <Button onClick={() => { setSelectedCells([]); setIsSelecting(false); }} variant="outline">
          Clear
        </Button>
        <Button onClick={restart} variant="outline">
          New Game
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Click letters to select, then check the word</p>
    </div>
  );
};

export default WordSearch;
