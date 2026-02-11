import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Gift, Settings, User, Swords } from 'lucide-react';

const actions = [
  { to: '/', icon: Gamepad2, label: 'Play', color: 'text-primary' },
  { to: '/leaderboard', icon: Trophy, label: 'Rankings', color: 'text-warning' },
  { to: '/rewards', icon: Gift, label: 'Rewards', color: 'text-success' },
  { to: '/profile', icon: User, label: 'Profile', color: 'text-secondary' },
  { to: '/settings', icon: Settings, label: 'Settings', color: 'text-muted-foreground' },
];

const QuickActions = () => (
  <div className="grid grid-cols-5 gap-2">
    {actions.map((a) => (
      <Link
        key={a.to}
        to={a.to}
        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card transition-all group"
      >
        <a.icon className={`w-5 h-5 ${a.color} group-hover:scale-110 transition-transform`} />
        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">{a.label}</span>
      </Link>
    ))}
  </div>
);

export default QuickActions;
