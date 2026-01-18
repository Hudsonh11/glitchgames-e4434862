import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UltraBadge from './UltraBadge';

interface FeaturedGameData {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  players: string;
  category: string;
  featured: string;
}

const featuredGames: FeaturedGameData[] = [
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    description: 'Jump and fly through danger in this rhythm-based action platformer! Test your reflexes and timing.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
    rating: 4.9,
    players: '25.1K',
    category: 'Action',
    featured: 'Most Popular',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack falling blocks to clear lines in this timeless puzzle classic that never gets old!',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800&h=400&fit=crop',
    rating: 4.9,
    players: '35.7K',
    category: 'Puzzle',
    featured: 'Editor\'s Choice',
  },
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries or less! A daily word puzzle that\'s taken the world by storm.',
    image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=800&h=400&fit=crop',
    rating: 4.9,
    players: '45.2K',
    category: 'Word',
    featured: 'Trending Now',
  },
];

const FeaturedGame: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const game = featuredGames[currentIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${game.image})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      
      {/* Content */}
      <div className={`relative p-8 md:p-12 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <UltraBadge variant="legendary" icon="sparkles">
              {game.featured}
            </UltraBadge>
            <UltraBadge variant="rare">{game.category}</UltraBadge>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {game.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 line-clamp-2">
            {game.description}
          </p>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-bold text-foreground">{game.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{game.players} playing</span>
            </div>
          </div>
          
          <Button variant="gaming" size="lg" asChild>
            <Link to={`/game/${game.id}`}>
              <Play className="w-5 h-5 mr-2" />
              Play Now
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-1">
          {featuredGames.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/50'
              }`}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setIsTransitioning(false);
                }, 300);
              }}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={nextSlide}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default FeaturedGame;
