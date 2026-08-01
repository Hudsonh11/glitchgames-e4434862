import { supabase } from '@/integrations/supabase/client';

/**
 * Client-side guard rails. The authoritative check lives in the `submit-score`
 * edge function; this stops obvious nonsense before it leaves the browser and
 * keeps a local rate limit so a runaway loop can't spam the leaderboard.
 */

const MAX_PER_MINUTE = 12;
const MIN_RUN_MS = 1500;

// Plausible ceilings per minute of play. Anything above is rejected.
const SCORE_RATE_CEILING = 250_000;

const recent: number[] = [];

export interface SubmitResult {
  accepted: boolean;
  reason?: string;
}

export function localRateLimit(): SubmitResult {
  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= MAX_PER_MINUTE) {
    return { accepted: false, reason: 'Too many scores submitted in a short window.' };
  }
  recent.push(now);
  return { accepted: true };
}

export function plausible(score: number, durationMs: number): SubmitResult {
  if (!Number.isFinite(score) || score < 0 || !Number.isInteger(score)) {
    return { accepted: false, reason: 'Score is not a valid number.' };
  }
  if (durationMs > 0 && durationMs < MIN_RUN_MS && score > 1000) {
    return { accepted: false, reason: 'Run was too short for this score.' };
  }
  const minutes = Math.max(durationMs, 1000) / 60_000;
  if (score / minutes > SCORE_RATE_CEILING) {
    return { accepted: false, reason: 'Score rate is implausibly high.' };
  }
  return { accepted: true };
}

/** Validate + log a score submission. Returns whether it should be persisted. */
export async function validateScore(
  userId: string,
  gameId: string,
  score: number,
  durationMs: number,
): Promise<SubmitResult> {
  const checks = [localRateLimit(), plausible(score, durationMs)];
  const failed = checks.find((c) => !c.accepted);
  const result: SubmitResult = failed ?? { accepted: true };

  try {
    await supabase.functions.invoke('submit-score', {
      body: { game_id: gameId, score, duration_ms: durationMs, client_ok: result.accepted },
    });
  } catch {
    /* logging is best-effort */
  }

  return result;
}
