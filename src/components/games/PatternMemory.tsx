import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';

interface PatternMemoryProps {
  onScoreUpdate?: (score: number) => void;
}

const PatternMemory: React.FC<PatternMemoryProps> = ({ onScoreUpdate }) => {
  const gridSize = 4;
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [showingPattern, setShowingPattern] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'success' | 'fail'>('idle');
  
  const generatePattern = (length: number) => {
    const newPattern: number[] = [];
    for (let i = 0; i < length; i++) {
      newPattern.push(Math.floor(Math.random() * (gridSize * gridSize)));
    }
    return newPattern;
  };
  
  const startLevel = useCallback(() => {
    const patternLength = level + 2;
    const newPattern = generatePattern(patternLength);
    setPattern(newPattern);
    setUserPattern([]);
    setGameState('showing');
    setShowingPattern(true);
    
    // Show pattern sequence
    let index = 0;
    const showInterval = setInterval(() => {
      setActiveCell(newPattern[index]);
      
      setTimeout(() => setActiveCell(null), 400);
      
      index++;
      if (index >= newPattern.length) {
        clearInterval(showInterval);
        setTimeout(() => {
          setShowingPattern(false);
          setGameState('input');
        }, 500);
      }
    }, 600);
  }, [level]);
  
  const handleCellClick = (index: number) => {
    if (gameState !== 'input') return;
    
    setActiveCell(index);
    setTimeout(() => setActiveCell(null), 200);
    
    const newUserPattern = [...userPattern, index];
    setUserPattern(newUserPattern);
    
    // Check if correct so far
    const currentIndex = newUserPattern.length - 1;
    if (newUserPattern[currentIndex] !== pattern[currentIndex]) {
      setGameState('fail');
      onScoreUpdate?.(score);
      return;
    }
    
    // Check if complete
    if (newUserPattern.length === pattern.length) {
      setScore(s => {
        const newScore = s + level * 10;
        onScoreUpdate?.(newScore);
        return newScore;
      });
      setGameState('success');
      setTimeout(() => {
        setLevel(l => l + 1);
        startLevel();
      }, 1000);
    }
  };
  
  const startGame = () => {
    setLevel(1);
    setScore(0);
    startLevel();
  };
  
  const reset = () => {
    setGameState('idle');
    setLevel(1);
    setScore(0);
    setPattern([]);
    setUserPattern([]);
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="text-lg font-bold">Level: {level}</div>
        <div className="text-lg font-bold">Score: {score}</div>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="text-center mb-2">
        {gameState === 'idle' && 'Press Start to begin'}
        {gameState === 'showing' && 'Watch the pattern...'}
        {gameState === 'input' && 'Repeat the pattern!'}
        {gameState === 'success' && '✅ Correct!'}
        {gameState === 'fail' && '❌ Wrong! Game Over'}
      </div>
      
      <div className="grid grid-cols-4 gap-2 p-4 bg-card rounded-xl border border-border">
        {Array(gridSize * gridSize).fill(0).map((_, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={gameState !== 'input'}
            className={`w-16 h-16 rounded-lg transition-all duration-200 ${
              activeCell === i
                ? 'bg-primary scale-110 shadow-lg shadow-primary/50'
                : 'bg-muted hover:bg-muted/80'
            } ${gameState !== 'input' ? 'cursor-default' : 'cursor-pointer'}`}
          />
        ))}
      </div>
      
      {gameState === 'idle' && (
        <Button onClick={startGame} variant="gaming" size="lg">
          <Play className="w-5 h-5 mr-2" /> Start
        </Button>
      )}
      
      {gameState === 'fail' && (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Final Score: {score}</p>
          <Button onClick={startGame} variant="gaming">
            Try Again
          </Button>
        </div>
      )}
      
      <div className="flex gap-1">
        {pattern.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < userPattern.length ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PatternMemory;
