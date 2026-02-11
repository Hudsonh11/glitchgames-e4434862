import React from 'react';
import { Zap, Shield, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  selected: string;
  onChange: (difficulty: string) => void;
}

const difficulties = [
  { id: 'easy', label: 'Easy', icon: Shield, color: 'text-success', desc: 'Relaxed gameplay' },
  { id: 'medium', label: 'Normal', icon: Zap, color: 'text-warning', desc: 'Balanced challenge' },
  { id: 'hard', label: 'Hard', icon: Skull, color: 'text-destructive', desc: 'For experts' },
];

const GameDifficultySelector = ({ selected, onChange }: Props) => (
  <div className="flex gap-2">
    {difficulties.map((d) => (
      <Button
        key={d.id}
        variant={selected === d.id ? 'gaming' : 'outline'}
        size="sm"
        onClick={() => onChange(d.id)}
        className={cn("gap-1.5 text-xs", selected !== d.id && 'opacity-60')}
      >
        <d.icon className={cn("w-3.5 h-3.5", selected === d.id ? '' : d.color)} />
        {d.label}
      </Button>
    ))}
  </div>
);

export default GameDifficultySelector;
