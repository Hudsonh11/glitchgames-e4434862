import { supabase } from '@/integrations/supabase/client';

export interface GhostFrame {
  t: number;
  x: number;
  y: number;
  s?: number;
}

const QUEUE_KEY = 'gg:offline-scores';

export interface QueuedScore {
  gameId: string;
  score: number;
  timePlayed: number;
  at: number;
}

/** Save a run as the player's ghost if it beats the stored one. */
export async function saveGhost(userId: string, gameId: string, score: number, frames: GhostFrame[], durationMs: number) {
  const { data: existing } = await supabase
    .from('game_replays')
    .select('score')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (existing && existing.score >= score) return;

  await supabase.from('game_replays').upsert(
    {
      user_id: userId,
      game_id: gameId,
      score,
      duration_ms: durationMs,
      frames: frames.slice(0, 4000) as unknown as never,
    },
    { onConflict: 'user_id,game_id' },
  );
}

export async function loadGhost(userId: string, gameId: string) {
  const { data } = await supabase
    .from('game_replays')
    .select('score, duration_ms, frames')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();
  if (!data) return null;
  return {
    score: data.score,
    durationMs: data.duration_ms,
    frames: (data.frames as unknown as GhostFrame[]) ?? [],
  };
}

/* ---------- offline queue ---------- */

export function queueOfflineScore(entry: QueuedScore) {
  const raw = localStorage.getItem(QUEUE_KEY);
  const list: QueuedScore[] = raw ? JSON.parse(raw) : [];
  list.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-100)));
}

export function readOfflineQueue(): QueuedScore[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
