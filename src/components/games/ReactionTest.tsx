import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Zap } from 'lucide-react';

type GameState = 'waiting' | 'ready' | 'go' | 'result' | 'tooSoon';

const ReactionTest: React.FC = () => {
  const [state, setState] = useState<GameState>('waiting');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const startTest = () => {
    setState('ready');
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setState('go');
    }, delay);
  };
  
  const handleClick = useCallback(() => {
    if (state === 'waiting') {
      startTest();
    } else if (state === 'ready') {
      clearTimeout(timeoutRef.current);
      setState('tooSoon');
    } else if (state === 'go') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setAttempts(prev => [...prev.slice(-4), time]);
      setState('result');
    } else if (state === 'result' || state === 'tooSoon') {
      startTest();
    }
  }, [state]);
  
  const getAverageTime = () => {
    if (attempts.length === 0) return null;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  };
  
  const getTimeRating = (time: number) => {
    if (time < 200) return { text: 'Incredible!', color: 'text-success' };
    if (time < 250) return { text: 'Excellent!', color: 'text-primary' };
    if (time < 300) return { text: 'Good!', color: 'text-warning' };
    if (time < 400) return { text: 'Average', color: 'text-muted-foreground' };
    return { text: 'Keep trying!', color: 'text-destructive' };
  };
  
  const reset = () => {
    setState('waiting');
    setReactionTime(null);
    setAttempts([]);
    clearTimeout(timeoutRef.current);
  };
  
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Reaction Time Test</h2>
        <p className="text-muted-foreground">Click when the screen turns green!</p>
      </div>
      
      <div
        onClick={handleClick}
        className={`w-80 h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
          state === 'waiting' ? 'bg-primary/20 border-2 border-primary/50' :
          state === 'ready' ? 'bg-destructive/50 border-2 border-destructive' :
          state === 'go' ? 'bg-success border-2 border-success' :
          state === 'tooSoon' ? 'bg-destructive border-2 border-destructive' :
          'bg-card border-2 border-border'
        }`}
      >
        {state === 'waiting' && (
          <>
            <Zap className="w-16 h-16 text-primary mb-4" />
            <p className="text-xl font-bold">Click to Start</p>
          </>
        )}
        {state === 'ready' && (
          <>
            <p className="text-4xl font-bold text-white">Wait...</p>
          </>
        )}
        {state === 'go' && (
          <>
            <p className="text-4xl font-bold text-white">CLICK!</p>
          </>
        )}
        {state === 'tooSoon' && (
          <>
            <p className="text-2xl font-bold text-white mb-2">Too Soon!</p>
            <p className="text-white/80">Click to try again</p>
          </>
        )}
        {state === 'result' && reactionTime && (
          <>
            <p className="text-5xl font-bold mb-2">{reactionTime}ms</p>
            <p className={`text-xl font-bold ${getTimeRating(reactionTime).color}`}>
              {getTimeRating(reactionTime).text}
            </p>
            <p className="text-muted-foreground mt-4">Click to try again</p>
          </>
        )}
      </div>
      
      {attempts.length > 0 && (
        <div className="bg-card p-4 rounded-xl border border-border text-center">
          <div className="flex gap-4 mb-2">
            {attempts.map((time, i) => (
              <span key={i} className="text-lg font-mono">{time}ms</span>
            ))}
          </div>
          <p className="text-muted-foreground">
            Average: <span className="text-primary font-bold">{getAverageTime()}ms</span>
          </p>
        </div>
      )}
      
      <Button onClick={reset} variant="outline" size="sm">
        <RotateCcw className="w-4 h-4 mr-2" /> Reset
      </Button>
    </div>
  );
};

export default ReactionTest;
