import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { playSfx } from '@/lib/sfx';
import { Delete, CornerDownLeft } from 'lucide-react';

interface WordleGameProps {
  onScoreUpdate?: (score: number) => void;
}

const WORDS = ['REACT', 'GAMES', 'PIXEL', 'BLOCK', 'STACK', 'SCORE', 'WORLD', 'LIGHT', 'POWER', 'SPEED', 'BRAIN', 'FLAME', 'STORM', 'DREAM', 'GHOST'];

const WordleGame: React.FC<WordleGameProps> = ({ onScoreUpdate }) => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        toast.error('Word must be 5 letters!');
        return;
      }
      
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      
      if (currentGuess === targetWord) {
        setWon(true);
        setGameOver(true);
        const score = (6 - newGuesses.length + 1) * 100;
        onScoreUpdate?.(score);
        toast.success(`🎉 You won! Score: ${score}`);
      } else if (newGuesses.length >= 6) {
        setGameOver(true);
        toast.error(`Game Over! The word was ${targetWord}`);
      }
      
      setCurrentGuess('');
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, guesses, targetWord, gameOver, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getLetterColor = (letter: string, index: number, guess: string): string => {
    if (targetWord[index] === letter) return 'bg-green-500 text-white border-green-600';
    if (targetWord.includes(letter)) return 'bg-yellow-500 text-white border-yellow-600';
    return 'bg-gray-600 text-white border-gray-700';
  };

  const restart = () => {
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
  };

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ];

  const getKeyColor = (key: string): string => {
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (targetWord[i] === key) return 'bg-green-500 text-white border-green-600 hover:bg-green-500';
          if (targetWord.includes(key)) return 'bg-yellow-500 text-black border-yellow-600 hover:bg-yellow-500';
          return 'bg-zinc-700 text-zinc-400 border-zinc-800 hover:bg-zinc-700';
        }
      }
    }
    return 'bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-white dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-200';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-primary">Wordle</h2>
      
      <div className="flex flex-col gap-2">
        {[...Array(6)].map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
          const isSubmitted = rowIndex < guesses.length;
          
          return (
            <div key={rowIndex} className="flex gap-2">
              {[...Array(5)].map((_, colIndex) => {
                const letter = guess[colIndex] || '';
                const colorClass = isSubmitted ? getLetterColor(letter, colIndex, guess) : 'bg-card border-border';
                
                return (
                  <div
                    key={colIndex}
                    className={`w-12 h-12 md:w-14 md:h-14 border-2 rounded flex items-center justify-center font-bold text-xl ${colorClass} transition-all ${letter ? 'scale-105' : ''}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 mt-4">
        {keyboard.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map(key => (
              <Button
                key={key}
                size="sm"
                className={`${key.length > 1 ? 'px-3' : 'w-8 md:w-10'} h-10 md:h-12 ${getKeyColor(key)}`}
                onClick={() => handleKeyPress(key === '⌫' ? 'BACKSPACE' : key)}
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming" className="mt-4">
          Play Again
        </Button>
      )}
    </div>
  );
};

export default WordleGame;
