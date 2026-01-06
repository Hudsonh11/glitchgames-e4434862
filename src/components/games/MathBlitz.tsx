import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, RotateCcw, Zap } from 'lucide-react';

const MathBlitz: React.FC = () => {
  const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const generateQuestion = () => {
    let a: number, b: number, op: string, answer: number;
    
    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50;
    const ops = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
    
    op = ops[Math.floor(Math.random() * ops.length)];
    
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * maxNum) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * maxNum) + 1;
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        break;
      case '÷':
        b = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        a = b * answer;
        break;
      default:
        a = 1; b = 1; answer = 2;
    }
    
    setQuestion({ a, b, op, answer });
    setUserAnswer('');
  };
  
  const startGame = () => {
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setGameActive(true);
    generateQuestion();
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  
  useEffect(() => {
    if (!gameActive) return;
    
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
  }, [gameActive]);
  
  const checkAnswer = () => {
    const num = parseInt(userAnswer);
    if (isNaN(num)) return;
    
    if (num === question.answer) {
      const points = 10 + streak * 2;
      setScore(s => s + points);
      setStreak(s => s + 1);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('wrong');
    }
    
    setTimeout(() => {
      setFeedback(null);
      generateQuestion();
      inputRef.current?.focus();
    }, 300);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') checkAnswer();
  };
  
  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Math Blitz</h2>
        <p className="text-muted-foreground">Solve as many as you can!</p>
      </div>
      
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as const).map(d => (
          <Button
            key={d}
            variant={difficulty === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficulty(d)}
            disabled={gameActive}
            className="capitalize"
          >
            {d}
          </Button>
        ))}
      </div>
      
      {!gameActive ? (
        <div className="text-center">
          {timeLeft === 0 && (
            <div className="mb-4">
              <p className="text-2xl font-bold">Time's Up!</p>
              <p className="text-xl text-primary">Score: {score}</p>
            </div>
          )}
          <Button onClick={startGame} variant="gaming" size="lg">
            <Play className="w-5 h-5 mr-2" /> {timeLeft === 0 ? 'Play Again' : 'Start'}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between w-full">
            <div className="text-lg">Score: <span className="font-bold text-primary">{score}</span></div>
            <div className="flex items-center gap-1 text-warning">
              <Zap className="w-4 h-4" />
              <span className="font-bold">{streak}</span>
            </div>
            <div className={`text-lg font-bold ${timeLeft < 10 ? 'text-destructive animate-pulse' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          </div>
          
          <div className={`bg-card p-8 rounded-xl border-2 transition-colors ${
            feedback === 'correct' ? 'border-success bg-success/10' :
            feedback === 'wrong' ? 'border-destructive bg-destructive/10' :
            'border-border'
          }`}>
            <p className="text-5xl font-bold text-center font-mono">
              {question.a} {question.op} {question.b} = ?
            </p>
          </div>
          
          <div className="flex gap-2 w-full">
            <Input
              ref={inputRef}
              type="number"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Answer"
              className="text-2xl text-center font-bold"
              autoFocus
            />
            <Button onClick={checkAnswer} variant="gaming" size="lg">
              Submit
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MathBlitz;
