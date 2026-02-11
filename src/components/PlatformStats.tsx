import React from 'react';
import { Gamepad2, Users, Trophy, Star } from 'lucide-react';

const stats = [
  { icon: Gamepad2, value: '50+', label: 'Games', color: 'text-primary' },
  { icon: Users, value: '10K+', label: 'Players', color: 'text-secondary' },
  { icon: Trophy, value: '1M+', label: 'Scores', color: 'text-warning' },
  { icon: Star, value: '4.8', label: 'Rating', color: 'text-success' },
];

const PlatformStats = () => (
  <div className="grid grid-cols-4 gap-3">
    {stats.map((s, i) => (
      <div key={i} className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
        <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
        <p className="font-display text-xl font-bold">{s.value}</p>
        <p className="text-xs text-muted-foreground">{s.label}</p>
      </div>
    ))}
  </div>
);

export default PlatformStats;
