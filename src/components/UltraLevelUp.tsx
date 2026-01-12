import React, { useEffect, useState } from 'react';
import { Zap, Star, Crown, Sparkles } from 'lucide-react';

interface UltraLevelUpProps {
  level: number;
  onComplete?: () => void;
}

const UltraLevelUp: React.FC<UltraLevelUpProps> = ({ level, onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 600),
      setTimeout(() => setStage(3), 1200),
      setTimeout(() => {
        onComplete?.();
      }, 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Background flash */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 
          transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Radial burst */}
      <div className={`absolute inset-0 flex items-center justify-center ${stage >= 1 ? 'animate-ping' : ''}`}>
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary opacity-30" />
      </div>

      {/* Particles */}
      {stage >= 2 && [...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random()}s`,
          }}
        >
          {i % 3 === 0 ? (
            <Star className="w-6 h-6 text-warning fill-warning animate-spin-slow" />
          ) : i % 3 === 1 ? (
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Zap className="w-5 h-5 text-secondary" />
          )}
        </div>
      ))}

      {/* Main content */}
      <div className={`text-center transition-all duration-700 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="relative inline-block mb-4">
          <Crown className="w-20 h-20 text-warning fill-warning animate-float mx-auto" />
          <div className="absolute inset-0 animate-ping">
            <Crown className="w-20 h-20 text-warning/50 mx-auto" />
          </div>
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl font-black text-gradient mb-2 animate-pulse">
          LEVEL UP!
        </h1>
        
        <div className={`transition-all duration-500 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <p className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">
            Level <span className="text-primary">{level}</span>
          </p>
          
          <div className={`flex items-center justify-center gap-2 ${stage >= 3 ? 'animate-bounce' : 'opacity-0'}`}>
            <Sparkles className="w-5 h-5 text-warning" />
            <span className="text-muted-foreground">New abilities unlocked!</span>
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraLevelUp;
