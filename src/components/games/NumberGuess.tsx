import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, ArrowUp, ArrowDown, Check } from 'lucide-react';

interface NumberGuessProps {
  onScoreUpdate?: (score: number) => void;
}

const NumberGuess: React.FC<NumberGuessProps> = ({ onScoreUpdate }) => {
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<{ num: number; result: 'high' | 'low' | 'correct' }[]>([]);
  const [maxNumber, setMaxNumber] = useState(100);
  const [won, setWon] = useState(false);
  
  const startGame = () => {
    setTarget(Math.floor(Math.random() * maxNumber) + 1);
    setGuess('');
    setAttempts([]);
    setWon(false);
  };
  
  useEffect(() => {
    startGame();
  }, [maxNumber]);
  
  const handleGuess = () => {
    const num = parseInt(guess);
    if (isNaN(num) || num < 1 || num > maxNumber) return;
    
    let result: 'high' | 'low' | 'correct';
    if (num === target) {
      result = 'correct';
      setWon(true);
      onScoreUpdate?.(Math.max(50, maxNumber - attempts.length * 5));
    } else if (num > target) {
      result = 'high';
    } else {
      result = 'low';
    }
    
    setAttempts([...attempts, { num, result }]);
    setGuess('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGuess();
  };
  
  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Number Guess</h2>
        <p className="text-muted-foreground">Guess the number between 1 and {maxNumber}!</p>
      </div>
      
      <div className="flex gap-2">
        {[50, 100, 500, 1000].map(n => (
          <Button
            key={n}
            variant={maxNumber === n ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMaxNumber(n)}
          >
            1-{n}
          </Button>
        ))}
      </div>
      
      {!won && (
        <div className="flex gap-2 w-full">
          <Input
            type="number"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Enter 1-${maxNumber}`}
            min={1}
            max={maxNumber}
            className="text-center text-xl"
          />
          <Button onClick={handleGuess} variant="gaming">
            Guess
          </Button>
        </div>
      )}
      
      <div className="w-full space-y-2">
        {attempts.map((attempt, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 rounded-lg ${
              attempt.result === 'correct' ? 'bg-success/20 border-success' :
              attempt.result === 'high' ? 'bg-destructive/20 border-destructive/50' :
              'bg-primary/20 border-primary/50'
            } border`}
          >
            <span className="text-xl font-bold">{attempt.num}</span>
            <div className="flex items-center gap-2">
              {attempt.result === 'correct' && <Check className="w-5 h-5 text-success" />}
              {attempt.result === 'high' && <ArrowDown className="w-5 h-5 text-destructive" />}
              {attempt.result === 'low' && <ArrowUp className="w-5 h-5 text-primary" />}
              <span className="capitalize font-medium">
                {attempt.result === 'correct' ? 'Correct!' : 
                 attempt.result === 'high' ? 'Too High' : 'Too Low'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {won && (
        <div className="text-center">
          <div className="text-2xl font-bold text-success mb-2">🎉 You Got It!</div>
          <p className="text-muted-foreground mb-4">
            Found {target} in {attempts.length} {attempts.length === 1 ? 'try' : 'tries'}!
          </p>
          <Button onClick={startGame} variant="gaming">
            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </div>
      )}
      
      {!won && attempts.length > 0 && (
        <p className="text-muted-foreground">Attempts: {attempts.length}</p>
      )}
    </div>
  );
};

export default NumberGuess;
