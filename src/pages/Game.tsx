import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import BlockBlast from '@/components/games/BlockBlast';
import ClickerGame from '@/components/games/ClickerGame';
import GeometryDash from '@/components/games/GeometryDash';
import RacingGame from '@/components/games/RacingGame';
import PacMan from '@/components/games/PacMan';
import SnakeGame from '@/components/games/SnakeGame';
import TetrisGame from '@/components/games/TetrisGame';
import MemoryGame from '@/components/games/MemoryGame';
import FlappyGame from '@/components/games/FlappyGame';
import MazeGame from '@/components/games/MazeGame';
import PongGame from '@/components/games/PongGame';
import BrickBreaker from '@/components/games/BrickBreaker';
import { useGame } from '@/contexts/GameContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const games: Record<string, { component: React.FC<any>; title: string }> = {
  'block-blast': { component: BlockBlast, title: 'Block Blast' },
  'clicker': { component: ClickerGame, title: 'Click Frenzy' },
  'geometry-dash': { component: GeometryDash, title: 'Geometry Dash' },
  'racing': { component: RacingGame, title: 'Neon Racer' },
  'pac-man': { component: PacMan, title: 'Pac-Man' },
  'snake': { component: SnakeGame, title: 'Snake' },
  'tetris': { component: TetrisGame, title: 'Tetris' },
  'memory': { component: MemoryGame, title: 'Memory Match' },
  'flappy': { component: FlappyGame, title: 'Flappy Bird' },
  'maze': { component: MazeGame, title: 'Maze Runner' },
  'pong': { component: PongGame, title: 'Pong' },
  'brick-breaker': { component: BrickBreaker, title: 'Brick Breaker' },
};

const Game: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, gamesShutdown, user, bannedUsers } = useGame();

  // Check if user is logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Check if user is banned
  if (user && bannedUsers.includes(user.id)) {
    return <Navigate to="/" />;
  }

  // Check if games are shut down
  if (gamesShutdown) {
    return <Navigate to="/" />;
  }

  // Check if game exists
  const gameData = id ? games[id] : null;
  
  if (!gameData) {
    return <Navigate to="/" />;
  }

  const GameComponent = gameData.component;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-bold">{gameData.title}</h1>
          </div>
          <div className="flex justify-center">
            <GameComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
