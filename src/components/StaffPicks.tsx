import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Star, Award } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  color: string;
}

const picks = [
  { gameId: 'roblox-obby', staffName: 'Dev Team', quote: '50 levels of pure 3D platforming. Our most ambitious game yet!' },
  { gameId: 'geometry-dash', staffName: 'Game Design', quote: 'Rhythm-based perfection. The feel and flow are unmatched.' },
  { gameId: 'chess', staffName: 'Strategy Lead', quote: 'Timeless. Our AI opponent is genuinely challenging.' },
];

const StaffPicks: React.FC<{ games: Game[] }> = ({ games }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Award className="w-5 h-5 text-warning" />
      <h3 className="font-display text-xl font-bold">Staff Picks</h3>
    </div>
    {picks.map((pick) => {
      const game = games.find(g => g.id === pick.gameId);
      if (!game) return null;
      return (
        <Link key={pick.gameId} to={`/game/${pick.gameId}`} className="group block">
          <div className="glass-panel rounded-xl p-4 flex gap-4 items-center transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url(${game.image})` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm group-hover:text-primary transition-colors">{game.title}</p>
              <p className="text-xs text-muted-foreground italic mt-1">"{pick.quote}"</p>
              <p className="text-[10px] text-primary mt-1 font-medium">— {pick.staffName}</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              {game.rating}
            </div>
          </div>
        </Link>
      );
    })}
  </div>
);

export default StaffPicks;
