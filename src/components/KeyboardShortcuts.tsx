import React, { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraCard from '@/components/UltraCard';
import { useNavigate } from 'react-router-dom';

const shortcuts = [
  { keys: ['Ctrl', 'H'], description: 'Go Home', action: '/' },
  { keys: ['Ctrl', 'P'], description: 'Profile', action: '/profile' },
  { keys: ['Ctrl', 'L'], description: 'Leaderboard', action: '/leaderboard' },
  { keys: ['Ctrl', 'R'], description: 'Rewards', action: '/rewards' },
  { keys: ['Ctrl', 'S'], description: 'Settings', action: '/settings' },
  { keys: ['?'], description: 'Show Shortcuts', action: 'toggle' },
];

const KeyboardShortcuts: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?' && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      if (e.ctrlKey) {
        const shortcut = shortcuts.find(s => s.keys.includes('Ctrl') && s.keys[1].toLowerCase() === e.key.toLowerCase());
        if (shortcut && shortcut.action !== 'toggle') {
          e.preventDefault();
          navigate(shortcut.action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowHelp(false)}>
      <div className="p-6 max-w-sm w-full mx-4 rounded-2xl border bg-card border-primary/20 shadow-glow" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setShowHelp(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((key) => (
                  <kbd key={key} className="px-2 py-1 rounded bg-muted border border-border text-xs font-mono font-bold">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
