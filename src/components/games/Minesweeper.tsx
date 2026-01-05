import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Flag, Bomb } from 'lucide-react';

interface MinesweeperProps {
  onScoreUpdate?: (score: number) => void;
}

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const Minesweeper: React.FC<MinesweeperProps> = ({ onScoreUpdate }) => {
  const [board, setBoard] = useState<Cell[][]>(() => initBoard());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [firstClick, setFirstClick] = useState(true);

  function initBoard(): Cell[][] {
    return Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
  }

  const placeMines = useCallback((board: Cell[][], excludeRow: number, excludeCol: number) => {
    let placed = 0;
    while (placed < MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      if (!board[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
        board[row][col].isMine = true;
        placed++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
                count++;
              }
            }
          }
          board[r][c].neighborMines = count;
        }
      }
    }
    return board;
  }, []);

  const reveal = useCallback((board: Cell[][], row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(board, row + dr, col + dc);
        }
      }
    }
  }, []);

  const checkWin = (board: Cell[][]): boolean => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].isMine && !board[r][c].isRevealed) return false;
      }
    }
    return true;
  };

  const handleClick = (row: number, col: number) => {
    if (gameOver) return;

    let newBoard = board.map(r => r.map(c => ({ ...c })));

    if (firstClick) {
      newBoard = placeMines(newBoard, row, col);
      setFirstClick(false);
    }

    const cell = newBoard[row][col];

    if (flagMode) {
      if (!cell.isRevealed) {
        cell.isFlagged = !cell.isFlagged;
      }
    } else {
      if (cell.isFlagged) return;
      
      if (cell.isMine) {
        // Reveal all mines
        newBoard.forEach(r => r.forEach(c => {
          if (c.isMine) c.isRevealed = true;
        }));
        setGameOver(true);
        toast.error('💥 BOOM! Game Over!');
      } else {
        reveal(newBoard, row, col);
        
        if (checkWin(newBoard)) {
          setWon(true);
          setGameOver(true);
          const score = ROWS * COLS * 10;
          onScoreUpdate?.(score);
          toast.success(`🎉 You won! Score: ${score}`);
        }
      }
    }

    setBoard(newBoard);
  };

  const restart = () => {
    setBoard(initBoard());
    setGameOver(false);
    setWon(false);
    setFirstClick(true);
  };

  const getNumberColor = (num: number): string => {
    const colors = ['', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-700', 'text-red-800', 'text-teal-500', 'text-black', 'text-gray-500'];
    return colors[num] || '';
  };

  const flagCount = board.flat().filter(c => c.isFlagged).length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Bomb className="w-5 h-5 text-destructive" />
          <span className="font-bold">{MINES - flagCount}</span>
        </div>
        <Button
          variant={flagMode ? 'gaming' : 'outline'}
          size="sm"
          onClick={() => setFlagMode(!flagMode)}
        >
          <Flag className="w-4 h-4 mr-1" />
          {flagMode ? 'Flag Mode ON' : 'Flag Mode OFF'}
        </Button>
      </div>

      <div className="bg-gray-300 p-2 rounded-lg">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-7 h-7 md:w-8 md:h-8 text-sm font-bold flex items-center justify-center transition-all
                  ${cell.isRevealed 
                    ? (cell.isMine ? 'bg-red-500' : 'bg-gray-200') 
                    : 'bg-gray-400 hover:bg-gray-350 shadow-[inset_-2px_-2px_0_#666,inset_2px_2px_0_#fff]'}
                  ${getNumberColor(cell.neighborMines)}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!cell.isRevealed && !gameOver) {
                    const newBoard = board.map(r => r.map(c => ({ ...c })));
                    newBoard[rowIndex][colIndex].isFlagged = !cell.isFlagged;
                    setBoard(newBoard);
                  }
                }}
                disabled={gameOver && !cell.isMine}
              >
                {cell.isRevealed ? (
                  cell.isMine ? '💣' : (cell.neighborMines || '')
                ) : (
                  cell.isFlagged ? '🚩' : ''
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming">
          Play Again
        </Button>
      )}

      <p className="text-sm text-muted-foreground">Click to reveal, right-click or use flag mode to flag</p>
    </div>
  );
};

export default Minesweeper;
