import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play } from 'lucide-react';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: 'good' | 'bad';
  emoji: string;
}

const CatchGame: React.FC = () => {
  const [basketX, setBasketX] = useState(50);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const itemIdRef = useRef(0);
  
  const goodItems = ['🍎', '🍊', '🍋', '🍇', '🍓', '⭐', '💎'];
  const badItems = ['💣', '☠️', '🔥'];
  
  const startGame = () => {
    setScore(0);
    setLives(3);
    setItems([]);
    setGameActive(true);
    setGameOver(false);
    setBasketX(50);
  };
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameAreaRef.current || !gameActive) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(5, Math.min(95, x)));
  }, [gameActive]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gameAreaRef.current || !gameActive) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(5, Math.min(95, x)));
  }, [gameActive]);
  
  // Spawn items
  useEffect(() => {
    if (!gameActive) return;
    
    const spawnInterval = setInterval(() => {
      const isGood = Math.random() > 0.2;
      const newItem: FallingItem = {
        id: itemIdRef.current++,
        x: Math.random() * 90 + 5,
        y: 0,
        type: isGood ? 'good' : 'bad',
        emoji: isGood 
          ? goodItems[Math.floor(Math.random() * goodItems.length)]
          : badItems[Math.floor(Math.random() * badItems.length)]
      };
      setItems(prev => [...prev, newItem]);
    }, 800);
    
    return () => clearInterval(spawnInterval);
  }, [gameActive]);
  
  // Move items
  useEffect(() => {
    if (!gameActive) return;
    
    const moveInterval = setInterval(() => {
      setItems(prev => {
        const updated = prev.map(item => ({ ...item, y: item.y + 3 }));
        
        // Check catches
        updated.forEach(item => {
          if (item.y >= 85 && item.y <= 95) {
            const distance = Math.abs(item.x - basketX);
            if (distance < 10) {
              if (item.type === 'good') {
                setScore(s => s + 10);
              } else {
                setLives(l => {
                  const newLives = l - 1;
                  if (newLives <= 0) {
                    setGameActive(false);
                    setGameOver(true);
                  }
                  return newLives;
                });
              }
              item.y = 200; // Remove
            }
          }
        });
        
        // Check misses
        updated.forEach(item => {
          if (item.y > 100 && item.type === 'good') {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameActive(false);
                setGameOver(true);
              }
              return newLives;
            });
          }
        });
        
        return updated.filter(item => item.y <= 100);
      });
    }, 50);
    
    return () => clearInterval(moveInterval);
  }, [gameActive, basketX]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="flex gap-1">
          {Array(3).fill(0).map((_, i) => (
            <span key={i} className={`text-2xl ${i < lives ? '' : 'opacity-30'}`}>❤️</span>
          ))}
        </div>
        <Button onClick={startGame} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      
      <div
        ref={gameAreaRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-80 h-96 bg-gradient-to-b from-sky-400 to-sky-600 rounded-xl border-2 border-border overflow-hidden cursor-none"
      >
        {!gameActive && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <Button onClick={startGame} variant="gaming" size="lg">
              <Play className="w-5 h-5 mr-2" /> Start Game
            </Button>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <div className="text-2xl font-bold mb-2">Game Over!</div>
            <div className="text-xl mb-4">Score: {score}</div>
            <Button onClick={startGame} variant="gaming">
              Play Again
            </Button>
          </div>
        )}
        
        {/* Falling items */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-3xl transition-all"
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {item.emoji}
          </div>
        ))}
        
        {/* Basket */}
        <div
          className="absolute bottom-4 text-4xl transition-all"
          style={{ left: `${basketX}%`, transform: 'translateX(-50%)' }}
        >
          🧺
        </div>
      </div>
    </div>
  );
};

export default CatchGame;
