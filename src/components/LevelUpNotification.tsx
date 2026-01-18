import React, { useState, useEffect } from 'react';
import { Crown, Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraConfetti from './UltraConfetti';

interface LevelUpNotificationProps {
  level: number;
  rewards?: { coins: number; gems: number };
  onClose: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ level, rewards, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <UltraConfetti active={true} />
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        <div 
          className={`relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/30 rounded-3xl p-8 max-w-md mx-4 transform transition-all duration-500 ${
            visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Crown icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center animate-pulse">
                <Crown className="w-12 h-12 text-warning-foreground" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-warning animate-spin" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Star className="w-6 h-6 text-primary fill-primary animate-bounce" />
              </div>
            </div>
          </div>

          {/* Level text */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Congratulations!</p>
            <h2 className="text-4xl font-bold text-gradient mb-2">Level Up!</h2>
            <div className="text-6xl font-black text-foreground animate-counter-pop">
              {level}
            </div>
          </div>

          {/* Rewards */}
          {rewards && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground text-center mb-3">Rewards Earned</p>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <span className="text-lg">🪙</span>
                  </div>
                  <span className="font-bold text-warning">+{rewards.coins}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-lg">💎</span>
                  </div>
                  <span className="font-bold text-secondary">+{rewards.gems}</span>
                </div>
              </div>
            </div>
          )}

          {/* Continue button */}
          <Button variant="gaming" className="w-full" onClick={handleClose}>
            Continue Playing
          </Button>
        </div>
      </div>
    </>
  );
};

export default LevelUpNotification;
