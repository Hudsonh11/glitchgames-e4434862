import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, ThemeId, applyTheme, getStoredTheme } from '@/lib/themes';
import { cn } from '@/lib/utils';

const ThemePicker: React.FC = () => {
  const [active, setActive] = useState<ThemeId>(getStoredTheme);

  const pick = (id: ThemeId) => {
    setActive(id);
    applyTheme(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <h4 className="font-display font-bold text-sm">Color Theme</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={cn(
              'relative rounded-xl p-3 text-left border transition-all hover:scale-[1.02]',
              active === t.id ? 'border-primary shadow-glow' : 'border-border bg-card/40'
            )}
          >
            <div className={cn('h-12 w-full rounded-lg bg-gradient-to-br mb-2', t.swatch)} />
            <p className="font-bold text-sm truncate">{t.label}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
            {active === t.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemePicker;
