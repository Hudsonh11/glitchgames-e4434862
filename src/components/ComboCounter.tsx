import React, { useState, useEffect } from 'react';
import { Flame, Zap, Star, Sparkles } from 'lucide-react';

interface ComboCounterProps {
  combo: number;
  maxCombo?: number;
  multiplier?: number;
  onComboBreak?: () => void;
}

const ComboCounter: React.FC<ComboCounterProps> = ({
  combo,
  maxCombo = 0,
  multiplier = 1,
  onComboBreak,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCombo, setPrevCombo] = useState(combo);
  const [showBreak, setShowBreak] = useState(false);

  useEffect(() => {
    if (combo > prevCombo) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    } else if (combo < prevCombo && prevCombo > 0) {
      setShowBreak(true);
      onComboBreak?.();
      const timer = setTimeout(() => setShowBreak(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevCombo(combo);
  }, [combo, prevCombo, onComboBreak]);

  const getComboTier = (c: number) => {
    if (c >= 50) return { name: 'LEGENDARY', color: 'from-amber-400 to-orange-600', icon: <Star className="w-6 h-6 fill-current" />, shake: true };
    if (c >= 30) return { name: 'INSANE', color: 'from-purple-400 to-pink-600', icon: <Sparkles className="w-6 h-6" />, shake: true };
    if (c >= 15) return { name: 'ON FIRE', color: 'from-orange-400 to-red-600', icon: <Flame className="w-6 h-6" />, shake: false };
    if (c >= 5) return { name: 'COMBO', color: 'from-blue-400 to-cyan-600', icon: <Zap className="w-6 h-6" />, shake: false };
    return { name: '', color: 'from-gray-400 to-gray-600', icon: null, shake: false };
  };

  const tier = getComboTier(combo);

  if (combo === 0 && !showBreak) return null;

  return (
    <div className="relative">
      {/* Combo Break Animation */}
      {showBreak && prevCombo > 5 && (
        <div className="absolute inset-0 flex items-center justify-center animate-fade-out pointer-events-none">
          <div className="text-destructive font-display text-2xl font-black animate-scale-in">
            COMBO BREAK!
          </div>
        </div>
      )}

      {/* Main Counter */}
      {combo > 0 && (
        <div 
          className={`relative inline-flex flex-col items-center transition-all duration-200 ${
            isAnimating ? 'scale-125' : 'scale-100'
          } ${tier.shake ? 'animate-shake' : ''}`}
        >
          {/* Glow Background */}
          <div 
            className={`absolute inset-0 blur-2xl opacity-40 rounded-full bg-gradient-to-r ${tier.color}`}
            style={{ transform: 'scale(1.5)' }}
          />

          {/* Counter Box */}
          <div className={`relative px-6 py-3 rounded-2xl bg-gradient-to-br ${tier.color} shadow-2xl`}>
            {/* Inner Glow */}
            <div className="absolute inset-0 rounded-2xl bg-white/20" />
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              {tier.icon && (
                <div className={`text-white ${combo >= 30 ? 'animate-bounce' : ''}`}>
                  {tier.icon}
                </div>
              )}
              
              <div className="text-center">
                {tier.name && (
                  <div className="text-xs font-bold text-white/80 tracking-wider mb-0.5">
                    {tier.name}
                  </div>
                )}
                <div className="font-display text-4xl font-black text-white drop-shadow-lg">
                  x{combo}
                </div>
              </div>

              {/* Multiplier */}
              {multiplier > 1 && (
                <div className="px-2 py-1 rounded-lg bg-white/20 text-white text-sm font-bold">
                  {multiplier.toFixed(1)}x
                </div>
              )}
            </div>

            {/* Particle Effects */}
            {combo >= 15 && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: `${1 + Math.random()}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Max Combo Indicator */}
          {combo === maxCombo && maxCombo > 10 && (
            <div className="mt-2 px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-bold animate-pulse">
              🏆 BEST COMBO!
            </div>
          )}
        </div>
      )}

      {/* Add shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          75% { transform: translateX(2px) rotate(1deg); }
        }
        .animate-shake {
          animation: shake 0.15s infinite;
        }
      `}</style>
    </div>
  );
};

export default ComboCounter;
