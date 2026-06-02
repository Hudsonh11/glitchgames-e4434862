import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Bot, Users, Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

// Pool of 53 distinct emoji "objects".
const POOL = [
  '🍎','🍌','🍇','🍓','🍊','🍋','🍉','🍑','🍒','🥝',
  '🥑','🍆','🥕','🌽','🌶️','🍔','🍕','🌭','🥪','🌮',
  '🍣','🍩','🍪','🍫','🍿','🥨','🍦','🍰','🎂','🥧',
  '⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🥊',
  '🎮','🎲','🎯','🎰','🎳','🚗','🚙','🚕','🚓','🚑',
  '✈️','🚀','🛸',
];

type Mode = 'menu' | 'bot' | 'friend';

function pickSets(): { a: string[]; b: string[]; match: string } {
  // Each side gets 8 unique items. Exactly one item is shared.
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  const match = shuffled[0];
  const others = shuffled.slice(1);
  const a = [match, ...others.slice(0, 7)].sort(() => Math.random() - 0.5);
  const b = [match, ...others.slice(7, 14)].sort(() => Math.random() - 0.5);
  return { a, b, match };
}

const FindMatch: React.FC = () => {
  const { updateGameStats } = useGame();
  const [mode, setMode] = useState<Mode>('menu');
  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [round, setRound] = useState(pickSets());
  const [winnerMsg, setWinnerMsg] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const botTimer = useRef<number | null>(null);

  const newRound = useCallback(() => {
    setRound(pickSets());
    setWinnerMsg(null);
  }, []);

  // Bot scheduling
  useEffect(() => {
    if (mode !== 'bot' || gameOver || winnerMsg) return;
    if (botTimer.current) window.clearTimeout(botTimer.current);
    const delay = 900 + Math.floor(Math.random() * 1600);
    botTimer.current = window.setTimeout(() => {
      setWinnerMsg('Bot found the match!');
      setScore((s) => ({ ...s, p2: s.p2 + 1 }));
    }, delay);
    return () => { if (botTimer.current) window.clearTimeout(botTimer.current); };
  }, [round, mode, gameOver, winnerMsg]);

  // Winner check
  useEffect(() => {
    if (score.p1 >= 10 || score.p2 >= 10) {
      setGameOver(true);
      const youWon = score.p1 >= 10;
      updateGameStats('find-match', score.p1 * 100, 60).catch(() => {});
      setWinnerMsg(youWon ? '🏆 You win! First to 10!' : '😢 Opponent wins!');
    }
  }, [score, updateGameStats]);

  // Advance to next round when someone scores
  useEffect(() => {
    if (gameOver || !winnerMsg) return;
    const t = window.setTimeout(newRound, 1200);
    return () => window.clearTimeout(t);
  }, [winnerMsg, gameOver, newRound]);

  const onPick = (player: 1 | 2, emoji: string) => {
    if (winnerMsg || gameOver) return;
    if (emoji === round.match) {
      if (botTimer.current) window.clearTimeout(botTimer.current);
      setWinnerMsg(player === 1 ? 'You found it!' : 'Player 2 found it!');
      setScore((s) => player === 1 ? { ...s, p1: s.p1 + 1 } : { ...s, p2: s.p2 + 1 });
    } else {
      // small penalty: do nothing, just flash
    }
  };

  const reset = () => {
    setScore({ p1: 0, p2: 0 });
    setGameOver(false);
    setWinnerMsg(null);
    setRound(pickSets());
  };

  if (mode === 'menu') {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6 py-8">
        <h2 className="font-display text-3xl font-bold text-gradient">Find Match</h2>
        <p className="text-muted-foreground text-sm">
          Compare the two sets of objects and tap the one that appears in both — before your opponent. First to 10 wins!
        </p>
        <div className="grid gap-3">
          <Button onClick={() => { setMode('bot'); reset(); }} variant="gaming" size="lg">
            <Bot className="w-4 h-4 mr-2" /> Play vs Bot
          </Button>
          <Button onClick={() => { setMode('friend'); reset(); }} variant="outline" size="lg">
            <Users className="w-4 h-4 mr-2" /> Friend (Split Screen)
          </Button>
        </div>
      </div>
    );
  }

  const SetGrid: React.FC<{ items: string[]; onClick: (e: string) => void; label: string; flip?: boolean }> = ({ items, onClick, label, flip }) => (
    <div className={`flex-1 p-3 rounded-2xl bg-card border border-border ${flip ? 'rotate-180' : ''}`}>
      <p className={`text-center text-xs text-muted-foreground mb-2 ${flip ? 'rotate-180' : ''}`}>{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((e, i) => (
          <button
            key={`${e}-${i}`}
            onClick={() => onClick(e)}
            disabled={!!winnerMsg || gameOver}
            className={`aspect-square text-3xl sm:text-4xl rounded-xl bg-muted hover:bg-accent active:scale-95 transition disabled:opacity-50 ${flip ? 'rotate-180' : ''}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <div className="flex items-center justify-between px-2">
        <div className="text-sm font-bold">You: <span className="text-primary">{score.p1}</span></div>
        <div className="text-xs text-muted-foreground">{mode === 'bot' ? 'vs Bot' : 'vs Player 2'} · First to 10</div>
        <div className="text-sm font-bold">{mode === 'bot' ? 'Bot' : 'P2'}: <span className="text-secondary">{score.p2}</span></div>
      </div>

      <div className="flex flex-col gap-2">
        {mode === 'friend' ? (
          <>
            <SetGrid items={round.b} onClick={(e) => onPick(2, e)} label="Player 2" flip />
            <div className="text-center text-xs text-muted-foreground">⬇ Find the matching object ⬆</div>
            <SetGrid items={round.a} onClick={(e) => onPick(1, e)} label="You" />
          </>
        ) : (
          <>
            <SetGrid items={round.b} onClick={() => { /* bot side */ }} label="Bot" />
            <div className="text-center text-xs text-muted-foreground">Find the matching object</div>
            <SetGrid items={round.a} onClick={(e) => onPick(1, e)} label="You" />
          </>
        )}
      </div>

      {winnerMsg && (
        <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/30">
          <p className="font-bold">{winnerMsg}</p>
          {gameOver && (
            <Button onClick={reset} variant="gaming" size="sm" className="mt-2">
              <Trophy className="w-4 h-4 mr-1" /> Play Again
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
        <Button onClick={() => setMode('menu')} variant="ghost" size="sm">Change Mode</Button>
      </div>
    </div>
  );
};

export default FindMatch;
