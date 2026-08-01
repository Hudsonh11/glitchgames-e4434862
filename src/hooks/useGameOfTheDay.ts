import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_GAMES } from '@/lib/gamesCatalog';

export interface GameOfTheDay {
  gameId: string;
  title: string;
  multiplier: number;
}

/** Reads today's featured game, falling back to a deterministic daily pick. */
export function useGameOfTheDay(): { gotd: GameOfTheDay | null; loading: boolean } {
  const [gotd, setGotd] = useState<GameOfTheDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const day = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('game_of_the_day')
        .select('game_id, reward_multiplier')
        .eq('day', day)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        const meta = ALL_GAMES.find((g) => g.id === data.game_id);
        setGotd({
          gameId: data.game_id,
          title: meta?.title ?? data.game_id,
          multiplier: Number(data.reward_multiplier),
        });
      } else {
        // Deterministic fallback so the feature works before any row exists.
        const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
        const pick = ALL_GAMES[seed % ALL_GAMES.length];
        setGotd({ gameId: pick.id, title: pick.title, multiplier: 2 });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { gotd, loading };
}

export function useIsGameOfTheDay(gameId?: string) {
  const { gotd } = useGameOfTheDay();
  return { isGotd: !!gameId && gotd?.gameId === gameId, multiplier: gotd?.multiplier ?? 1 };
}
