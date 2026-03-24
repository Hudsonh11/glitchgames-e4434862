import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'Alex M.', avatar: '🎮', text: "Best gaming site ever! I'm addicted to the daily challenges.", rating: 5, game: 'Geometry Dash' },
  { name: 'Sarah K.', avatar: '👩‍💻', text: 'Love the variety of games. The leaderboard keeps me coming back!', rating: 5, game: 'Wordle' },
  { name: 'Marcus T.', avatar: '🏆', text: 'The Roblox Obby is insane! Such smooth controls now.', rating: 5, game: 'Roblox Obby' },
  { name: 'Elena R.', avatar: '⭐', text: 'Earning coins and gems while playing is genius. So rewarding!', rating: 4, game: 'Tetris' },
  { name: 'Jake P.', avatar: '🎯', text: "Clean UI, fast loading, tons of games. What's not to love?", rating: 5, game: 'Chess' },
  { name: 'Mia W.', avatar: '🌟', text: 'The season pass gives me a reason to play every single day.', rating: 5, game: 'Block Blast' },
];

const PlayerTestimonials: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {testimonials.map((t, i) => (
      <div key={i} className="glass-panel rounded-2xl p-5 relative group hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">{t.avatar}</div>
          <div>
            <p className="font-bold text-sm">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">Plays {t.game}</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {[...Array(t.rating)].map((_, j) => (
              <Star key={j} className="w-3 h-3 text-warning fill-warning" />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
      </div>
    ))}
  </div>
);

export default PlayerTestimonials;
