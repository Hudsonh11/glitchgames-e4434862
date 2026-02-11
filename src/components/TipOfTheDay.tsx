import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronRight } from 'lucide-react';

const tips = [
  "Play daily to maintain your login streak and earn bonus rewards!",
  "Try different games to earn more XP and level up faster.",
  "Complete weekly challenges for extra coins and gems.",
  "Add friends to compete on leaderboards together!",
  "Check the Profile Shop for exclusive avatar borders and titles.",
  "Use the Quick Play button for a random game suggestion!",
  "Your high scores sync automatically across all devices.",
  "Unlock achievements by reaching milestones in different games.",
  "Visit the Rewards page daily to claim your streak bonus!",
  "Use keyboard shortcuts: Press 'H' for Home, 'P' for Profile.",
];

const TipOfTheDay = () => {
  const [dismissed, setDismissed] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastDismissed = localStorage.getItem('tipDismissedDate');
    if (lastDismissed === today) setDismissed(true);
    setTipIndex(new Date().getDate() % tips.length);
  }, []);

  if (dismissed) return null;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border border-primary/20 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/20 shrink-0">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display font-bold text-primary uppercase tracking-wider mb-1">Tip of the Day</p>
        <p className="text-sm text-muted-foreground">{tips[tipIndex]}</p>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem('tipDismissedDate', new Date().toISOString().split('T')[0]);
        }}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default TipOfTheDay;
