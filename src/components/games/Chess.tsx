import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface ChessProps {
  onScoreUpdate?: (score: number) => void;
}

const Chess: React.FC<ChessProps> = ({ onScoreUpdate }) => {
  const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
  ];
  
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [moves, setMoves] = useState(0);
  
  const whitePieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
  const blackPieces = ['♚', '♛', '♜', '♝', '♞', '♟'];
  
  const handleClick = (row: number, col: number) => {
    const piece = board[row][col];
    
    if (selected) {
      const [selRow, selCol] = selected;
      const selPiece = board[selRow][selCol];
      
      // Simple move validation
      if (row !== selRow || col !== selCol) {
        const capturedPiece = board[row][col];
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = selPiece;
        newBoard[selRow][selCol] = '';
        setBoard(newBoard);
        setTurn(turn === 'white' ? 'black' : 'white');
        setMoves(m => m + 1);
        if (capturedPiece) {
          onScoreUpdate?.(moves * 5 + 20);
        }
        if (capturedPiece === '♔' || capturedPiece === '♚') {
          onScoreUpdate?.(100);
        }
      }
      setSelected(null);
    } else if (piece) {
      const isWhite = whitePieces.includes(piece);
      const isBlack = blackPieces.includes(piece);
      
      if ((turn === 'white' && isWhite) || (turn === 'black' && isBlack)) {
        setSelected([row, col]);
      }
    }
  };
  
  const resetGame = () => {
    setBoard(initialBoard);
    setSelected(null);
    setTurn('white');
    setMoves(0);
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-lg font-bold capitalize">{turn}'s Turn</div>
        <div>Moves: {moves}</div>
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
              className={`w-12 h-12 flex items-center justify-center text-3xl cursor-pointer transition-all
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                ${selected && selected[0] === rowIndex && selected[1] === colIndex ? 'ring-2 ring-primary' : ''}
                hover:opacity-80`}
            >
              {piece}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Chess;
