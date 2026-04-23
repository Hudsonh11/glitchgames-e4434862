// Site-wide theme engine. Each theme overrides a curated set of HSL design
// tokens defined in src/index.css. Switching writes CSS variables onto
// document.documentElement so every component picks them up live.

export type ThemeId = 'default' | 'cyberpunk' | 'retro' | 'ocean' | 'sunset' | 'forest';

interface ThemeDef {
  id: ThemeId;
  label: string;
  description: string;
  swatch: string; // tailwind gradient classes for picker preview
  vars: Record<string, string>; // HSL strings (no "hsl()" wrapper)
}

export const THEMES: ThemeDef[] = [
  {
    id: 'default',
    label: 'Glitch (Default)',
    description: 'The signature neon-on-black look.',
    swatch: 'from-purple-500 via-pink-500 to-blue-500',
    vars: {},
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Hot pink + electric yellow.',
    swatch: 'from-pink-500 via-yellow-400 to-cyan-400',
    vars: {
      '--background': '300 30% 6%',
      '--foreground': '60 100% 92%',
      '--primary': '320 100% 60%',
      '--primary-foreground': '60 100% 95%',
      '--secondary': '50 100% 55%',
      '--accent': '180 100% 55%',
      '--card': '300 25% 9%',
      '--border': '320 60% 25%',
    },
  },
  {
    id: 'retro',
    label: 'Retro Arcade',
    description: 'Warm CRT amber and magenta.',
    swatch: 'from-orange-500 via-rose-500 to-purple-600',
    vars: {
      '--background': '20 30% 8%',
      '--foreground': '38 100% 88%',
      '--primary': '24 95% 55%',
      '--primary-foreground': '38 100% 95%',
      '--secondary': '330 80% 55%',
      '--accent': '270 70% 60%',
      '--card': '20 25% 11%',
      '--border': '24 60% 25%',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Depths',
    description: 'Deep blues with bioluminescent accents.',
    swatch: 'from-blue-700 via-cyan-500 to-teal-400',
    vars: {
      '--background': '215 50% 8%',
      '--foreground': '195 100% 92%',
      '--primary': '195 100% 50%',
      '--primary-foreground': '215 50% 10%',
      '--secondary': '170 90% 45%',
      '--accent': '230 90% 65%',
      '--card': '215 45% 11%',
      '--border': '200 60% 25%',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Vapor',
    description: 'Soft pinks, purples, and coral.',
    swatch: 'from-fuchsia-500 via-rose-400 to-amber-300',
    vars: {
      '--background': '290 40% 9%',
      '--foreground': '30 100% 92%',
      '--primary': '330 90% 65%',
      '--primary-foreground': '290 40% 10%',
      '--secondary': '20 95% 65%',
      '--accent': '270 85% 70%',
      '--card': '290 35% 12%',
      '--border': '320 50% 28%',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Calm greens with golden highlights.',
    swatch: 'from-emerald-600 via-lime-400 to-yellow-300',
    vars: {
      '--background': '150 30% 7%',
      '--foreground': '90 60% 92%',
      '--primary': '142 70% 45%',
      '--primary-foreground': '150 30% 8%',
      '--secondary': '60 80% 55%',
      '--accent': '170 60% 50%',
      '--card': '150 25% 10%',
      '--border': '142 40% 22%',
    },
  },
];

const STORAGE_KEY = 'siteTheme';

export const getStoredTheme = (): ThemeId => {
  const v = (localStorage.getItem(STORAGE_KEY) || 'default') as ThemeId;
  return THEMES.some((t) => t.id === v) ? v : 'default';
};

export const applyTheme = (id: ThemeId) => {
  const def = THEMES.find((t) => t.id === id) || THEMES[0];
  const root = document.documentElement;
  // Wipe any previously applied theme vars by clearing known keys
  const allKeys = new Set<string>();
  THEMES.forEach((t) => Object.keys(t.vars).forEach((k) => allKeys.add(k)));
  allKeys.forEach((k) => root.style.removeProperty(k));
  // Apply the new theme
  Object.entries(def.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', id);
  localStorage.setItem(STORAGE_KEY, id);
};
