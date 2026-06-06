// Lightweight Web Audio sound system. Generates SFX synthetically so we
// don't need to ship audio assets. Reads volume/mute from the existing
// soundSettings stored in localStorage by GameContext.

export type SfxName =
  | 'click' | 'success' | 'error' | 'coin' | 'levelup' | 'notification' | 'hover'
  | 'crash' | 'jump' | 'whoosh' | 'win' | 'lose' | 'engine' | 'pop' | 'tick' | 'powerup';

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

interface Recipe {
  freq: number; freq2?: number;
  type: OscillatorType;
  dur: number; vol: number;
  noise?: boolean;
}

const RECIPES: Record<SfxName, Recipe> = {
  click:        { freq: 600,  type: 'square',   dur: 0.05, vol: 0.15 },
  hover:        { freq: 900,  type: 'sine',     dur: 0.04, vol: 0.06 },
  success:      { freq: 523,  freq2: 880,  type: 'triangle', dur: 0.18, vol: 0.20 },
  error:        { freq: 220,  freq2: 110,  type: 'sawtooth', dur: 0.20, vol: 0.18 },
  coin:         { freq: 988,  freq2: 1318, type: 'square',   dur: 0.12, vol: 0.18 },
  levelup:      { freq: 523,  freq2: 1046, type: 'triangle', dur: 0.35, vol: 0.25 },
  notification: { freq: 740,  freq2: 988,  type: 'sine',     dur: 0.18, vol: 0.18 },
  crash:        { freq: 180,  freq2: 60,   type: 'sawtooth', dur: 0.35, vol: 0.30, noise: true },
  jump:         { freq: 380,  freq2: 720,  type: 'square',   dur: 0.14, vol: 0.18 },
  whoosh:       { freq: 800,  freq2: 220,  type: 'sine',     dur: 0.22, vol: 0.12, noise: true },
  win:          { freq: 660,  freq2: 1320, type: 'triangle', dur: 0.50, vol: 0.30 },
  lose:         { freq: 440,  freq2: 110,  type: 'sawtooth', dur: 0.50, vol: 0.25 },
  engine:       { freq: 90,   freq2: 130,  type: 'sawtooth', dur: 0.12, vol: 0.08 },
  pop:          { freq: 1200, freq2: 600,  type: 'sine',     dur: 0.08, vol: 0.14 },
  tick:         { freq: 1400, type: 'square',   dur: 0.03, vol: 0.10 },
  powerup:      { freq: 440,  freq2: 1760, type: 'triangle', dur: 0.45, vol: 0.25 },
};

const playNoise = (c: AudioContext, t: number, dur: number, vol: number) => {
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur);
};

export const playSfx = (name: SfxName) => {
  const settings = readSettings();
  if (settings.isMuted) return;
  const c = ensureCtx();
  if (!c) return;
  const r = RECIPES[name];
  if (!r) return;
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

  if (r.noise) playNoise(c, t, r.dur, masterGain * 0.6);
};

export const useSfx = () => playSfx;
