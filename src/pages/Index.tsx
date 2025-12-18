import React from 'react';
import { Gamepad2, Zap, Trophy, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import GameCard from '@/components/GameCard';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';

const games = [
  {
    id: 'block-blast',
    title: 'Block Blast',
    description: 'Match and blast colorful blocks in this addictive puzzle game!',
    image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop',
    category: 'Puzzle',
    rating: 4.8,
    players: '12.5K',
    color: 'hsl(185, 100%, 50%)',
  },
  {
    id: 'clicker',
    title: 'Click Frenzy',
    description: 'Click your way to riches! Upgrade and automate your clicking empire.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
    category: 'Idle',
    rating: 4.6,
    players: '8.2K',
    color: 'hsl(45, 100%, 55%)',
  },
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    description: 'Jump and fly through danger in this rhythm-based action platformer!',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    category: 'Action',
    rating: 4.9,
    players: '25.1K',
    color: 'hsl(320, 100%, 60%)',
  },
  {
    id: 'racing',
    title: 'Neon Racer',
    description: 'Speed through neon-lit highways and dodge traffic in this endless racer!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    category: 'Racing',
    rating: 4.7,
    players: '15.8K',
    color: 'hsl(280, 100%, 60%)',
  },
  {
    id: 'pac-man',
    title: 'Pac-Man',
    description: 'Eat all the dots and avoid ghosts in this classic arcade adventure!',
    image: 'https://images.unsplash.com/photo-1579309401389-a2476dddf3d4?w=400&h=300&fit=crop',
    category: 'Arcade',
    rating: 4.9,
    players: '30.2K',
    color: 'hsl(45, 100%, 55%)',
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Grow your snake by eating food, but don\'t hit the walls or yourself!',
    image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400&h=300&fit=crop',
    category: 'Arcade',
    rating: 4.7,
    players: '18.3K',
    color: 'hsl(142, 76%, 50%)',
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack falling blocks to clear lines in this timeless puzzle classic!',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop',
    category: 'Puzzle',
    rating: 4.9,
    players: '35.7K',
    color: 'hsl(280, 100%, 60%)',
  },
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Test your memory by matching pairs of cards in the fewest moves!',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop',
    category: 'Puzzle',
    rating: 4.5,
    players: '9.1K',
    color: 'hsl(185, 100%, 50%)',
  },
  {
    id: 'flappy',
    title: 'Flappy Bird',
    description: 'Tap to fly through pipes in this challenging endless runner!',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    category: 'Arcade',
    rating: 4.6,
    players: '22.4K',
    color: 'hsl(45, 100%, 55%)',
  },
];

const Index: React.FC = () => {
  const { isLoggedIn, gamesShutdown } = useGame();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 animate-float">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Ultimate Gaming Hub</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6">
              <span className="text-gradient animate-glitch">GLITCH</span>
              <br />
              <span className="text-foreground">GAMES</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              Play the hottest mobile games, earn rewards, and compete with players worldwide. Your gaming journey starts here!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Button variant="gaming" size="xl" asChild>
                  <a href="#games">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Start Playing
                  </a>
                </Button>
              ) : (
                <Button variant="gaming" size="xl" asChild>
                  <Link to="/login">
                    <Zap className="w-5 h-5 mr-2" />
                    Join Now - It's Free!
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="xl" asChild>
                <Link to="/leaderboard">
                  <Trophy className="w-5 h-5 mr-2" />
                  View Leaderboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16">
            {[
              { value: '50K+', label: 'Players' },
              { value: '9', label: 'Games' },
              { value: '$10K', label: 'In Rewards' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
                <p className="font-display text-2xl md:text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maintenance Banner */}
      {gamesShutdown && (
        <div className="bg-destructive/20 border-y border-destructive/30 py-4 px-4">
          <div className="container mx-auto text-center">
            <p className="text-destructive font-bold">
              🔧 Games are temporarily unavailable for maintenance. Please check back soon!
            </p>
          </div>
        </div>
      )}

      {/* Games Section */}
      <section id="games" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Popular Games
              </h2>
              <p className="text-muted-foreground">
                Choose your adventure and start earning rewards!
              </p>
            </div>
            <Link to="/rewards">
              <Button variant="gold" className="gap-2">
                <Gift className="w-4 h-4" />
                Daily Rewards
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            Why Choose <span className="text-gradient">Glitch Games</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Compete & Win',
                description: 'Climb the leaderboards and prove you\'re the best. Weekly tournaments with real prizes!',
                color: 'text-warning',
              },
              {
                icon: Gift,
                title: 'Daily Rewards',
                description: 'Log in every day to claim free coins, gems, and exclusive items. Streaks unlock bigger rewards!',
                color: 'text-success',
              },
              {
                icon: Zap,
                title: 'Instant Play',
                description: 'No downloads needed! Play directly in your browser on any device, anytime.',
                color: 'text-primary',
              },
            ].map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-gradient">GLITCH GAMES</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Glitch Games. All rights reserved. Play responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
