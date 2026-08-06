import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw';

interface RockPaperScissorsProps {
  onScoreUpdate?: (score: number) => void;
}

const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ onScoreUpdate }) => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [cpuChoice, setCpuChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState({ player: 0, cpu: 0 });
  const [animating, setAnimating] = useState(false);
  
  const choices: { choice: Choice; emoji: string; beats: Choice }[] = [
    { choice: 'rock', emoji: '🪨', beats: 'scissors' },
    { choice: 'paper', emoji: '📄', beats: 'rock' },
    { choice: 'scissors', emoji: '✂️', beats: 'paper' },
  ];
  
  const play = (choice: Choice) => {
    if (animating) return;
    
    setAnimating(true);
    setPlayerChoice(choice);
    setCpuChoice(null);
    setResult(null);
    
    setTimeout(() => {
      const cpu = choices[Math.floor(Math.random() * 3)].choice;
      setCpuChoice(cpu);
      
      let gameResult: Result;
      if (choice === cpu) {
        gameResult = 'draw';
      } else if (choices.find(c => c.choice === choice)?.beats === cpu) {
        gameResult = 'win';
        setScore(s => {
          const next = { ...s, player: s.player + 1 };
          onScoreUpdate?.(next.player * 100);
          return next;
        });
      } else {
        gameResult = 'lose';
        setScore(s => ({ ...s, cpu: s.cpu + 1 }));
      }
      
      setResult(gameResult);
      setAnimating(false);
    }, 1000);
  };
  
  const reset = () => {
    setPlayerChoice(null);
    setCpuChoice(null);
    setResult(null);
    setScore({ player: 0, cpu: 0 });
    onScoreUpdate?.(0);
  };
  
  const getEmoji = (choice: Choice) => choices.find(c => c.choice === choice)?.emoji;
  
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Rock Paper Scissors</h2>
        <p className="text-muted-foreground">Choose your weapon!</p>
      </div>
      
      <div className="flex gap-8 text-center">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-3xl font-bold text-primary">{score.player}</div>
          <div className="text-sm text-muted-foreground">You</div>
        </div>
        <div className="text-2xl font-bold self-center">VS</div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-3xl font-bold text-destructive">{score.cpu}</div>
          <div className="text-sm text-muted-foreground">CPU</div>
        </div>
      </div>
      
      {/* Battle Arena */}
      <div className="flex items-center gap-12">
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-5xl transition-all ${
            animating ? 'animate-bounce' : ''
          }`}>
            {playerChoice ? getEmoji(playerChoice) : '❓'}
          </div>
          <p className="mt-2 font-medium">You</p>
        </div>
        
        <div className="text-4xl font-bold text-muted-foreground">VS</div>
        
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center text-5xl transition-all ${
            animating ? 'animate-bounce' : ''
          }`}>
            {cpuChoice ? getEmoji(cpuChoice) : '❓'}
          </div>
          <p className="mt-2 font-medium">CPU</p>
        </div>
      </div>
      
      {result && (
        <div className={`text-2xl font-bold animate-bounce ${
          result === 'win' ? 'text-success' : result === 'lose' ? 'text-destructive' : 'text-warning'
        }`}>
          {result === 'win' ? '🎉 You Win!' : result === 'lose' ? '😢 You Lose!' : '🤝 Draw!'}
        </div>
      )}
      
      {/* Choice Buttons */}
      <div className="flex gap-4">
        {choices.map(({ choice, emoji }) => (
          <button
            key={choice}
            onClick={() => play(choice)}
            disabled={animating}
            className={`w-20 h-20 rounded-xl text-4xl bg-card border-2 border-border hover:border-primary hover:scale-110 transition-all disabled:opacity-50 ${
              playerChoice === choice ? 'ring-2 ring-primary' : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      <Button onClick={reset} variant="outline" size="sm">
        <RotateCcw className="w-4 h-4 mr-2" /> Reset Score
      </Button>
    </div>
  );
};

export default RockPaperScissors;
