import React from 'react';
import { Star, Sparkles, Crown, Zap } from 'lucide-react';

interface LevelProgressRingProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  animated?: boolean;
}

const LevelProgressRing: React.FC<LevelProgressRingProps> = ({
  level,
  currentXP,
  requiredXP,
  size = 'md',
  showDetails = true,
  animated = true,
}) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const isMaxLevel = level >= 100;

  const sizes = {
    sm: { ring: 80, stroke: 6, level: 'text-xl', icon: 16 },
    md: { ring: 120, stroke: 8, level: 'text-3xl', icon: 24 },
    lg: { ring: 160, stroke: 10, level: 'text-4xl', icon: 32 },
  };

  const { ring, stroke, level: levelSize, icon } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getLevelTier = (lvl: number) => {
    if (lvl >= 80) return { name: 'Legend', color: 'from-amber-400 to-yellow-600', glow: 'shadow-amber-500/50' };
    if (lvl >= 60) return { name: 'Master', color: 'from-purple-400 to-violet-600', glow: 'shadow-purple-500/50' };
    if (lvl >= 40) return { name: 'Expert', color: 'from-blue-400 to-cyan-600', glow: 'shadow-blue-500/50' };
    if (lvl >= 20) return { name: 'Pro', color: 'from-green-400 to-emerald-600', glow: 'shadow-green-500/50' };
    return { name: 'Rookie', color: 'from-gray-400 to-slate-600', glow: 'shadow-gray-500/50' };
  };

  const tier = getLevelTier(level);

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Ring Container */}
      <div 
        className="relative"
        style={{ width: ring, height: ring }}
      >
        {/* Background Glow */}
        {animated && (
          <div 
            className={`absolute inset-0 rounded-full blur-xl opacity-30 ${tier.glow}`}
            style={{
              background: `conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)`,
              animation: 'spin 4s linear infinite',
            }}
          />
        )}

        {/* SVG Ring */}
        <svg width={ring} height={ring} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            className="opacity-30"
          />
          
          {/* Progress Ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isMaxLevel ? (
            <Crown 
              className="text-warning fill-warning mb-1" 
              style={{ width: icon, height: icon }}
            />
          ) : (
            <Star 
              className="text-primary fill-primary mb-1" 
              style={{ width: icon * 0.6, height: icon * 0.6 }}
            />
          )}
          <span className={`font-display font-black ${levelSize} bg-gradient-to-b ${tier.color} bg-clip-text text-transparent`}>
            {level}
          </span>
        </div>

        {/* Sparkle Effects */}
        {animated && progress > 80 && (
          <>
            <Sparkles 
              className="absolute top-0 right-0 text-warning animate-pulse"
              style={{ width: icon * 0.5, height: icon * 0.5 }}
            />
            <Zap 
              className="absolute bottom-0 left-0 text-primary animate-pulse"
              style={{ width: icon * 0.4, height: icon * 0.4, animationDelay: '0.5s' }}
            />
          </>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-3 text-center">
          <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
            {tier.name}
          </span>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{currentXP.toLocaleString()}</span>
            <span> / {requiredXP.toLocaleString()} XP</span>
          </div>
          <div className="mt-1 text-xs text-primary font-medium">
            {requiredXP - currentXP > 0 
              ? `${(requiredXP - currentXP).toLocaleString()} XP to next level`
              : 'Ready to level up!'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelProgressRing;
