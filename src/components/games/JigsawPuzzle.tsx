import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Shuffle } from 'lucide-react';

const JigsawPuzzle: React.FC = () => {
  const gridSize = 4;
  const [pieces, setPieces] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  
  const colors = [
    'from-red-500 to-orange-500',
    'from-orange-500 to-yellow-500',
    'from-yellow-500 to-green-500',
    'from-green-500 to-teal-500',
    'from-teal-500 to-blue-500',
    'from-blue-500 to-indigo-500',
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-red-500',
    'from-red-400 to-pink-400',
    'from-green-400 to-blue-400',
    'from-blue-400 to-purple-400',
    'from-yellow-400 to-orange-400',
    'from-cyan-400 to-blue-400',
    'from-violet-400 to-fuchsia-400',
    'from-rose-400 to-amber-400',
  ];
  
  const shufflePieces = () => {
    const arr = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setPieces(arr);
    setMoves(0);
    setCompleted(false);
  };
  
  useEffect(() => {
    shufflePieces();
  }, []);
  
  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p, i) => p === i)) {
      setCompleted(true);
    }
  }, [pieces]);
  
  const handleDragStart = (index: number) => {
    setDraggedPiece(index);
  };
  
  const handleDrop = (targetIndex: number) => {
    if (draggedPiece === null || draggedPiece === targetIndex) return;
    
    const newPieces = [...pieces];
    [newPieces[draggedPiece], newPieces[targetIndex]] = [newPieces[targetIndex], newPieces[draggedPiece]];
    setPieces(newPieces);
    setMoves(m => m + 1);
    setDraggedPiece(null);
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-lg font-bold">Moves: {moves}</div>
        <Button onClick={shufflePieces} variant="outline" size="sm">
          <Shuffle className="w-4 h-4 mr-2" /> Shuffle
        </Button>
      </div>
      
      <div className="grid grid-cols-4 gap-2 p-4 bg-card rounded-xl border border-border">
        {pieces.map((piece, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={`w-16 h-16 rounded-lg cursor-move bg-gradient-to-br ${colors[piece]} flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-all hover:scale-105 ${
              piece === index ? 'ring-2 ring-success' : ''
            }`}
          >
            {piece + 1}
          </div>
        ))}
      </div>
      
      {completed && (
        <div className="text-2xl font-bold text-success animate-pulse">
          🎉 Puzzle Complete! {moves} moves
        </div>
      )}
    </div>
  );
};

export default JigsawPuzzle;
