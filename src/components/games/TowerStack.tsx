import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface Block {
  id: number;
  x: number;
  width: number;
  color: string;
}

const colors = [
  'from-red-500 to-red-600',
  'from-orange-500 to-orange-600',
  'from-yellow-500 to-yellow-600',
  'from-green-500 to-green-600',
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
];

const TowerStack: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const startGame = () => {
    const initialBlock: Block = { id: 0, x: 25, width: 50, color: colors[0] };
    setBlocks([initialBlock]);
    setCurrentBlock({
      id: 1,
      x: 0,
      width: 50,
      color: colors[1],
    });
    setDirection(1);
    setScore(0);
    setGameActive(true);
    setGameOver(false);
  };
  
  // Move current block
  useEffect(() => {
    if (!gameActive || !currentBlock) return;
    
    const moveInterval = setInterval(() => {
      setCurrentBlock(block => {
        if (!block) return null;
        let newX = block.x + direction * 3;
        
        if (newX <= 0 || newX >= 100 - block.width) {
          setDirection(d => (d * -1) as 1 | -1);
          newX = Math.max(0, Math.min(100 - block.width, newX));
        }
        
        return { ...block, x: newX };
      });
    }, 30);
    
    return () => clearInterval(moveInterval);
  }, [gameActive, direction, currentBlock]);
  
  const dropBlock = useCallback(() => {
    if (!gameActive || !currentBlock) return;
    
    const lastBlock = blocks[blocks.length - 1];
    
    // Calculate overlap
    const leftEdge = Math.max(currentBlock.x, lastBlock.x);
    const rightEdge = Math.min(currentBlock.x + currentBlock.width, lastBlock.x + lastBlock.width);
    const overlapWidth = rightEdge - leftEdge;
    
    if (overlapWidth <= 0) {
      setGameActive(false);
      setGameOver(true);
      return;
    }
    
    // Add the landed block
    const newBlock: Block = {
      id: currentBlock.id,
      x: leftEdge,
      width: overlapWidth,
      color: currentBlock.color,
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setScore(s => s + 1);
    
    // Create next moving block
    const nextId = currentBlock.id + 1;
    setCurrentBlock({
      id: nextId,
      x: 0,
      width: overlapWidth,
      color: colors[nextId % colors.length],
    });
  }, [gameActive, currentBlock, blocks]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropBlock();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropBlock]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xl font-bold">Score: {score}</div>
      
      <div
        onClick={dropBlock}
        className="relative w-80 h-[400px] bg-gradient-to-b from-sky-900 to-sky-950 rounded-xl border-2 border-border overflow-hidden cursor-pointer"
      >
        {!gameActive && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">Tower Stack</h3>
            <p className="text-muted-foreground mb-4">Click or press Space to drop</p>
            <Button onClick={startGame} variant="gaming">
              <Play className="w-5 h-5 mr-2" /> Start
            </Button>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <div className="text-2xl font-bold mb-2">Game Over!</div>
            <div className="text-xl mb-4">Height: {score}</div>
            <Button onClick={startGame} variant="gaming">Play Again</Button>
          </div>
        )}
        
        {/* Stacked blocks */}
        {blocks.map((block, i) => (
          <div
            key={block.id}
            className={`absolute h-6 bg-gradient-to-r ${block.color} rounded-sm shadow-lg`}
            style={{
              left: `${block.x}%`,
              bottom: `${i * 24}px`,
              width: `${block.width}%`,
            }}
          />
        ))}
        
        {/* Moving block */}
        {currentBlock && (
          <div
            className={`absolute h-6 bg-gradient-to-r ${currentBlock.color} rounded-sm shadow-lg`}
            style={{
              left: `${currentBlock.x}%`,
              bottom: `${blocks.length * 24}px`,
              width: `${currentBlock.width}%`,
            }}
          />
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">Click or press Space to drop blocks</p>
    </div>
  );
};

export default TowerStack;
