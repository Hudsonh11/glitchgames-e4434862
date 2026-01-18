import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Puzzle, Gamepad2, Crosshair, Car, Brain, 
  MessageSquare, Dice1, Zap, Crown, Trophy 
} from 'lucide-react';
import UltraCard from './UltraCard';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

const categories: Category[] = [
  { id: 'puzzle', name: 'Puzzle', icon: Puzzle, color: 'hsl(185, 100%, 50%)', count: 12 },
  { id: 'arcade', name: 'Arcade', icon: Gamepad2, color: 'hsl(45, 100%, 55%)', count: 15 },
  { id: 'shooter', name: 'Shooter', icon: Crosshair, color: 'hsl(0, 100%, 55%)', count: 4 },
  { id: 'racing', name: 'Racing', icon: Car, color: 'hsl(280, 100%, 60%)', count: 2 },
  { id: 'brain', name: 'Brain', icon: Brain, color: 'hsl(320, 100%, 60%)', count: 6 },
  { id: 'word', name: 'Word', icon: MessageSquare, color: 'hsl(142, 76%, 50%)', count: 4 },
  { id: 'strategy', name: 'Strategy', icon: Crown, color: 'hsl(30, 80%, 50%)', count: 5 },
  { id: 'skill', name: 'Skill', icon: Zap, color: 'hsl(200, 100%, 50%)', count: 5 },
];

const GameCategories: React.FC = () => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.id}
            to={`/?category=${category.id}`}
            className="group"
          >
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl glass-panel hover:scale-105 transition-all duration-300">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: category.color }} />
              </div>
              <span className="text-xs font-semibold text-foreground">{category.name}</span>
              <span className="text-[10px] text-muted-foreground">{category.count} games</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default GameCategories;
