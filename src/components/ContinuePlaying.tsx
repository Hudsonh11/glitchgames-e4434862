import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { ALL_GAMES } from '@/lib/gamesCatalog';
import { History, Play } from 'lucide-react';

/** "Continue Playing" — the games you've actually put time into, most recent first. */
const ContinuePlaying: React.FC = () => {
  const { gameStats, isLoggedIn } = useGame();

  const recent = useMemo(() => {
    return Object.entries(gameStats)
      .filter(([, s]) => (s?.gamesPlayed || 0) > 0)
      .sort((a, b) => (b[1].gamesPlayed || 0) - (a[1].gamesPlayed || 0))
      .slice(0, 6)
      .map(([id, s]) => ({ meta: ALL_GAMES.find((g) => g.id === id), id, stats: s }))
      .filter((r) => r.meta);
  }, [gameStats]);

  if (!isLoggedIn || recent.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" /> Continue Playing
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {recent.map(({ id, meta, stats }) => (
          <Link
            key={id}
            to={`/game/${id}`}
            className="group rounded-xl p-3 border border-border/60 bg-card/50 hover:border-primary/60 hover:-translate-y-1 transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${meta!.color}, transparent)` }}
            >
              <Play className="w-4 h-4 text-foreground" />
            </div>
            <p className="text-sm font-bold truncate">{meta!.title}</p>
            <p className="text-xs text-muted-foreground">Best {(stats.highScore || 0).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContinuePlaying;
