import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye } from 'lucide-react';

interface Difference {
  x: number;
  y: number;
  found: boolean;
}

const SpotDifference: React.FC = () => {
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  
  const emojis = ['🌟', '🎈', '🎀', '🌸', '🍀', '🎪', '🎨', '🎭', '🎯', '🎲'];
  const [baseEmojis, setBaseEmojis] = useState<{ emoji: string; x: number; y: number }[]>([]);
  
  const generateLevel = () => {
    const emojiCount = 8 + level * 2;
    const diffCount = Math.min(3 + level, 8);
    
    const base: { emoji: string; x: number; y: number }[] = [];
    for (let i = 0; i < emojiCount; i++) {
      base.push({
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      });
    }
    setBaseEmojis(base);
    
    const diffs: Difference[] = [];
    for (let i = 0; i < diffCount; i++) {
      diffs.push({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        found: false,
      });
    }
    setDifferences(diffs);
    setTimeLeft(30 + level * 5);
    setWrongClicks(0);
  };
  
  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGameActive(true);
    generateLevel();
  };
  
  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);
  
  const handleClick = (x: number, y: number, isRight: boolean) => {
    if (!gameActive) return;
    
    // Check if clicked on a difference (only on right panel)
    if (isRight) {
      const foundDiff = differences.find(d => 
        !d.found && 
        Math.abs(d.x - x) < 10 && 
        Math.abs(d.y - y) < 10
      );
      
      if (foundDiff) {
        setDifferences(prev => prev.map(d => 
          d === foundDiff ? { ...d, found: true } : d
        ));
        setScore(s => s + 50);
        
        // Check if all found
        if (differences.filter(d => !d.found).length === 1) {
          setLevel(l => l + 1);
          setTimeout(generateLevel, 500);
        }
      } else {
        setWrongClicks(w => w + 1);
        setScore(s => Math.max(0, s - 10));
      }
    }
  };
  
  const renderPanel = (isRight: boolean) => (
    <div
      className="relative w-48 h-48 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 rounded-lg overflow-hidden cursor-crosshair"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        handleClick(x, y, isRight);
      }}
    >
      {/* Base emojis */}
      {baseEmojis.map((item, i) => (
        <span
          key={i}
          className="absolute text-2xl select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {item.emoji}
        </span>
      ))}
      
      {/* Differences (only on right panel) */}
      {isRight && differences.map((diff, i) => (
        <span
          key={`diff-${i}`}
          className={`absolute text-2xl select-none transition-all ${
            diff.found ? 'opacity-100 ring-2 ring-success rounded-full' : 'opacity-100'
          }`}
          style={{ left: `${diff.x}%`, top: `${diff.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {diff.found ? '✅' : '🔴'}
        </span>
      ))}
      
      {/* Found indicators */}
      {differences.map((diff, i) => diff.found && (
        <div
          key={`found-${i}`}
          className="absolute w-8 h-8 border-2 border-success rounded-full animate-ping"
          style={{ left: `${diff.x}%`, top: `${diff.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="text-lg font-bold">Level: {level}</div>
        <div className="text-lg font-bold">Score: {score}</div>
        <div className={`text-lg font-bold ${timeLeft < 10 ? 'text-destructive animate-pulse' : ''}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>
      
      {!gameActive ? (
        <div className="text-center">
          {timeLeft === 0 && <p className="text-xl font-bold mb-4">Time's Up! Score: {score}</p>}
          <Button onClick={startGame} variant="gaming" size="lg">
            <Eye className="w-5 h-5 mr-2" /> {timeLeft === 0 ? 'Play Again' : 'Start Game'}
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center mb-2">
            <p className="text-sm text-muted-foreground">
              Find {differences.filter(d => !d.found).length} differences!
            </p>
          </div>
          
          <div className="flex gap-4">
            {renderPanel(false)}
            {renderPanel(true)}
          </div>
          
          <div className="flex gap-2">
            {differences.map((diff, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  diff.found ? 'bg-success' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          {wrongClicks > 0 && (
            <p className="text-sm text-destructive">Wrong clicks: {wrongClicks}</p>
          )}
        </>
      )}
    </div>
  );
};

export default SpotDifference;
