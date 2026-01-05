import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ColorMatchProps {
  onScoreUpdate?: (score: number) => void;
}

const COLORS = [
  { name: 'RED', bg: 'bg-red-500' },
  { name: 'BLUE', bg: 'bg-blue-500' },
  { name: 'GREEN', bg: 'bg-green-500' },
  { name: 'YELLOW', bg: 'bg-yellow-500' },
  { name: 'PURPLE', bg: 'bg-purple-500' },
  { name: 'ORANGE', bg: 'bg-orange-500' },
];

const ColorMatch: React.FC<ColorMatchProps> = ({ onScoreUpdate }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWord, setCurrentWord] = useState({ text: 'RED', colorIndex: 0 });
  const [streak, setStreak] = useState(0);

  const generateRound = useCallback(() => {
    const textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const displayColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { text: textColor.name, colorIndex: COLORS.indexOf(displayColor) };
  }, []);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setStreak(0);
    setIsPlaying(true);
    setCurrentWord(generateRound());
  };

  React.useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsPlaying(false);
          clearInterval(timer);
          onScoreUpdate?.(score);
          toast.success(`Time's up! Final score: ${score}`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score, onScoreUpdate]);

  const handleAnswer = (matches: boolean) => {
    if (!isPlaying) return;

    const wordColorName = currentWord.text;
    const displayColorName = COLORS[currentWord.colorIndex].name;
    const actuallyMatches = wordColorName === displayColorName;

    if (matches === actuallyMatches) {
      const points = 10 + streak * 2;
      setScore(s => s + points);
      setStreak(s => s + 1);
      toast.success(`+${points}!`, { duration: 500 });
    } else {
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) {
          setIsPlaying(false);
          onScoreUpdate?.(score);
          toast.error(`Game Over! Score: ${score}`);
        }
        return newLives;
      });
      setStreak(0);
    }

    setCurrentWord(generateRound());
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
            {timeLeft}s
          </div>
          <div className="text-sm text-muted-foreground">Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-500">{'❤️'.repeat(lives)}</div>
          <div className="text-sm text-muted-foreground">Lives</div>
        </div>
        {streak > 1 && (
          <div>
            <div className="text-2xl font-bold text-yellow-500 animate-pulse">{streak}🔥</div>
            <div className="text-sm text-muted-foreground">Streak</div>
          </div>
        )}
      </div>

      <div className="text-center p-8 bg-card rounded-xl border-2 border-primary min-w-[300px]">
        <p className="text-lg text-muted-foreground mb-4">Does the word match its color?</p>
        
        <div 
          className={`text-5xl font-bold mb-8 ${COLORS[currentWord.colorIndex].bg} bg-clip-text text-transparent`}
          style={{ 
            WebkitBackgroundClip: 'text',
            backgroundColor: 'transparent',
            color: currentWord.colorIndex === 0 ? '#ef4444' :
                   currentWord.colorIndex === 1 ? '#3b82f6' :
                   currentWord.colorIndex === 2 ? '#22c55e' :
                   currentWord.colorIndex === 3 ? '#eab308' :
                   currentWord.colorIndex === 4 ? '#a855f7' : '#f97316'
          }}
        >
          {currentWord.text}
        </div>

        {isPlaying ? (
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => handleAnswer(true)} 
              variant="default"
              size="lg"
              className="bg-green-500 hover:bg-green-600 w-28"
            >
              ✓ MATCH
            </Button>
            <Button 
              onClick={() => handleAnswer(false)} 
              variant="destructive"
              size="lg"
              className="w-28"
            >
              ✗ NO
            </Button>
          </div>
        ) : (
          <Button onClick={startGame} variant="gaming" size="lg">
            {timeLeft === 0 || lives === 0 ? 'Play Again' : 'Start Game'}
          </Button>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-sm">
        <p>If the word "RED" is displayed in red color, press MATCH.</p>
        <p>If it's displayed in any other color, press NO.</p>
      </div>
    </div>
  );
};

export default ColorMatch;
