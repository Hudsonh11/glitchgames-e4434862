// Lightweight Web Audio sound system. Generates SFX synthetically so we
// don't need to ship audio assets. Reads volume/mute from the existing
// soundSettings stored in localStorage by GameContext.

type SfxName = 'click' | 'success' | 'error' | 'coin' | 'levelup' | 'notification' | 'hover';

let ctx: AudioContext | null = null;

const ensureCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

interface PersistedSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

const readSettings = (): PersistedSettings => {
  try {
    const raw = localStorage.getItem('soundSettings');
    if (raw) return JSON.parse(raw) as PersistedSettings;
  } catch {/* ignore */}
  return { masterVolume: 80, musicVolume: 70, sfxVolume: 80, isMuted: false };
};

const RECIPES: Record<SfxName, { freq: number; freq2?: number; type: OscillatorType; dur: number; vol: number }> = {
  click:        { freq: 600,  type: 'square',   dur: 0.05, vol: 0.15 },
  hover:        { freq: 900,  type: 'sine',     dur: 0.04, vol: 0.06 },
  success:      { freq: 523,  freq2: 880, type: 'triangle', dur: 0.18, vol: 0.20 },
  error:        { freq: 220,  freq2: 110, type: 'sawtooth', dur: 0.20, vol: 0.18 },
  coin:         { freq: 988,  freq2: 1318, type: 'square',  dur: 0.12, vol: 0.18 },
  levelup:      { freq: 523,  freq2: 1046, type: 'triangle', dur: 0.35, vol: 0.25 },
  notification: { freq: 740,  freq2: 988, type: 'sine',     dur: 0.18, vol: 0.18 },
};

export const playSfx = (name: SfxName) => {
  const settings = readSettings();
  if (settings.isMuted) return;
  const c = ensureCtx();
  if (!c) return;
  const r = RECIPES[name];
  const t = c.currentTime;
  const gain = c.createGain();
  const masterGain = (settings.masterVolume / 100) * (settings.sfxVolume / 100) * r.vol;
  gain.gain.setValueAtTime(masterGain, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + r.dur);
  gain.connect(c.destination);

  const osc = c.createOscillator();
  osc.type = r.type;
  osc.frequency.setValueAtTime(r.freq, t);
  if (r.freq2) osc.frequency.exponentialRampToValueAtTime(r.freq2, t + r.dur);
  osc.connect(gain);
  osc.start(t);
  osc.stop(t + r.dur);
};

// Hook so React components can call sfx without importing globals everywhere
export const useSfx = () => playSfx;
