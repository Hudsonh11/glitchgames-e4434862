export interface Modifier {
  id: string;
  name: string;
  description: string;
  icon: string;
  scoreMultiplier: number;
}

export const MODIFIERS: Modifier[] = [
  { id: 'none', name: 'Standard', description: 'The normal game, no twists.', icon: 'circle', scoreMultiplier: 1 },
  { id: 'mirror', name: 'Mirror', description: 'Everything is flipped horizontally.', icon: 'flip-horizontal', scoreMultiplier: 1.3 },
  { id: 'speed', name: 'Double Speed', description: 'The whole game runs at 2× pace.', icon: 'zap', scoreMultiplier: 1.6 },
  { id: 'onelife', name: 'One Life', description: 'A single mistake ends the run.', icon: 'heart-crack', scoreMultiplier: 2 },
  { id: 'hardcore', name: 'Hardcore', description: 'Mirror + double speed + one life.', icon: 'flame', scoreMultiplier: 3 },
];

export const MODIFIER_STORAGE_KEY = 'gg:modifier';
export const PRACTICE_STORAGE_KEY = 'gg:practice';

export function getModifier(): Modifier {
  const id = localStorage.getItem(MODIFIER_STORAGE_KEY) ?? 'none';
  return MODIFIERS.find((m) => m.id === id) ?? MODIFIERS[0];
}

export function setModifier(id: string) {
  localStorage.setItem(MODIFIER_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('gg:modifier-change', { detail: id }));
}

export function isPracticeMode(): boolean {
  return localStorage.getItem(PRACTICE_STORAGE_KEY) === '1';
}

export function setPracticeMode(on: boolean) {
  localStorage.setItem(PRACTICE_STORAGE_KEY, on ? '1' : '0');
  window.dispatchEvent(new CustomEvent('gg:practice-change', { detail: on }));
}

/** CSS applied to the game surface for visual modifiers. */
export function modifierStyle(mod: Modifier): React.CSSProperties {
  const flipped = mod.id === 'mirror' || mod.id === 'hardcore';
  return flipped ? { transform: 'scaleX(-1)' } : {};
}

export function modifierSpeed(mod: Modifier): number {
  return mod.id === 'speed' || mod.id === 'hardcore' ? 2 : 1;
}
