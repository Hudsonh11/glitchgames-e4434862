import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { ALL_GAMES } from '@/lib/gamesCatalog';
import { Gamepad2, Trophy, Gift, User, Settings as SettingsIcon, Users, Home, Shuffle } from 'lucide-react';
import { playSfx } from '@/lib/sfx';

/** Global ⌘K / Ctrl+K palette — jump to any game or page instantly. */
const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        playSfx('click');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => { setOpen(false); playSfx('pop'); navigate(path); };

  const pages = useMemo(() => ([
    { label: 'Home', path: '/', icon: Home },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Rewards & Plus', path: '/rewards', icon: Gift },
    { label: 'Social Hub', path: '/social', icon: Users },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ]), []);

  if (!open) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search games or jump to a page…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => {
            const g = ALL_GAMES[Math.floor(Math.random() * ALL_GAMES.length)];
            go(`/game/${g.id}`);
          }}>
            <Shuffle className="mr-2 h-4 w-4 text-primary" /> Surprise me — play a random game
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Games">
          {ALL_GAMES.map((g) => (
            <CommandItem key={g.id} value={`${g.title} ${g.category}`} onSelect={() => go(`/game/${g.id}`)}>
              <Gamepad2 className="mr-2 h-4 w-4" style={{ color: g.color }} />
              <span>{g.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{g.category}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
