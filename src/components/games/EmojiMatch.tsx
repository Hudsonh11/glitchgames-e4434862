import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

const EMOJIS = ['🎮','🕹️','🎲','🎯','🏆','⚡','🔥','⭐'];

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

const build = (): Card[] => {
  const pairs = [...EMOJIS, ...EMOJIS];
  return pairs.sort(() => Math.random() - 0.5).map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
};

const EmojiMatch: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(build);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const { updateGameStats, addCoins } = useGame();

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    setMoves((m) => m + 1);
    setTimeout(() => {
      setCards((c) => {
        const match = c[a].emoji === c[b].emoji;
        if (match) playSfx('success'); else playSfx('tick');
        return c.map((card, i) =>
          i === a || i === b
            ? { ...card, matched: match || card.matched, flipped: match ? true : false }
            : card
        );
      });
      setPicked([]);
    }, 600);
  }, [picked]);

  useEffect(() => {
    if (cards.length && cards.every((c) => c.matched)) {
      const score = Math.max(200 - moves, 20);
      updateGameStats('emoji-match', score, 0);
      addCoins(score / 5);
      playSfx('win');
    }
  }, [cards, moves, updateGameStats, addCoins]);

  const flip = (i: number) => {
    if (picked.length >= 2 || cards[i].flipped || cards[i].matched) return;
    setCards((c) => c.map((card, idx) => (idx === i ? { ...card, flipped: true } : card)));
    setPicked((p) => [...p, i]);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-primary">Moves: {moves}</span>
        <Button size="sm" variant="outline" onClick={() => { setCards(build()); setMoves(0); setPicked([]); }}>Reset</Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all ${
              c.flipped || c.matched
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/50'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {c.flipped || c.matched ? c.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiMatch;
