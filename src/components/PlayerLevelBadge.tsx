import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const getTier = (level: number) => {
  if (level >= 50) return { name: 'Legend', gradient: 'from-warning to-amber-600', glow: 'shadow-neon-gold' };
  if (level >= 30) return { name: 'Diamond', gradient: 'from-info to-cyan-400', glow: 'shadow-neon-cyan' };
  if (level >= 20) return { name: 'Platinum', gradient: 'from-primary to-secondary', glow: 'shadow-glow' };
  if (level >= 10) return { name: 'Gold', gradient: 'from-warning/80 to-yellow-600', glow: '' };
  if (level >= 5) return { name: 'Silver', gradient: 'from-slate-300 to-slate-500', glow: '' };
  return { name: 'Bronze', gradient: 'from-amber-700 to-amber-900', glow: '' };
};

const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };

const PlayerLevelBadge = ({ level, size = 'md' }: Props) => {
  const tier = getTier(level);
  return (
    <div className={cn(
      "rounded-lg flex items-center justify-center font-display font-bold bg-gradient-to-br text-white",
      `${tier.gradient} ${tier.glow}`,
      sizes[size]
    )}>
      {level}
    </div>
  );
};

export default PlayerLevelBadge;
