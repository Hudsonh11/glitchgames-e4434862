import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

type Piece = 'red' | 'black' | 'red-king' | 'black-king' | null;

const Checkers: React.FC = () => {
  const createInitialBoard = (): Piece[][] => {
    const board: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) board[row][col] = 'black';
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) board[row][col] = 'red';
      }
    }
    return board;
  };
  
  const [board, setBoard] = useState<Piece[][]>(createInitialBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<'red' | 'black'>('red');
  const [score, setScore] = useState({ red: 0, black: 0 });
  
  const handleClick = (row: number, col: number) => {
    const piece = board[row][col];
    
    if (selected) {
      const [selRow, selCol] = selected;
      const selPiece = board[selRow][selCol];
      
      if (selPiece && (row + col) % 2 === 1 && !piece) {
        const rowDiff = row - selRow;
        const colDiff = Math.abs(col - selCol);
        
        // Simple move
        if (colDiff === 1 && ((selPiece.includes('red') && rowDiff === -1) || (selPiece.includes('black') && rowDiff === 1) || selPiece.includes('king'))) {
          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = selPiece;
          newBoard[selRow][selCol] = null;
          
          // King promotion
          if ((row === 0 && selPiece === 'red') || (row === 7 && selPiece === 'black')) {
            newBoard[row][col] = `${selPiece}-king` as Piece;
          }
          
          setBoard(newBoard);
          setTurn(turn === 'red' ? 'black' : 'red');
        }
      }
      setSelected(null);
    } else if (piece && piece.includes(turn)) {
      setSelected([row, col]);
    }
  };
  
  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setTurn('red');
    setScore({ red: 0, black: 0 });
  };
  
  const renderPiece = (piece: Piece) => {
    if (!piece) return null;
    const isKing = piece.includes('king');
    const color = piece.includes('red') ? 'bg-red-500' : 'bg-gray-800';
    return (
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shadow-lg`}>
        {isKing && <span className="text-yellow-400 text-lg">👑</span>}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className={`text-lg font-bold ${turn === 'red' ? 'text-red-500' : 'text-foreground'}`}>
          {turn === 'red' ? 'Red' : 'Black'}'s Turn
        </div>
        <Button onClick={resetGame} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>
      
      <div className="grid grid-cols-8 gap-0 border-2 border-border rounded-lg overflow-hidden">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleClick(rowIndex, colIndex)}
              className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-green-800'}
                ${selected && selected[0] === rowIndex && selected[1] === colIndex ? 'ring-2 ring-primary' : ''}
                hover:opacity-80`}
            >
              {renderPiece(piece)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Checkers;
