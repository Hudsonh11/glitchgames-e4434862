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
import Solitaire from '@/components/games/Solitaire';
import Chess from '@/components/games/Chess';
import Checkers from '@/components/games/Checkers';
import BubbleShooter from '@/components/games/BubbleShooter';
import JigsawPuzzle from '@/components/games/JigsawPuzzle';
import SpinWheel from '@/components/games/SpinWheel';
import TypeRacer from '@/components/games/TypeRacer';
import ReactionTest from '@/components/games/ReactionTest';
import NumberGuess from '@/components/games/NumberGuess';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import CatchGame from '@/components/games/CatchGame';
import PlatformJump from '@/components/games/PlatformJump';
import TowerStack from '@/components/games/TowerStack';
import ColorSwitch from '@/components/games/ColorSwitch';
import PatternMemory from '@/components/games/PatternMemory';
import SpotDifference from '@/components/games/SpotDifference';
import MathBlitz from '@/components/games/MathBlitz';
import BlockBlastExtreme from '@/components/games/BlockBlastExtreme';
import { useGame } from '@/contexts/GameContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const games: Record<string, { component: React.FC<any>; title: string }> = {
  'block-blast': { component: BlockBlast, title: 'Block Blast' },
  'block-blast-extreme': { component: BlockBlastExtreme, title: 'Block Blast Extreme' },
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
  'solitaire': { component: Solitaire, title: 'Solitaire' },
  'chess': { component: Chess, title: 'Chess' },
  'checkers': { component: Checkers, title: 'Checkers' },
  'bubble-shooter': { component: BubbleShooter, title: 'Bubble Shooter' },
  'jigsaw': { component: JigsawPuzzle, title: 'Jigsaw Puzzle' },
  'spin-wheel': { component: SpinWheel, title: 'Spin Wheel' },
  'type-racer': { component: TypeRacer, title: 'Type Racer' },
  'reaction': { component: ReactionTest, title: 'Reaction Test' },
  'number-guess': { component: NumberGuess, title: 'Number Guess' },
  'rps': { component: RockPaperScissors, title: 'Rock Paper Scissors' },
  'catch': { component: CatchGame, title: 'Catch Game' },
  'platform-jump': { component: PlatformJump, title: 'Platform Jump' },
  'tower-stack': { component: TowerStack, title: 'Tower Stack' },
  'color-switch': { component: ColorSwitch, title: 'Color Switch' },
  'pattern-memory': { component: PatternMemory, title: 'Pattern Memory' },
  'spot-difference': { component: SpotDifference, title: 'Spot Difference' },
  'math-blitz': { component: MathBlitz, title: 'Math Blitz' },
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
