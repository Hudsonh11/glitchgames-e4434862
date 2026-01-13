import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
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
import UltraParticles from '@/components/UltraParticles';
import UltraBadge from '@/components/UltraBadge';
import UltraLoadingSpinner from '@/components/UltraLoadingSpinner';
import GamePauseMenu from '@/components/GamePauseMenu';

const games: Record<string, { component: React.FC<any>; title: string; category: string }> = {
  'block-blast': { component: BlockBlast, title: 'Block Blast', category: 'Puzzle' },
  'block-blast-extreme': { component: BlockBlastExtreme, title: 'Block Blast Extreme', category: 'Puzzle' },
  'clicker': { component: ClickerGame, title: 'Click Frenzy', category: 'Idle' },
  'geometry-dash': { component: GeometryDash, title: 'Geometry Dash', category: 'Action' },
  'racing': { component: RacingGame, title: 'Neon Racer', category: 'Racing' },
  'pac-man': { component: PacMan, title: 'Pac-Man', category: 'Arcade' },
  'snake': { component: SnakeGame, title: 'Snake', category: 'Arcade' },
  'tetris': { component: TetrisGame, title: 'Tetris', category: 'Puzzle' },
  'memory': { component: MemoryGame, title: 'Memory Match', category: 'Puzzle' },
  'flappy': { component: FlappyGame, title: 'Flappy Bird', category: 'Arcade' },
  'maze': { component: MazeGame, title: 'Maze Runner', category: 'Puzzle' },
  'pong': { component: PongGame, title: 'Pong', category: 'Classic' },
  'brick-breaker': { component: BrickBreaker, title: 'Brick Breaker', category: 'Arcade' },
  'space-invaders': { component: SpaceInvaders, title: 'Space Invaders', category: 'Shooter' },
  'asteroids': { component: Asteroids, title: 'Asteroids', category: 'Shooter' },
  'dino-run': { component: DinoRun, title: 'Dino Run', category: 'Runner' },
  '2048': { component: Game2048, title: '2048', category: 'Puzzle' },
  'wordle': { component: WordleGame, title: 'Wordle', category: 'Word' },
  'hangman': { component: HangmanGame, title: 'Hangman', category: 'Word' },
  'tic-tac-toe': { component: TicTacToe, title: 'Tic Tac Toe', category: 'Strategy' },
  'connect-four': { component: ConnectFour, title: 'Connect Four', category: 'Strategy' },
  'minesweeper': { component: Minesweeper, title: 'Minesweeper', category: 'Puzzle' },
  'sudoku': { component: SudokuGame, title: 'Sudoku', category: 'Puzzle' },
  'simon-says': { component: SimonSays, title: 'Simon Says', category: 'Memory' },
  'whack-a-mole': { component: WhackAMole, title: 'Whack-a-Mole', category: 'Arcade' },
  'fruit-slice': { component: FruitSlice, title: 'Fruit Slice', category: 'Arcade' },
  'crossy-road': { component: CrossyRoad, title: 'Crossy Road', category: 'Arcade' },
  'temple-run': { component: TempleRun, title: 'Temple Run', category: 'Runner' },
  'dodge-ball': { component: DodgeBall, title: 'Dodge Ball', category: 'Arcade' },
  'color-match': { component: ColorMatch, title: 'Color Match', category: 'Brain' },
  'word-search': { component: WordSearch, title: 'Word Search', category: 'Word' },
  'quiz': { component: QuizGame, title: 'Quiz Challenge', category: 'Trivia' },
  'breakout': { component: Breakout, title: 'Breakout', category: 'Arcade' },
  'solitaire': { component: Solitaire, title: 'Solitaire', category: 'Card' },
  'chess': { component: Chess, title: 'Chess', category: 'Strategy' },
  'checkers': { component: Checkers, title: 'Checkers', category: 'Strategy' },
  'bubble-shooter': { component: BubbleShooter, title: 'Bubble Shooter', category: 'Puzzle' },
  'jigsaw': { component: JigsawPuzzle, title: 'Jigsaw Puzzle', category: 'Puzzle' },
  'spin-wheel': { component: SpinWheel, title: 'Spin Wheel', category: 'Luck' },
  'type-racer': { component: TypeRacer, title: 'Type Racer', category: 'Skill' },
  'reaction': { component: ReactionTest, title: 'Reaction Test', category: 'Skill' },
  'number-guess': { component: NumberGuess, title: 'Number Guess', category: 'Puzzle' },
  'rps': { component: RockPaperScissors, title: 'Rock Paper Scissors', category: 'Classic' },
  'catch': { component: CatchGame, title: 'Catch Game', category: 'Arcade' },
  'platform-jump': { component: PlatformJump, title: 'Platform Jump', category: 'Arcade' },
  'tower-stack': { component: TowerStack, title: 'Tower Stack', category: 'Skill' },
  'color-switch': { component: ColorSwitch, title: 'Color Switch', category: 'Arcade' },
  'pattern-memory': { component: PatternMemory, title: 'Pattern Memory', category: 'Memory' },
  'spot-difference': { component: SpotDifference, title: 'Spot Difference', category: 'Puzzle' },
  'math-blitz': { component: MathBlitz, title: 'Math Blitz', category: 'Brain' },
};

const Game: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, isLoading, gamesShutdown, user, bannedUsers, gameStats } = useGame();
  const [isPaused, setIsPaused] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <UltraLoadingSpinner size="lg" text="Loading game..." />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user && bannedUsers.includes(user.id)) return <Navigate to="/" />;
  if (gamesShutdown) return <Navigate to="/" />;

  const gameData = id ? games[id] : null;
  if (!gameData) return <Navigate to="/" />;

  const GameComponent = gameData.component;
  const stats = id && gameStats[id];

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <UltraParticles count={10} />
      
      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{gameData.title}</h1>
                  <UltraBadge variant="rare" size="sm">{gameData.category}</UltraBadge>
                </div>
                {stats && (
                  <p className="text-sm text-muted-foreground">
                    High Score: <span className="text-primary font-bold">{stats.highScore.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center rounded-2xl overflow-hidden border border-border bg-card p-4">
            <GameComponent />
          </div>

          <GamePauseMenu isOpen={isPaused} onResume={() => setIsPaused(false)} onRestart={() => window.location.reload()} onQuit={() => {}} score={0} />
        </div>
      </div>
    </div>
  );
};

export default Game;
