import React from 'react';
import { Shield, Snowflake } from 'lucide-react';
import UltraCard from '@/components/UltraCard';
import UltraBadge from '@/components/UltraBadge';

interface Props {
  freezesAvailable: number;
  currentStreak: number;
}

const StreakFreezeShield = ({ freezesAvailable, currentStreak }: Props) => {
  if (currentStreak < 3) return null;

  return (
    <UltraCard variant="glass" className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-info/20">
        <Snowflake className="w-5 h-5 text-info" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Streak Freeze</p>
        <p className="text-xs text-muted-foreground">Protects your {currentStreak}-day streak if you miss a day</p>
      </div>
      <UltraBadge variant={freezesAvailable > 0 ? 'rare' : 'common'} size="sm">
        {freezesAvailable > 0 ? `${freezesAvailable} Active` : 'None'}
      </UltraBadge>
    </UltraCard>
  );
};

export default StreakFreezeShield;
