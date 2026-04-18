import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { RotateCcw, Check } from 'lucide-react';

const PUZZLES = [
  { letters: 'CAT', words: ['CAT', 'ACT', 'AT', 'TA'] },
  { letters: 'DOG', words: ['DOG', 'GOD', 'GO', 'OD'] },
  { letters: 'STAR', words: ['STAR', 'RATS', 'ARTS', 'TAR', 'RAT', 'ART', 'AS', 'AT'] },
  { letters: 'GAME', words: ['GAME', 'MAGE', 'MEGA', 'AGE', 'GAM', 'EGG'] },
  { letters: 'PLAY', words: ['PLAY', 'PAL', 'LAY', 'LAP', 'YAP', 'PAY'] },
  { letters: 'HEAR', words: ['HEAR', 'HARE', 'HER', 'EAR', 'ARE', 'ERA', 'HE'] },
];

const WordConnect: React.FC = () => {
  const { updateGameStats } = useGame();
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLES[puzzleIdx % PUZZLES.length];
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const letters = puzzle.letters.split('');
  const allFound = found.length === puzzle.words.length;

  const current = useMemo(() => selected.map(i => letters[i]).join(''), [selected, letters]);

  const toggle = (i: number) => {
    setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  };

  const submit = () => {
    if (puzzle.words.includes(current) && !found.includes(current)) {
      setFound(f => [...f, current]);
      setScore(s => s + current.length * 50);
      if (found.length + 1 === puzzle.words.length) {
        updateGameStats('word-connect', score + current.length * 50, 30);
      }
    }
    setSelected([]);
  };

  const next = () => {
    setPuzzleIdx(i => i + 1);
    setSelected([]);
    setFound([]);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <div className="text-sm">Score <span className="font-bold text-primary">{score}</span></div>
        <div className="text-sm">Found <span className="font-bold">{found.length}/{puzzle.words.length}</span></div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full">
        {puzzle.words.map(w => (
          <div key={w} className={`p-2 rounded-lg text-center font-mono text-sm ${
            found.includes(w) ? 'bg-success/20 text-success' : 'bg-muted text-transparent'
          }`}>{found.includes(w) ? w : '•'.repeat(w.length)}</div>
        ))}
      </div>

      <div className="h-12 flex items-center justify-center text-2xl font-bold tracking-widest bg-card border border-border rounded-xl px-6 min-w-[200px]">
        {current || '...'}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {letters.map((l, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-12 h-12 rounded-full text-xl font-bold transition-all ${
              selected.includes(i) ? 'bg-primary text-primary-foreground scale-110' : 'bg-card border-2 border-border'
            }`}
          >{l}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setSelected([])} variant="outline" size="sm"><RotateCcw className="w-4 h-4" /></Button>
        <Button onClick={submit} variant="gaming" size="sm" disabled={!current}>
          <Check className="w-4 h-4 mr-1" /> Submit
        </Button>
      </div>

      {allFound && (
        <div className="text-center p-4 rounded-xl bg-success/10 border border-success/40">
          <p className="font-bold mb-2">All words found! 🎉</p>
          <Button variant="gaming" onClick={next}>Next Puzzle →</Button>
        </div>
      )}
    </div>
  );
};

export default WordConnect;
