import React, { useState } from 'react';
import { Gamepad2, Puzzle, Zap, Target, Brain, Sword, Car, Sparkles, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

interface GameCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: Category[];
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'All Games', icon: <LayoutGrid className="w-4 h-4" />, count: 50, color: 'hsl(var(--primary))' },
  { id: 'puzzle', name: 'Puzzle', icon: <Puzzle className="w-4 h-4" />, count: 12, color: 'hsl(185, 100%, 50%)' },
  { id: 'arcade', name: 'Arcade', icon: <Gamepad2 className="w-4 h-4" />, count: 15, color: 'hsl(320, 100%, 60%)' },
  { id: 'action', name: 'Action', icon: <Zap className="w-4 h-4" />, count: 8, color: 'hsl(45, 100%, 55%)' },
  { id: 'strategy', name: 'Strategy', icon: <Target className="w-4 h-4" />, count: 6, color: 'hsl(200, 100%, 50%)' },
  { id: 'brain', name: 'Brain', icon: <Brain className="w-4 h-4" />, count: 5, color: 'hsl(280, 100%, 60%)' },
  { id: 'word', name: 'Word', icon: <Grid3X3 className="w-4 h-4" />, count: 4, color: 'hsl(142, 76%, 50%)' },
];

const GameCategoryFilter: React.FC<GameCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categories = defaultCategories,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      {/* Mobile View - Dropdown style */}
      <div className="md:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-2">
            {categories.find(c => c.id === selectedCategory)?.icon}
            {categories.find(c => c.id === selectedCategory)?.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {categories.find(c => c.id === selectedCategory)?.count} games
          </span>
        </Button>
        
        {isExpanded && (
          <div className="mt-2 p-2 rounded-xl border border-border bg-background shadow-lg animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategoryChange(category.id);
                    setIsExpanded(false);
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-muted/30 hover:bg-muted/50 border-transparent'
                  } border`}
                >
                  <span style={{ color: category.color }}>{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop View - Horizontal pills */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap group ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted/50 hover:bg-muted border border-border/50 hover:border-border'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${category.color}40` : undefined,
                }}
              >
                {/* Animated background for selected */}
                {isSelected && (
                  <div 
                    className="absolute inset-0 rounded-full opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${category.color}, transparent)`,
                    }}
                  />
                )}
                
                <span className={`relative z-10 transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {category.icon}
                </span>
                <span className="relative z-10 font-medium text-sm">{category.name}</span>
                <span className={`relative z-10 text-xs px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {category.count}
                </span>

                {/* Sparkle on hover */}
                {!isSelected && (
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameCategoryFilter;
