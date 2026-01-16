import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Gamepad2, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '@/components/Navbar';
import { useGame } from '@/contexts/GameContext';
import UltraParticles from '@/components/UltraParticles';
import UltraCard from '@/components/UltraCard';
import UltraRankDisplay from '@/components/UltraRankDisplay';
import UltraBadge from '@/components/UltraBadge';
import UltraAvatar from '@/components/UltraAvatar';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';

// All 50 games with proper IDs matching the game components
const games = [
  { id: 'block-blast', name: 'Block Blast', category: 'Puzzle' },
  { id: 'block-blast-extreme', name: 'Block Blast Extreme', category: 'Puzzle' },
  { id: 'clicker', name: 'Click Frenzy', category: 'Idle' },
  { id: 'geometry-dash', name: 'Geometry Dash', category: 'Action' },
  { id: 'tetris', name: 'Tetris', category: 'Puzzle' },
  { id: 'pac-man', name: 'Pac-Man', category: 'Arcade' },
  { id: 'snake', name: 'Snake', category: 'Arcade' },
  { id: 'memory', name: 'Memory Match', category: 'Puzzle' },
  { id: 'flappy', name: 'Flappy Bird', category: 'Arcade' },
  { id: 'space-invaders', name: 'Space Invaders', category: 'Shooter' },
  { id: '2048', name: '2048', category: 'Puzzle' },
  { id: 'racing', name: 'Neon Racer', category: 'Racing' },
  { id: 'pong', name: 'Pong', category: 'Arcade' },
  { id: 'breakout', name: 'Breakout', category: 'Arcade' },
  { id: 'brick-breaker', name: 'Brick Breaker', category: 'Arcade' },
  { id: 'asteroids', name: 'Asteroids', category: 'Shooter' },
  { id: 'bubble-shooter', name: 'Bubble Shooter', category: 'Puzzle' },
  { id: 'catch', name: 'Catch Game', category: 'Arcade' },
  { id: 'checkers', name: 'Checkers', category: 'Board' },
  { id: 'chess', name: 'Chess', category: 'Board' },
  { id: 'color-match', name: 'Color Match', category: 'Puzzle' },
  { id: 'color-switch', name: 'Color Switch', category: 'Action' },
  { id: 'connect-four', name: 'Connect Four', category: 'Board' },
  { id: 'crossy-road', name: 'Crossy Road', category: 'Arcade' },
  { id: 'dino-run', name: 'Dino Run', category: 'Arcade' },
  { id: 'dodge-ball', name: 'Dodge Ball', category: 'Action' },
  { id: 'fruit-slice', name: 'Fruit Slice', category: 'Action' },
  { id: 'hangman', name: 'Hangman', category: 'Word' },
  { id: 'jigsaw-puzzle', name: 'Jigsaw Puzzle', category: 'Puzzle' },
  { id: 'math-blitz', name: 'Math Blitz', category: 'Educational' },
  { id: 'maze', name: 'Maze Runner', category: 'Puzzle' },
  { id: 'minesweeper', name: 'Minesweeper', category: 'Puzzle' },
  { id: 'number-guess', name: 'Number Guess', category: 'Puzzle' },
  { id: 'pattern-memory', name: 'Pattern Memory', category: 'Puzzle' },
  { id: 'platform-jump', name: 'Platform Jump', category: 'Action' },
  { id: 'quiz', name: 'Quiz Game', category: 'Trivia' },
  { id: 'reaction-test', name: 'Reaction Test', category: 'Skill' },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', category: 'Casual' },
  { id: 'simon-says', name: 'Simon Says', category: 'Puzzle' },
  { id: 'solitaire', name: 'Solitaire', category: 'Card' },
  { id: 'spin-wheel', name: 'Spin Wheel', category: 'Casual' },
  { id: 'spot-difference', name: 'Spot Difference', category: 'Puzzle' },
  { id: 'sudoku', name: 'Sudoku', category: 'Puzzle' },
  { id: 'temple-run', name: 'Temple Run', category: 'Action' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', category: 'Board' },
  { id: 'tower-stack', name: 'Tower Stack', category: 'Skill' },
  { id: 'type-racer', name: 'Type Racer', category: 'Skill' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', category: 'Arcade' },
  { id: 'word-search', name: 'Word Search', category: 'Word' },
  { id: 'wordle', name: 'Wordle', category: 'Word' },
];

const categories = ['All', ...Array.from(new Set(games.map(g => g.category))).sort()];

const Leaderboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('block-blast');
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
      <Navbar />
      <UltraParticles count={25} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-warning/30 to-amber-500/30 mb-4 animate-float relative">
              <Trophy className="w-10 h-10 text-warning" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warning animate-pulse" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-2 text-gradient">Global Leaderboard</h1>
            <p className="text-muted-foreground">Compete with players worldwide across all 50 games!</p>
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
