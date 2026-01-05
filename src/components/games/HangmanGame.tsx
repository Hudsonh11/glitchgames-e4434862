import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HangmanGameProps {
  onScoreUpdate?: (score: number) => void;
}

const WORDS = ['JAVASCRIPT', 'PROGRAMMING', 'DEVELOPER', 'COMPUTER', 'ALGORITHM', 'DATABASE', 'INTERFACE', 'FUNCTION', 'VARIABLE', 'COMPONENT'];

const HangmanGame: React.FC<HangmanGameProps> = ({ onScoreUpdate }) => {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const maxWrong = 6;

  useEffect(() => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }, []);

  const handleGuess = useCallback((letter: string) => {
    if (gameOver || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= maxWrong) {
        setGameOver(true);
        toast.error(`Game Over! The word was ${word}`);
      }
    } else {
      const isWon = word.split('').every(l => newGuessed.has(l));
      if (isWon) {
        setWon(true);
        setGameOver(true);
        const score = (maxWrong - wrongGuesses) * 100 + word.length * 10;
        onScoreUpdate?.(score);
        toast.success(`🎉 You won! Score: ${score}`);
      }
    }
  }, [gameOver, guessedLetters, word, wrongGuesses, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleGuess(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess]);

  const restart = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
  };

  const displayWord = word.split('').map(letter => 
    guessedLetters.has(letter) ? letter : '_'
  ).join(' ');

  const hangmanParts = [
    <circle key="head" cx="150" cy="70" r="20" stroke="currentColor" strokeWidth="4" fill="none" />,
    <line key="body" x1="150" y1="90" x2="150" y2="150" stroke="currentColor" strokeWidth="4" />,
    <line key="left-arm" x1="150" y1="110" x2="120" y2="140" stroke="currentColor" strokeWidth="4" />,
    <line key="right-arm" x1="150" y1="110" x2="180" y2="140" stroke="currentColor" strokeWidth="4" />,
    <line key="left-leg" x1="150" y1="150" x2="120" y2="190" stroke="currentColor" strokeWidth="4" />,
    <line key="right-leg" x1="150" y1="150" x2="180" y2="190" stroke="currentColor" strokeWidth="4" />,
  ];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-lg text-muted-foreground">
        Wrong guesses: {wrongGuesses} / {maxWrong}
      </div>

      <svg width="200" height="220" className="text-primary">
        {/* Gallows */}
        <line x1="40" y1="200" x2="160" y2="200" stroke="currentColor" strokeWidth="4" />
        <line x1="100" y1="200" x2="100" y2="20" stroke="currentColor" strokeWidth="4" />
        <line x1="100" y1="20" x2="150" y2="20" stroke="currentColor" strokeWidth="4" />
        <line x1="150" y1="20" x2="150" y2="50" stroke="currentColor" strokeWidth="4" />
        
        {/* Hangman parts */}
        {hangmanParts.slice(0, wrongGuesses)}
      </svg>

      <div className="text-3xl font-mono font-bold tracking-widest text-foreground">
        {displayWord}
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {alphabet.map(letter => {
          const isGuessed = guessedLetters.has(letter);
          const isCorrect = word.includes(letter);
          let colorClass = 'bg-muted hover:bg-muted/80';
          if (isGuessed) {
            colorClass = isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
          }
          
          return (
            <Button
              key={letter}
              size="sm"
              className={`w-9 h-9 ${colorClass}`}
              disabled={isGuessed || gameOver}
              onClick={() => handleGuess(letter)}
            >
              {letter}
            </Button>
          );
        })}
      </div>

      {gameOver && (
        <Button onClick={restart} variant="gaming">
          Play Again
        </Button>
      )}

      <p className="text-sm text-muted-foreground">Click letters or type on keyboard</p>
    </div>
  );
};

export default HangmanGame;
