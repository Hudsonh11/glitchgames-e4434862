import React, { useState } from 'react';
import { Gamepad2, Zap, Trophy, Gift, Sparkles, Star, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import GameCard from '@/components/GameCard';
import Navbar from '@/components/Navbar';
import UltraParticles from '@/components/UltraParticles';
import UltraStatsCounter from '@/components/UltraStatsCounter';
import AnimatedHeroBanner from '@/components/AnimatedHeroBanner';
import GameCategoryFilter from '@/components/GameCategoryFilter';
import QuickPlayButton from '@/components/QuickPlayButton';
import DailyQuests from '@/components/DailyQuests';
import { useGame } from '@/contexts/GameContext';
const games = [
  { id: 'block-blast', title: 'Block Blast', description: 'Match and blast colorful blocks in this addictive puzzle game!', image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.8, players: '12.5K', color: 'hsl(185, 100%, 50%)' },
  { id: 'clicker', title: 'Click Frenzy', description: 'Click your way to riches! Upgrade and automate your clicking empire.', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', category: 'Idle', rating: 4.6, players: '8.2K', color: 'hsl(45, 100%, 55%)' },
  { id: 'geometry-dash', title: 'Geometry Dash', description: 'Jump and fly through danger in this rhythm-based action platformer!', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: 'Action', rating: 4.9, players: '25.1K', color: 'hsl(320, 100%, 60%)' },
  { id: 'racing', title: 'Neon Racer', description: 'Speed through neon-lit highways and dodge traffic!', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', category: 'Racing', rating: 4.7, players: '15.8K', color: 'hsl(280, 100%, 60%)' },
  { id: 'pac-man', title: 'Pac-Man', description: 'Eat all the dots and avoid ghosts in this classic arcade adventure!', image: 'https://images.unsplash.com/photo-1579309401389-a2476dddf3d4?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.9, players: '30.2K', color: 'hsl(45, 100%, 55%)' },
  { id: 'snake', title: 'Snake', description: "Grow your snake by eating food, but don't hit the walls!", image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: '18.3K', color: 'hsl(142, 76%, 50%)' },
  { id: 'tetris', title: 'Tetris', description: 'Stack falling blocks to clear lines in this timeless puzzle classic!', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.9, players: '35.7K', color: 'hsl(280, 100%, 60%)' },
  { id: 'memory', title: 'Memory Match', description: 'Test your memory by matching pairs of cards!', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.5, players: '9.1K', color: 'hsl(185, 100%, 50%)' },
  { id: 'flappy', title: 'Flappy Bird', description: 'Tap to fly through pipes in this challenging endless runner!', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.6, players: '22.4K', color: 'hsl(45, 100%, 55%)' },
  { id: 'space-invaders', title: 'Space Invaders', description: 'Defend Earth from alien invaders in this retro shooter!', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop', category: 'Shooter', rating: 4.8, players: '19.3K', color: 'hsl(200, 100%, 50%)' },
  { id: '2048', title: '2048', description: 'Merge tiles to reach 2048 in this addictive number puzzle!', image: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.8, players: '28.5K', color: 'hsl(30, 100%, 50%)' },
  { id: 'wordle', title: 'Wordle', description: 'Guess the 5-letter word in 6 tries or less!', image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=300&fit=crop', category: 'Word', rating: 4.9, players: '45.2K', color: 'hsl(142, 76%, 40%)' },
  { id: 'tic-tac-toe', title: 'Tic Tac Toe', description: 'Classic X and O game against a smart AI!', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.4, players: '15.6K', color: 'hsl(220, 100%, 60%)' },
  { id: 'connect-four', title: 'Connect Four', description: 'Drop discs and connect four to win!', image: 'https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.6, players: '12.8K', color: 'hsl(0, 100%, 50%)' },
  { id: 'minesweeper', title: 'Minesweeper', description: 'Clear the minefield without triggering any bombs!', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.7, players: '21.4K', color: 'hsl(0, 0%, 50%)' },
  { id: 'simon-says', title: 'Simon Says', description: 'Follow the pattern and test your memory!', image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop', category: 'Memory', rating: 4.5, players: '8.9K', color: 'hsl(120, 100%, 40%)' },
  { id: 'whack-a-mole', title: 'Whack-a-Mole', description: 'Whack as many moles as you can before time runs out!', image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.6, players: '14.2K', color: 'hsl(30, 80%, 45%)' },
  { id: 'fruit-slice', title: 'Fruit Slice', description: 'Slice fruits and avoid bombs in this fast-paced game!', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: '18.7K', color: 'hsl(350, 100%, 50%)' },
  { id: 'crossy-road', title: 'Crossy Road', description: 'Cross busy roads and rivers in this endless hopper!', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.8, players: '32.1K', color: 'hsl(100, 80%, 45%)' },
  { id: 'dino-run', title: 'Dino Run', description: 'Help the dinosaur jump over cacti and birds!', image: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=400&h=300&fit=crop', category: 'Runner', rating: 4.7, players: '26.8K', color: 'hsl(25, 90%, 55%)' },
  { id: 'quiz', title: 'Quiz Challenge', description: 'Test your knowledge with fun trivia questions!', image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&h=300&fit=crop', category: 'Trivia', rating: 4.6, players: '19.4K', color: 'hsl(260, 100%, 65%)' },
  { id: 'hangman', title: 'Hangman', description: 'Guess the word before the hangman is complete!', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop', category: 'Word', rating: 4.5, players: '11.3K', color: 'hsl(200, 80%, 50%)' },
  { id: 'color-match', title: 'Color Match', description: 'Quick! Does the word match its color?', image: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=400&h=300&fit=crop', category: 'Brain', rating: 4.4, players: '9.6K', color: 'hsl(330, 100%, 60%)' },
  { id: 'maze', title: 'Maze Runner', description: 'Navigate through challenging mazes to reach the goal!', image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.4, players: '7.8K', color: 'hsl(142, 76%, 50%)' },
  { id: 'pong', title: 'Pong', description: 'The classic paddle game! Beat the AI in this retro favorite.', image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop', category: 'Classic', rating: 4.5, players: '11.2K', color: 'hsl(185, 100%, 50%)' },
  { id: 'brick-breaker', title: 'Brick Breaker', description: 'Bounce the ball and break all the bricks!', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: '14.6K', color: 'hsl(320, 100%, 60%)' },
  { id: 'asteroids', title: 'Asteroids', description: 'Destroy asteroids and survive in space!', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop', category: 'Shooter', rating: 4.6, players: '13.5K', color: 'hsl(240, 80%, 60%)' },
  { id: 'sudoku', title: 'Sudoku', description: 'Fill the grid with numbers 1-9 without repeating!', image: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.7, players: '22.1K', color: 'hsl(210, 100%, 45%)' },
  { id: 'word-search', title: 'Word Search', description: 'Find all the hidden words in the grid!', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop', category: 'Word', rating: 4.4, players: '8.7K', color: 'hsl(170, 80%, 45%)' },
  { id: 'temple-run', title: 'Temple Run', description: 'Run, jump, and slide to escape the temple!', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', category: 'Runner', rating: 4.8, players: '29.3K', color: 'hsl(35, 90%, 50%)' },
  { id: 'dodge-ball', title: 'Dodge Ball', description: 'Dodge falling balls as long as you can!', image: 'https://images.unsplash.com/photo-1461896836934-adb67007e0cd?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.5, players: '10.2K', color: 'hsl(270, 100%, 60%)' },
  { id: 'breakout', title: 'Breakout', description: 'Break all the bricks with your ball and paddle!', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: '16.4K', color: 'hsl(0, 100%, 55%)' },
  { id: 'block-blast-extreme', title: 'Block Blast Extreme', description: 'An extreme version of Block Blast with combos and levels!', image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.9, players: '18.3K', color: 'hsl(320, 100%, 60%)' },
  { id: 'solitaire', title: 'Solitaire', description: 'Classic card game - arrange cards in descending order!', image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=300&fit=crop', category: 'Card', rating: 4.7, players: '22.1K', color: 'hsl(120, 70%, 40%)' },
  { id: 'chess', title: 'Chess', description: 'Strategic battle of minds - checkmate your opponent!', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.9, players: '35.6K', color: 'hsl(30, 20%, 30%)' },
  { id: 'checkers', title: 'Checkers', description: 'Classic board game - capture all opponent pieces!', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.6, players: '14.2K', color: 'hsl(0, 70%, 45%)' },
  { id: 'bubble-shooter', title: 'Bubble Shooter', description: 'Match and pop colorful bubbles!', image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.7, players: '19.8K', color: 'hsl(200, 100%, 50%)' },
  { id: 'jigsaw', title: 'Jigsaw Puzzle', description: 'Piece together beautiful images!', image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.5, players: '11.4K', color: 'hsl(260, 80%, 55%)' },
  { id: 'spin-wheel', title: 'Spin Wheel', description: 'Spin to win prizes and coins!', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop', category: 'Luck', rating: 4.4, players: '25.3K', color: 'hsl(45, 100%, 50%)' },
  { id: 'type-racer', title: 'Type Racer', description: 'Test your typing speed and accuracy!', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop', category: 'Skill', rating: 4.6, players: '16.7K', color: 'hsl(185, 100%, 45%)' },
  { id: 'reaction', title: 'Reaction Test', description: 'How fast are your reflexes?', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', category: 'Skill', rating: 4.5, players: '13.9K', color: 'hsl(0, 100%, 50%)' },
  { id: 'number-guess', title: 'Number Guess', description: 'Guess the secret number with hints!', image: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.3, players: '8.5K', color: 'hsl(270, 70%, 55%)' },
  { id: 'rps', title: 'Rock Paper Scissors', description: 'Classic hand game against AI!', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: 'Classic', rating: 4.4, players: '12.1K', color: 'hsl(150, 60%, 45%)' },
  { id: 'catch', title: 'Catch Game', description: 'Catch falling objects before they hit the ground!', image: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.5, players: '10.6K', color: 'hsl(35, 90%, 50%)' },
  { id: 'platform-jump', title: 'Platform Jump', description: 'Jump higher and higher on moving platforms!', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.6, players: '15.4K', color: 'hsl(140, 70%, 45%)' },
  { id: 'tower-stack', title: 'Tower Stack', description: 'Stack blocks to build the tallest tower!', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop', category: 'Skill', rating: 4.7, players: '17.2K', color: 'hsl(200, 80%, 50%)' },
  { id: 'color-switch', title: 'Color Switch', description: 'Match colors to pass through barriers!', image: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.6, players: '14.8K', color: 'hsl(280, 100%, 60%)' },
  { id: 'pattern-memory', title: 'Pattern Memory', description: 'Remember and repeat growing patterns!', image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&h=300&fit=crop', category: 'Memory', rating: 4.5, players: '9.3K', color: 'hsl(320, 80%, 55%)' },
  { id: 'spot-difference', title: 'Spot Difference', description: 'Find all the differences between two images!', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.4, players: '11.7K', color: 'hsl(170, 70%, 45%)' },
  { id: 'math-blitz', title: 'Math Blitz', description: 'Solve math problems as fast as you can!', image: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=400&h=300&fit=crop', category: 'Brain', rating: 4.5, players: '10.9K', color: 'hsl(220, 80%, 55%)' },
];

const Index: React.FC = () => {
  const { isLoggedIn, gamesShutdown } = useGame();

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      
      {/* ULTRA Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Floating Particles */}
        <UltraParticles count={30} />
        
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="ultra-orb ultra-orb-cyan w-[600px] h-[600px] -top-20 -left-40" />
          <div className="ultra-orb ultra-orb-magenta w-[500px] h-[500px] top-1/3 right-0 translate-x-1/2" />
          <div className="ultra-orb ultra-orb-purple w-[400px] h-[400px] bottom-0 left-1/3" />
        </div>

        {/* Animated Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel mb-8 animate-fade-in-up">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="w-5 h-5 text-primary opacity-50" />
                </div>
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">50 Premium Games</span>
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
                ))}
              </div>
            </div>
            
            {/* Main Title */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-in-up" 
              style={{ animationDelay: '0.1s' }}>
              <span className="text-gradient animate-glitch inline-block">GLITCH</span>
              <br />
              <span className="text-foreground relative inline-block">
                GAMES
                <Crown className="absolute -top-4 -right-8 w-8 h-8 text-warning fill-warning animate-float" />
              </span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}>
              Play the hottest games, earn <span className="text-warning font-semibold">epic rewards</span>, 
              and compete with players worldwide!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}>
              {isLoggedIn ? (
                <Button variant="gaming" size="xl" asChild className="group">
                  <a href="#games">
                    <Rocket className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12" />
                    Start Playing
                  </a>
                </Button>
              ) : (
                <Button variant="gaming" size="xl" asChild className="group animate-glow-pulse">
                  <Link to="/login">
                    <Zap className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                    Join Now - It's Free!
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="xl" asChild className="group border-primary/30 hover:border-primary hover:bg-primary/10">
                <Link to="/leaderboard">
                  <Trophy className="w-5 h-5 mr-2 text-warning transition-transform group-hover:scale-110" />
                  View Leaderboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20">
            <UltraStatsCounter value="50K+" label="Active Players" color="primary" />
            <UltraStatsCounter value="50" label="Premium Games" color="secondary" />
            <UltraStatsCounter value="$10K" label="In Rewards" color="warning" />
          </div>
        </div>
      </section>

      {/* Maintenance Banner */}
      {gamesShutdown && (
        <div className="bg-destructive/20 border-y border-destructive/30 py-4 px-4 backdrop-blur-sm">
          <div className="container mx-auto text-center">
            <p className="text-destructive font-bold">🔧 Games are temporarily unavailable for maintenance.</p>
          </div>
        </div>
      )}

      {/* Games Section */}
      <section id="games" className="py-20 px-4 relative">
        <UltraParticles count={15} className="opacity-50" />
        
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-primary" />
                All Games
              </h2>
              <p className="text-muted-foreground text-lg">Choose your adventure and start earning rewards!</p>
            </div>
            <Link to="/rewards">
              <Button variant="gold" size="lg" className="gap-2 group">
                <Gift className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Daily Rewards
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">NEW</span>
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <div 
                key={game.id} 
                className="animate-fade-in-up" 
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
              >
                <GameCard {...game} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />
        <UltraParticles count={10} className="opacity-30" />
        
        <div className="container mx-auto relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose <span className="text-gradient">Glitch Games</span>?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Experience gaming like never before with our premium platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Trophy, title: 'Compete & Win', description: 'Climb the leaderboards and prove you\'re the best!', color: 'warning' },
              { icon: Gift, title: 'Daily Rewards', description: 'Log in every day to claim free coins and gems!', color: 'success' },
              { icon: Zap, title: 'Instant Play', description: 'No downloads! Play directly in your browser.', color: 'primary' },
            ].map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="ultra-feature group">
                <div className={`w-16 h-16 rounded-2xl bg-${color}/10 flex items-center justify-center mb-5 
                  transition-all duration-500 group-hover:scale-110 group-hover:bg-${color}/20`}>
                  <Icon className={`w-8 h-8 text-${color}`} />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border relative">
        <div className="container mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <Gamepad2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-gradient">GLITCH GAMES</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Glitch Games. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-xs text-muted-foreground/50">Premium Gaming Experience</span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-xs text-muted-foreground/50">50+ Games</span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-xs text-muted-foreground/50">Free to Play</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
