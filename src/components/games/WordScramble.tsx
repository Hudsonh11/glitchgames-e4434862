import React, { useState, useEffect, useCallback } from 'react';

const WORDS = [
  'REACT', 'GAMING', 'PUZZLE', 'SCORE', 'LEVEL', 'POWER', 'QUEST', 'ARENA', 'MAGIC',
  'BLAZE', 'SWIFT', 'BRAVE', 'STORM', 'FLAME', 'LIGHT', 'SHADOW', 'CRYSTAL', 'DRAGON',
  'KNIGHT', 'SHIELD', 'SWORD', 'TOWER', 'CASTLE', 'FOREST', 'OCEAN', 'MOUNTAIN',
  'VALLEY', 'PHOENIX', 'LEGEND', 'MYTHIC', 'COSMIC', 'STELLAR', 'NEBULA', 'COMET',
];

const scramble = (word: string): string => {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('') === word ? scramble(word) : arr.join('');
};

interface WordScrambleProps {
  onScoreUpdate?: (score: number) => void;
}

const WordScramble: React.FC<WordScrambleProps> = ({ onScoreUpdate }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [round, setRound] = useState(0);

  const newWord = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(word);
    setScrambled(scramble(word));
    setGuess('');
    setHint('');
    setFeedback(null);
  }, []);

  useEffect(() => { newWord(); }, [newWord]);

  const checkGuess = () => {
    if (guess.toUpperCase() === currentWord) {
      setFeedback('correct');
      setScore(s => {
        const next = s + 100 + streak * 25;
        onScoreUpdate?.(next);
        return next;
      });
      setStreak(s => s + 1);
      setRound(r => r + 1);
      setTimeout(newWord, 1000);
    } else {
      setFeedback('wrong');
      setStreak(0);
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const showHint = () => {
    const revealed = currentWord.slice(0, Math.min(hint.length + 1, currentWord.length - 1));
    setHint(revealed);
    setScore(s => {
      const next = Math.max(0, s - 20);
      onScoreUpdate?.(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between w-full mb-6">
        <span className="text-lg font-bold text-primary">Score: {score}</span>
        <span className="text-sm text-muted-foreground">Round {round + 1}</span>
        {streak > 1 && <span className="text-lg font-bold text-warning">🔥 x{streak}</span>}
      </div>

      <div className={`text-4xl font-black tracking-[0.3em] mb-6 py-4 px-8 rounded-xl bg-card border-2 transition-all ${
        feedback === 'correct' ? 'border-green-500 text-green-500 animate-bounce' :
        feedback === 'wrong' ? 'border-destructive text-destructive animate-shake' : 'border-border text-foreground'
      }`}>
        {scrambled}
      </div>

      {hint && (
        <p className="text-sm text-muted-foreground mb-2">Hint: {hint}{'_'.repeat(currentWord.length - hint.length)}</p>
      )}

      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={guess}
          onChange={e => setGuess(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkGuess()}
          placeholder="Type your answer..."
          className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-center text-lg font-bold uppercase"
          maxLength={currentWord.length}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={checkGuess} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold">Submit</button>
        <button onClick={showHint} className="px-6 py-2 bg-muted text-muted-foreground rounded-lg font-bold border border-border">Hint (-20)</button>
        <button onClick={newWord} className="px-6 py-2 bg-muted text-muted-foreground rounded-lg font-bold border border-border">Skip</button>
      </div>
    </div>
  );
};

export default WordScramble;
