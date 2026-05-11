// Computes the current 30-day battle pass season deterministically.
// Seasons cycle every 30 days from a fixed epoch. A new season auto-starts
// when the previous one ends — no server cron needed. Premium purchases are
// recorded per-season key, so a new season requires a new purchase.

const EPOCH = Date.UTC(2026, 0, 1); // Jan 1, 2026 UTC — Season 1 starts here
const SEASON_MS = 30 * 24 * 60 * 60 * 1000;

const SEASON_NAMES = [
  'Neon Legends', 'Glitch Storm', 'Pixel Awakening', 'Arcade Renaissance',
  'Cyber Dynasty', 'Quantum Rush', 'Retro Future', 'Crystal Vanguard',
  'Plasma Surge', 'Echo Reborn', 'Nova Reign', 'Holo Revolution',
];

export interface SeasonInfo {
  index: number;          // 1-based season number
  key: string;            // e.g. "season_1" (used in DB columns)
  name: string;           // human-readable
  startsAt: Date;
  endsAt: Date;
  daysLeft: number;       // accurate, integer ceiling
  hoursLeft: number;
}

export const getCurrentSeason = (now: Date = new Date()): SeasonInfo => {
  const t = now.getTime();
  const elapsed = Math.max(0, t - EPOCH);
  const idx = Math.floor(elapsed / SEASON_MS); // 0-based
  const start = EPOCH + idx * SEASON_MS;
  const end = start + SEASON_MS;
  const msLeft = end - t;
  return {
    index: idx + 1,
    key: `season_${idx + 1}`,
    name: SEASON_NAMES[idx % SEASON_NAMES.length],
    startsAt: new Date(start),
    endsAt: new Date(end),
    daysLeft: Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
    hoursLeft: Math.max(0, Math.ceil(msLeft / (60 * 60 * 1000))),
  };
};
