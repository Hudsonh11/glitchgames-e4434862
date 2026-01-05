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
import SpaceInvaders from '@/components/games/SpaceInvaders';
import Asteroids from '@/components/games/Asteroids';
import DinoRun from '@/components/games/DinoRun';
import Game2048 from '@/components/games/Game2048';
import WordleGame from '@/components/games/WordleGame';
import HangmanGame from '@/components/games/HangmanGame';
import TicTacToe from '@/components/games/TicTacToe';
import ConnectFour from '@/components/games/ConnectFour';
import Minesweeper from '@/components/games/Minesweeper';
import SudokuGame from '@/components/games/SudokuGame';
import SimonSays from '@/components/games/SimonSays';
import WhackAMole from '@/components/games/WhackAMole';
import FruitSlice from '@/components/games/FruitSlice';
import CrossyRoad from '@/components/games/CrossyRoad';
import TempleRun from '@/components/games/TempleRun';
import DodgeBall from '@/components/games/DodgeBall';
import ColorMatch from '@/components/games/ColorMatch';
import WordSearch from '@/components/games/WordSearch';
import QuizGame from '@/components/games/QuizGame';
import Breakout from '@/components/games/Breakout';
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
  'space-invaders': { component: SpaceInvaders, title: 'Space Invaders' },
  'asteroids': { component: Asteroids, title: 'Asteroids' },
  'dino-run': { component: DinoRun, title: 'Dino Run' },
  '2048': { component: Game2048, title: '2048' },
  'wordle': { component: WordleGame, title: 'Wordle' },
  'hangman': { component: HangmanGame, title: 'Hangman' },
  'tic-tac-toe': { component: TicTacToe, title: 'Tic Tac Toe' },
  'connect-four': { component: ConnectFour, title: 'Connect Four' },
  'minesweeper': { component: Minesweeper, title: 'Minesweeper' },
  'sudoku': { component: SudokuGame, title: 'Sudoku' },
  'simon-says': { component: SimonSays, title: 'Simon Says' },
  'whack-a-mole': { component: WhackAMole, title: 'Whack-a-Mole' },
  'fruit-slice': { component: FruitSlice, title: 'Fruit Slice' },
  'crossy-road': { component: CrossyRoad, title: 'Crossy Road' },
  'temple-run': { component: TempleRun, title: 'Temple Run' },
  'dodge-ball': { component: DodgeBall, title: 'Dodge Ball' },
  'color-match': { component: ColorMatch, title: 'Color Match' },
  'word-search': { component: WordSearch, title: 'Word Search' },
  'quiz': { component: QuizGame, title: 'Quiz Challenge' },
  'breakout': { component: Breakout, title: 'Breakout' },
};

const Game: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, gamesShutdown, user, bannedUsers } = useGame();

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user && bannedUsers.includes(user.id)) return <Navigate to="/" />;
  if (gamesShutdown) return <Navigate to="/" />;

  const gameData = id ? games[id] : null;
  if (!gameData) return <Navigate to="/" />;

  const GameComponent = gameData.component;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="font-display text-2xl font-bold">{gameData.title}</h1>
          </div>
          <div className="flex justify-center"><GameComponent /></div>
        </div>
      </div>
    </div>
  );
};

export default Game;
