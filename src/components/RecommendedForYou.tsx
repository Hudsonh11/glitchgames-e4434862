import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { ALL_GAMES } from '@/lib/gamesCatalog';
import { Sparkles, Star } from 'lucide-react';

/**
 * "Recommended For You" — picks unplayed games from the categories the player
 * spends the most time in, falling back to top-rated titles for new players.
 */
const RecommendedForYou: React.FC = () => {
  const { gameStats } = useGame();

  const picks = useMemo(() => {
    const played = new Set(Object.keys(gameStats).filter((id) => (gameStats[id]?.gamesPlayed || 0) > 0));
    const weight: Record<string, number> = {};
    played.forEach((id) => {
      const meta = ALL_GAMES.find((g) => g.id === id);
      if (meta) weight[meta.category] = (weight[meta.category] || 0) + (gameStats[id].gamesPlayed || 1);
    });
    const favCategories = Object.entries(weight).sort((a, b) => b[1] - a[1]).map(([c]) => c);

    const unplayed = ALL_GAMES.filter((g) => !played.has(g.id));
    const scored = unplayed.map((g) => {
      const rank = favCategories.indexOf(g.category);
      return { g, score: (rank === -1 ? 0 : (favCategories.length - rank) * 2) + g.rating };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 4).map((s) => s.g);
  }, [gameStats]);

  if (picks.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" /> Recommended For You
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Based on the games you play most</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {picks.map((g) => (
          <Link
            key={g.id}
            to={`/game/${g.id}`}
            className="group rounded-xl p-4 border border-border/60 bg-card/50 hover:border-accent/60 hover:-translate-y-1 transition-all"
          >
            <div className="w-full h-1.5 rounded-full mb-3" style={{ background: g.color }} />
            <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{g.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3 text-warning fill-warning" /> {g.rating} · {g.category}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedForYou;
