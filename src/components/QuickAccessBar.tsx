import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Gift, User, Settings, Flame, Zap, Target, Star, Crown } from 'lucide-react';

const shortcuts = [
  { to: '/#games', icon: Gamepad2, label: 'All Games', color: 'text-primary', bg: 'bg-primary/10' },
  { to: '/leaderboard', icon: Trophy, label: 'Rankings', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/rewards', icon: Gift, label: 'Rewards', color: 'text-success', bg: 'bg-success/10' },
  { to: '/profile', icon: User, label: 'Profile', color: 'text-secondary', bg: 'bg-secondary/10' },
  { to: '/game/geometry-dash', icon: Zap, label: 'Geo Dash', color: 'text-accent', bg: 'bg-accent/10' },
  { to: '/game/roblox-obby', icon: Target, label: 'Obby', color: 'text-primary', bg: 'bg-primary/10' },
  { to: '/game/chess', icon: Crown, label: 'Chess', color: 'text-warning', bg: 'bg-warning/10' },
  { to: '/game/wordle', icon: Star, label: 'Wordle', color: 'text-success', bg: 'bg-success/10' },
];

const QuickAccessBar: React.FC = () => (
  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
    {shortcuts.map((s) => (
      <Link key={s.label} to={s.to}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
        <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
          <s.icon className={`w-6 h-6 ${s.color}`} />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">{s.label}</span>
      </Link>
    ))}
  </div>
);

export default QuickAccessBar;
