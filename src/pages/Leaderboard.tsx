import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Gamepad2, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/Navbar';
import Seo from '@/components/Seo';
import { useGame } from '@/contexts/GameContext';
import UltraParticles from '@/components/UltraParticles';
import UltraCard from '@/components/UltraCard';
import UltraRankDisplay from '@/components/UltraRankDisplay';
import UltraBadge from '@/components/UltraBadge';
import UltraAvatar from '@/components/UltraAvatar';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';

// All games with proper IDs matching the game components and Index.tsx
const games = [
  { id: '2048', name: '2048', category: 'Puzzle' },
  { id: 'asteroids', name: 'Asteroids', category: 'Shooter' },
  { id: 'ball-sort', name: 'Ball Sort', category: 'Puzzle' },
  { id: 'balloon-pop', name: 'Balloon Pop', category: 'Arcade' },
  { id: 'block-blast', name: 'Block Blast', category: 'Puzzle' },
  { id: 'block-blast-extreme', name: 'Block Blast Extreme', category: 'Puzzle' },
  { id: 'breakout', name: 'Breakout', category: 'Arcade' },
  { id: 'brick-breaker', name: 'Brick Breaker', category: 'Arcade' },
  { id: 'bubble-shooter', name: 'Bubble Shooter', category: 'Puzzle' },
  { id: 'catch', name: 'Catch Game', category: 'Arcade' },
  { id: 'checkers', name: 'Checkers', category: 'Board' },
  { id: 'chess', name: 'Chess', category: 'Board' },
  { id: 'clicker', name: 'Click Frenzy', category: 'Idle' },
  { id: 'coin-dash', name: 'Coin Dash', category: 'Arcade' },
  { id: 'color-match', name: 'Color Match', category: 'Brain' },
  { id: 'color-switch', name: 'Color Switch', category: 'Action' },
  { id: 'connect-four', name: 'Connect Four', category: 'Board' },
  { id: 'crossy-road', name: 'Crossy Road', category: 'Arcade' },
  { id: 'cube-runner', name: 'Cube Runner', category: 'Action' },
  { id: 'dino-run', name: 'Dino Run', category: 'Runner' },
  { id: 'dodge-ball', name: 'Dodge Ball', category: 'Arcade' },
  { id: 'doodle-jump', name: 'Doodle Jump', category: 'Arcade' },
  { id: 'flappy', name: 'Flappy Bird', category: 'Arcade' },
  { id: 'fruit-slice', name: 'Fruit Slice', category: 'Arcade' },
  { id: 'geometry-dash', name: 'Geometry Dash', category: 'Action' },
  { id: 'gravity-runner', name: 'Gravity Runner', category: 'Runner' },
  { id: 'hangman', name: 'Hangman', category: 'Word' },
  { id: 'helix-jump', name: 'Helix Jump', category: 'Arcade' },
  { id: 'hex-merge', name: 'Hex Merge', category: 'Puzzle' },
  { id: 'ice-slider', name: 'Ice Slider', category: 'Arcade' },
  { id: 'jigsaw', name: 'Jigsaw Puzzle', category: 'Puzzle' },
  { id: 'lights-out', name: 'Lights Out', category: 'Puzzle' },
  { id: 'match-3', name: 'Match-3 Mania', category: 'Puzzle' },
  { id: 'math-blitz', name: 'Math Blitz', category: 'Brain' },
  { id: 'maze', name: 'Maze Runner', category: 'Puzzle' },
  { id: 'memory', name: 'Memory Match', category: 'Puzzle' },
  { id: 'minesweeper', name: 'Minesweeper', category: 'Puzzle' },
  { id: 'nonogram', name: 'Nonogram', category: 'Puzzle' },
  { id: 'number-guess', name: 'Number Guess', category: 'Brain' },
  { id: 'pac-man', name: 'Pac-Man', category: 'Arcade' },
  { id: 'pattern-memory', name: 'Pattern Memory', category: 'Brain' },
  { id: 'pipe-connect', name: 'Pipe Connect', category: 'Puzzle' },
  { id: 'platform-jump', name: 'Platform Jump', category: 'Action' },
  { id: 'pong', name: 'Pong', category: 'Arcade' },
  { id: 'quiz', name: 'Quiz Challenge', category: 'Trivia' },
  { id: 'racing', name: 'Neon Racer', category: 'Racing' },
  { id: 'reaction', name: 'Reaction Test', category: 'Skill' },
  { id: 'roblox-obby', name: 'Roblox Obby', category: 'Action' },
  { id: 'rps', name: 'Rock Paper Scissors', category: 'Casual' },
  { id: 'simon-says', name: 'Simon Says', category: 'Brain' },
  { id: 'skeet-shoot', name: 'Skeet Shoot', category: 'Shooter' },
  { id: 'slime-volley', name: 'Slime Volley', category: 'Sports' },
  { id: 'snake', name: 'Snake', category: 'Arcade' },
  { id: 'solitaire', name: 'Solitaire', category: 'Card' },
  { id: 'space-invaders', name: 'Space Invaders', category: 'Shooter' },
  { id: 'spin-wheel', name: 'Spin Wheel', category: 'Casual' },
  { id: 'spot-difference', name: 'Spot Difference', category: 'Brain' },
  { id: 'stack-tower-3d', name: 'Stack Tower', category: 'Skill' },
  { id: 'sudoku', name: 'Sudoku', category: 'Puzzle' },
  { id: 'temple-run', name: 'Temple Run', category: 'Runner' },
  { id: 'tetris', name: 'Tetris', category: 'Puzzle' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', category: 'Board' },
  { id: 'tower-defense', name: 'Tower Defense', category: 'Strategy' },
  { id: 'tower-stack', name: 'Tower Stack', category: 'Skill' },
  { id: 'type-racer', name: 'Type Racer', category: 'Skill' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', category: 'Arcade' },
  { id: 'word-connect', name: 'Word Connect', category: 'Word' },
  { id: 'word-scramble', name: 'Word Scramble', category: 'Word' },
  { id: 'word-search', name: 'Word Search', category: 'Word' },
  { id: 'wordle', name: 'Wordle', category: 'Word' },
  // Multiplayer & Plus
  { id: 'find-match', name: 'Find Match', category: 'Multiplayer' },
  { id: 'crash-it', name: 'Crash It', category: 'Multiplayer' },
  { id: 'guess-the-person', name: 'Guess The Person', category: 'Plus' },
  { id: 'tanks', name: 'Tanks', category: 'Plus' },
  // New batch
  { id: 'aim-trainer', name: 'Aim Trainer', category: 'Skill' },
  { id: 'piano-tiles', name: 'Piano Tiles', category: 'Skill' },
  { id: 'sliding-puzzle', name: 'Sliding Puzzle', category: 'Puzzle' },
  { id: 'emoji-match', name: 'Emoji Match', category: 'Brain' },
  { id: 'falling-dodge', name: 'Falling Dodge', category: 'Arcade' },
  { id: 'color-rush', name: 'Color Rush', category: 'Brain' },
  { id: 'higher-lower', name: 'Higher or Lower', category: 'Casual' },
  { id: 'coin-miner', name: 'Coin Miner', category: 'Puzzle' },
  { id: 'meteor-shower', name: 'Meteor Shower', category: 'Shooter' },
  { id: 'ultra-blitz', name: 'Ultra Blitz', category: 'Plus' },
  { id: 'sand-cutting', name: 'Sand Cutting', category: 'ASMR' },
  { id: 'bubble-wrap', name: 'Bubble Wrap', category: 'ASMR' },
  { id: 'slime-squish', name: 'Slime Squish', category: 'ASMR' },
  { id: 'zen-garden', name: 'Zen Garden', category: 'ASMR' },
  { id: 'water-ripples', name: 'Water Ripples', category: 'ASMR' },
  { id: 'pressure-wash', name: 'Pressure Wash', category: 'ASMR' },
  { id: 'soap-carving', name: 'Soap Carving', category: 'Plus' },
  { id: 'tower-demolition', name: 'Tower Demolition', category: 'Destruction' },
  { id: 'glass-smash', name: 'Glass Smash', category: 'Destruction' },
  { id: 'reversi', name: 'Reversi', category: 'Strategy' },
  { id: 'cup-shuffle', name: 'Cup Shuffle', category: 'Skill' },
  { id: 'bomb-defuse', name: 'Bomb Defuse', category: 'Brain' },
  { id: 'ring-ball', name: 'Ring Ball', category: 'Arcade' },
];

const categories = ['All', ...Array.from(new Set(games.map(g => g.category))).sort()];

const Leaderboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState(games[0].id);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { leaderboard, user, fetchLeaderboard } = useGame();

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard(selectedGame).finally(() => setIsLoading(false));
  }, [selectedGame]);

  const filteredLeaderboard = leaderboard
    .filter(entry => entry.gameId === selectedGame)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  const filteredGames = games.filter(game => {
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedGameData = games.find(g => g.id === selectedGame);

  return (
    <div className="min-h-screen bg-background relative">
      <Seo
        title="Leaderboard — Top Players & Game Rankings | Glitch Games"
        description="See the top scores across 70+ Glitch Games. Filter by game and timeframe to track global rankings, weekly champions, and your personal best."
        path="/leaderboard"
      />
      <Navbar />
      <UltraParticles count={25} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-warning/30 to-amber-500/30 mb-4 animate-float relative">
              <Trophy className="w-10 h-10 text-warning" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning animate-pulse" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-gradient break-words">Global Leaderboard</h1>
            <p className="text-muted-foreground">Compete with players worldwide across all {games.length} games!</p>
          </div>

          {/* Search and Category Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Game Selection */}
          <ScrollArea className="h-32 mb-6">
            <div className="flex flex-wrap gap-2 justify-center p-2">
              {filteredGames.map((game) => (
                <Button
                  key={game.id}
                  variant={selectedGame === game.id ? 'gaming' : 'outline'}
                  onClick={() => setSelectedGame(game.id)}
                  size="sm"
                  className="text-xs"
                >
                  {game.name}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Current Game Badge */}
          {selectedGameData && (
            <div className="text-center mb-6">
              <UltraBadge variant="legendary" size="lg" animated>
                {selectedGameData.name} - {selectedGameData.category}
              </UltraBadge>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <UltraLoadingSpinner size="lg" text="Loading rankings..." />
            </div>
          ) : (
            <>
              {filteredLeaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8">
                  <div className="flex flex-col items-center">
                    <UltraAvatar src={filteredLeaderboard[1]?.avatar} size="lg" level={15} />
                    <p className="font-display font-bold text-sm mt-2">{filteredLeaderboard[1]?.username}</p>
                    <UltraBadge variant="common" size="sm">{filteredLeaderboard[1]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-20 h-24 rounded-t-lg bg-slate-600/30 flex items-center justify-center mt-3">
                      <span className="font-display text-3xl font-bold text-slate-300">2</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Crown className="w-10 h-10 text-warning mb-2 animate-float" />
                    <UltraAvatar src={filteredLeaderboard[0]?.avatar} size="xl" level={25} border="rainbow" />
                    <p className="font-display font-bold mt-2">{filteredLeaderboard[0]?.username}</p>
                    <UltraBadge variant="legendary" icon="trophy" size="md" animated>{filteredLeaderboard[0]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-24 h-32 rounded-t-lg bg-warning/20 flex items-center justify-center mt-3 border border-warning/50 shadow-neon-gold">
                      <span className="font-display text-4xl font-bold text-warning">1</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <UltraAvatar src={filteredLeaderboard[2]?.avatar} size="lg" level={12} />
                    <p className="font-display font-bold text-sm mt-2">{filteredLeaderboard[2]?.username}</p>
                    <UltraBadge variant="common" size="sm">{filteredLeaderboard[2]?.score.toLocaleString()}</UltraBadge>
                    <div className="w-20 h-20 rounded-t-lg bg-amber-800/30 flex items-center justify-center mt-3">
                      <span className="font-display text-3xl font-bold text-amber-600">3</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {filteredLeaderboard.length === 0 ? (
                  <UltraCard variant="glass" className="text-center py-12">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No scores yet. Be the first!</p>
                  </UltraCard>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <UltraRankDisplay
                      key={`${entry.username}-${index}`}
                      data={{
                        rank: index + 1,
                        username: entry.username,
                        avatar: entry.avatar,
                        score: entry.score,
                        isCurrentUser: entry.username === user?.username,
                        isPlus: entry.isPlus,
                      }}
                    />
                  ))

                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
