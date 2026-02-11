import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';

interface Props {
  achievement: { name: string; description: string; icon: string; rarity: string } | null;
  onDismiss: () => void;
}

const AchievementPopup = ({ achievement, onDismiss }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className={`fixed top-24 right-4 z-50 max-w-sm transition-all duration-500 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="p-4 rounded-2xl bg-card border-2 border-warning/50 shadow-neon-gold backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{achievement.icon}</span>
          <div className="flex-1">
            <p className="text-xs text-warning font-display font-bold uppercase tracking-wider">Achievement Unlocked!</p>
            <p className="font-display font-bold">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
          <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementPopup;
