import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const allGames = [
  { id: 'pac-man', name: 'Pac-Man' }, { id: 'tetris', name: 'Tetris' }, { id: 'snake', name: 'Snake' },
  { id: 'chess', name: 'Chess' }, { id: 'wordle', name: 'Wordle' }, { id: '2048', name: '2048' },
  { id: 'flappy', name: 'Flappy Bird' }, { id: 'geometry-dash', name: 'Geometry Dash' },
  { id: 'temple-run', name: 'Temple Run' }, { id: 'sudoku', name: 'Sudoku' },
  { id: 'roblox-obby', name: 'Roblox Obby' }, { id: 'balloon-pop', name: 'Balloon Pop' },
  { id: 'gravity-runner', name: 'Gravity Runner' }, { id: 'coin-dash', name: 'Coin Dash' },
  { id: 'ice-slider', name: 'Ice Slider' },
];

const GameSuggestion = ({ excludeGame }: { excludeGame?: string }) => {
  const suggestion = useMemo(() => {
    const filtered = allGames.filter(g => g.id !== excludeGame);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [excludeGame]);

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">Try next: <strong>{suggestion.name}</strong></span>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link to={`/game/${suggestion.id}`}>
            Play <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default GameSuggestion;
