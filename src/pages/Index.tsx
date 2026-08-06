import React, { useState, useMemo, useEffect } from 'react';
import { 
  Gamepad2, Zap, Trophy, Gift, Sparkles, Star, Crown, Rocket, Heart, 
  TrendingUp, Users, Clock, Target, Flame, Play, Shield, Gem, Award,
  Search, ChevronRight, ChevronDown, ArrowRight, Eye, Swords, Timer, Layers,
  Compass, BarChart3, Globe, Headphones, MessageSquare, BookOpen,
  Newspaper, Quote, Palette, Music, Cpu, Map, Crosshair, Dices
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import GameCard from '@/components/GameCard';
import Seo from '@/components/Seo';
import Navbar from '@/components/Navbar';
import UltraParticles from '@/components/UltraParticles';
import UltraStatsCounter from '@/components/UltraStatsCounter';
import GameOfTheDay from '@/components/GameOfTheDay';
import TrendingGames from '@/components/TrendingGames';
import WelcomeBack from '@/components/WelcomeBack';
import LivePlayerCount from '@/components/LivePlayerCount';
import MiniLeaderboard from '@/components/MiniLeaderboard';
import QuickPlayButton from '@/components/QuickPlayButton';
import ScrollToTop from '@/components/ScrollToTop';
import TipOfTheDay from '@/components/TipOfTheDay';
import PlatformStats from '@/components/PlatformStats';
import Footer from '@/components/Footer';
import Announcements from '@/components/Announcements';
import RecentWinners from '@/components/RecentWinners';
import DailyQuests from '@/components/DailyQuests';
import WeeklyChallenge from '@/components/WeeklyChallenge';
import AchievementShowcase from '@/components/AchievementShowcase';
import SeasonPass from '@/components/SeasonPass';
import FriendActivityFeed from '@/components/FriendActivityFeed';
import QuickStats from '@/components/QuickStats';
import SearchGames from '@/components/SearchGames';
import AnimatedHeroBanner from '@/components/AnimatedHeroBanner';
import Countdown from '@/components/Countdown';
import MilestoneTracker from '@/components/MilestoneTracker';
import StatsOverview from '@/components/StatsOverview';
import PopularNow from '@/components/PopularNow';
import GameShowcase from '@/components/GameShowcase';
import QuickPlayCarousel from '@/components/QuickPlayCarousel';
import PlayerTestimonials from '@/components/PlayerTestimonials';
import GenreSpotlight from '@/components/GenreSpotlight';
import GamingNews from '@/components/GamingNews';
import QuickAccessBar from '@/components/QuickAccessBar';
import StaffPicks from '@/components/StaffPicks';
import DailyBonus from '@/components/DailyBonus';
import { useGame } from '@/contexts/GameContext';
import { Progress } from '@/components/ui/progress';
import { getCurrentSeason } from '@/lib/season';
const __SEASON__ = getCurrentSeason();

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
  { id: 'balloon-pop', title: 'Balloon Pop', description: 'Pop as many balloons as you can before time runs out!', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.6, players: '11.2K', color: 'hsl(350, 90%, 60%)' },
  { id: 'pipe-connect', title: 'Pipe Connect', description: 'Rotate pipes to connect the water flow!', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.5, players: '9.4K', color: 'hsl(200, 70%, 50%)' },
  { id: 'lights-out', title: 'Lights Out', description: 'Turn off all the lights by toggling them!', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.4, players: '7.8K', color: 'hsl(45, 90%, 50%)' },
  { id: 'word-scramble', title: 'Word Scramble', description: 'Unscramble letters to find the hidden word!', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop', category: 'Word', rating: 4.6, players: '12.5K', color: 'hsl(160, 70%, 45%)' },
  { id: 'coin-dash', title: 'Coin Dash', description: 'Collect coins and dodge enemies in this fast-paced action game!', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: '14.3K', color: 'hsl(45, 100%, 50%)' },
  { id: 'skeet-shoot', title: 'Skeet Shoot', description: 'Aim and shoot flying targets for points!', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop', category: 'Skill', rating: 4.5, players: '10.1K', color: 'hsl(15, 85%, 55%)' },
  { id: 'hex-merge', title: 'Hex Merge', description: 'Merge tiles on a hex grid to reach the highest number!', image: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.6, players: '11.8K', color: 'hsl(280, 80%, 55%)' },
  { id: 'gravity-runner', title: 'Gravity Runner', description: 'Flip gravity to dodge obstacles in space!', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop', category: 'Runner', rating: 4.8, players: '16.9K', color: 'hsl(185, 90%, 45%)' },
  { id: 'ice-slider', title: 'Ice Slider', description: 'Slide on ice to reach the goal - plan your moves!', image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.5, players: '8.9K', color: 'hsl(195, 80%, 60%)' },
  { id: 'roblox-obby', title: 'Roblox Obby', description: '3D obstacle course with 50 levels! Jump, dodge, and conquer!', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: '3D', rating: 4.9, players: '42.7K', color: 'hsl(140, 80%, 50%)' },
  { id: 'stack-tower-3d', title: 'Stack Tower', description: 'Tap to drop blocks and build the tallest tower! NEW!', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop', category: 'Skill', rating: 4.8, players: 'NEW', color: 'hsl(185, 100%, 50%)' },
  { id: 'helix-jump', title: 'Helix Jump', description: 'Bounce a ball through a spinning tower without hitting red zones! NEW!', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.9, players: 'NEW', color: 'hsl(45, 100%, 55%)' },
  { id: 'cube-runner', title: 'Cube Runner', description: 'Dodge red blocks and grab gold coins on a neon highway! NEW!', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: 'Runner', rating: 4.8, players: 'NEW', color: 'hsl(280, 100%, 60%)' },
  { id: 'doodle-jump', title: 'Doodle Jump', description: 'Bounce up endless platforms — watch out for broken ones! NEW!', image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.7, players: 'NEW', color: 'hsl(142, 76%, 50%)' },
  { id: 'ball-sort', title: 'Ball Sort', description: 'Sort the colored balls into matching tubes — relaxing brain teaser! NEW!', image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.8, players: 'NEW', color: 'hsl(185, 100%, 50%)' },
  { id: 'match-3', title: 'Match-3 Mania', description: 'Swap fruits to make matches of three or more in this satisfying classic! NEW!', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.7, players: 'NEW', color: 'hsl(320, 100%, 60%)' },
  { id: 'nonogram', title: 'Nonogram', description: 'Solve picture logic puzzles using number clues — for the puzzle pros! NEW!', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.6, players: 'NEW', color: 'hsl(280, 100%, 60%)' },
  { id: 'word-connect', title: 'Word Connect', description: 'Connect letters to form every hidden word — vocabulary challenge! NEW!', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop', category: 'Word', rating: 4.7, players: 'NEW', color: 'hsl(45, 100%, 55%)' },
  { id: 'slime-volley', title: 'Slime Volley', description: 'Bounce the ball over the net in this addictive slime volleyball duel! NEW!', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop', category: 'Sports', rating: 4.8, players: 'NEW', color: 'hsl(200, 100%, 50%)' },
  { id: 'tower-defense', title: 'Tower Defense', description: 'Place towers and defend against waves of enemies — strategy at its best! NEW!', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.9, players: 'NEW', color: 'hsl(220, 100%, 55%)' },
  { id: 'find-match', title: 'Find Match', description: 'Spot the matching object before your opponent — 1v1 vs bot or a friend on split screen! First to 10 wins. NEW!', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop', category: 'Multiplayer', rating: 4.9, players: 'NEW', color: 'hsl(320, 100%, 60%)' },
  { id: 'guess-the-person', title: 'Guess The Person', description: 'Ask yes/no questions to guess your opponent\'s character first. Plus exclusive. NEW!', image: 'https://images.unsplash.com/photo-1531256456869-ce942a665e80?w=400&h=300&fit=crop', category: 'Plus', rating: 5.0, players: 'PLUS', color: 'hsl(45, 100%, 55%)' },
  { id: 'crash-it', title: 'Crash It', description: 'Smash your wheels into your opponent\'s exposed head. Physics-based 1v1 vs bot or friend on split controls. First to 5 wins. NEW!', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop', category: 'Multiplayer', rating: 4.9, players: 'NEW', color: 'hsl(0, 100%, 60%)' },
  { id: 'tanks', title: 'Tanks', description: 'Top-down 2D tank duel with ricocheting bullets. 2 players on one device or vs bot. Plus exclusive. NEW!', image: 'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=400&h=300&fit=crop', category: 'Plus', rating: 4.9, players: 'NEW', color: 'hsl(210, 90%, 55%)' },
  { id: 'aim-trainer', title: 'Aim Trainer', description: 'Click targets as fast as possible — sharpen your reflexes in 30 seconds!', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', category: 'Skill', rating: 4.7, players: 'NEW', color: 'hsl(0, 90%, 55%)' },
  { id: 'piano-tiles', title: 'Piano Tiles', description: 'Tap the falling tiles in rhythm — miss one and it\'s game over!', image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop', category: 'Skill', rating: 4.8, players: 'NEW', color: 'hsl(240, 15%, 25%)' },
  { id: 'sliding-puzzle', title: 'Sliding Puzzle', description: 'Classic 15-puzzle — slide tiles to restore the order in minimum moves.', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.6, players: 'NEW', color: 'hsl(200, 80%, 55%)' },
  { id: 'emoji-match', title: 'Emoji Match', description: 'Flip cards to find every emoji pair — how few moves can you do it in?', image: 'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=400&h=300&fit=crop', category: 'Brain', rating: 4.7, players: 'NEW', color: 'hsl(45, 100%, 60%)' },
  { id: 'falling-dodge', title: 'Falling Dodge', description: 'Slide left and right to dodge falling blocks — how long can you survive?', image: 'https://images.unsplash.com/photo-1503437313881-503a91226402?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.8, players: 'NEW', color: 'hsl(0, 100%, 60%)' },
  { id: 'color-rush', title: 'Color Rush', description: 'Read the word, ignore the color — brain-bending Stroop-effect speed round!', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop', category: 'Brain', rating: 4.7, players: 'NEW', color: 'hsl(320, 100%, 60%)' },
  { id: 'higher-lower', title: 'Higher or Lower', description: 'Guess if the next card is higher or lower — build the longest streak!', image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=300&fit=crop', category: 'Casual', rating: 4.6, players: 'NEW', color: 'hsl(140, 70%, 50%)' },
  { id: 'coin-miner', title: 'Coin Miner', description: 'Reveal squares to grab coins and gems — avoid the bombs!', image: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=400&h=300&fit=crop', category: 'Puzzle', rating: 4.7, players: 'NEW', color: 'hsl(50, 95%, 55%)' },
  { id: 'meteor-shower', title: 'Meteor Shower', description: 'Blast incoming meteors before they hit the ground — twice each to destroy!', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop', category: 'Shooter', rating: 4.8, players: 'NEW', color: 'hsl(20, 100%, 55%)' },
  { id: 'ultra-blitz', title: 'Ultra Blitz', description: 'Bullet-hell survival with escalating chaos — Glitch Games Plus exclusive! NEW!', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', category: 'Plus', rating: 5.0, players: 'PLUS', color: 'hsl(280, 100%, 60%)' },
  { id: 'sand-cutting', title: 'Kinetic Sand Cutting', description: 'Glide the knife through soft kinetic sand — endless satisfying slices. NEW!', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(28, 70%, 60%)' },
  { id: 'bubble-wrap', title: 'Bubble Wrap', description: 'Pop an endless sheet of bubble wrap with layered pop sounds. NEW!', image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(190, 85%, 60%)' },
  { id: 'slime-squish', title: 'Slime Squish', description: 'Press, stretch and squish a soft-body slime blob with real spring physics. NEW!', image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(150, 80%, 55%)' },
  { id: 'zen-garden', title: 'Zen Garden', description: 'Rake calming ripples into the sand and place stones. No timer, no fail. NEW!', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(40, 40%, 70%)' },
  { id: 'water-ripples', title: 'Water Ripples', description: 'Drop water and hear generative chimes as ripples spread. NEW!', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(195, 90%, 60%)' },
  { id: 'pressure-wash', title: 'Pressure Wash', description: 'Blast grime off brick, stone and wood until it gleams 100%. NEW!', image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop', category: 'ASMR', rating: 4.8, players: 'NEW', color: 'hsl(205, 70%, 55%)' },
  { id: 'soap-carving', title: 'Soap Carving', description: 'Carve hidden shapes out of scented soap blocks — Glitch Games Plus exclusive! NEW!', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop', category: 'Plus', rating: 4.8, players: 'PLUS', color: 'hsl(320, 70%, 65%)' },
  { id: 'tower-demolition', title: 'Tower Demolition', description: 'Swing a wrecking ball and bring whole buildings crashing down in physics glory. NEW!', image: 'https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=400&h=300&fit=crop', category: 'Destruction', rating: 4.8, players: 'NEW', color: 'hsl(20, 90%, 55%)' },
  { id: 'glass-smash', title: 'Glass Smash', description: 'Crack and shatter panes of glass into flying shards for combo points. NEW!', image: 'https://images.unsplash.com/photo-1439337153520-7082a56a81f4?w=400&h=300&fit=crop', category: 'Destruction', rating: 4.8, players: 'NEW', color: 'hsl(180, 90%, 60%)' },
  { id: 'reversi', title: 'Reversi', description: 'Outflank the bot and flip its discs in this classic Othello board duel. NEW!', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop', category: 'Strategy', rating: 4.7, players: 'NEW', color: 'hsl(142, 70%, 45%)' },
  { id: 'cup-shuffle', title: 'Cup Shuffle', description: 'Track the golden ball as the cups swap faster and faster every round. NEW!', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop', category: 'Skill', rating: 4.6, players: 'NEW', color: 'hsl(45, 100%, 55%)' },
  { id: 'ring-ball', title: 'Ring Ball', description: 'Steer a black hole around a neon ring and swallow splitting balls for huge combos. NEW!', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', category: 'Arcade', rating: 4.9, players: 'NEW', color: 'hsl(300, 100%, 60%)' },
  { id: 'bomb-defuse', title: 'Bomb Defuse', description: 'Read the manual and cut the one safe wire before the timer hits zero. NEW!', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', category: 'Brain', rating: 4.8, players: 'NEW', color: 'hsl(0, 85%, 55%)' },
];

const categories = ['All', ...Array.from(new Set(games.map(g => g.category))).sort()];

// ─── Spotlight Game Card ───
const SpotlightCard: React.FC<{ game: typeof games[0]; index: number }> = ({ game, index }) => (
  <Link to={`/game/${game.id}`} className="group block">
    <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-float">
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${game.image})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 80px ${game.color}30` }} />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${game.color}dd`, color: 'hsl(var(--primary-foreground))' }}>
            {game.category}
          </span>
          {index === 0 && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning">🔥 FEATURED</span>}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-warning fill-warning" /> {game.rating}
          </span>
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{game.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> {game.players} playing
          </div>
          <Button variant="gaming" size="sm" className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3.5 h-3.5" /> Play Now
          </Button>
        </div>
      </div>
    </div>
  </Link>
);

// ─── Compact Game Row ───
const CompactGameRow: React.FC<{ game: typeof games[0]; rank: number }> = ({ game, rank }) => (
  <Link to={`/game/${game.id}`} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all">
    <span className="font-display text-2xl font-bold text-muted-foreground w-8 text-center">{rank}</span>
    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{game.title}</h4>
      <p className="text-xs text-muted-foreground">{game.category} • {game.players} playing</p>
    </div>
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
      <span className="text-sm font-bold">{game.rating}</span>
    </div>
    <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
  </Link>
);

// ─── Section Header ───
const SectionHeader: React.FC<{ 
  icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode; iconColor?: string 
}> = ({ icon: Icon, title, subtitle, action, iconColor = 'text-primary' }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
    <div>
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-1 flex items-center gap-3">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        {title}
      </h2>
      {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Feature Highlight Card ───
const FeatureCard: React.FC<{
  icon: React.ElementType; title: string; description: string; gradient: string; stat: string; statLabel: string;
}> = ({ icon: Icon, title, description, gradient, stat, statLabel }) => (
  <div className="ultra-feature group cursor-default">
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 
      transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg`}>
      <Icon className="w-8 h-8 text-foreground" />
    </div>
    <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    <div className="pt-3 border-t border-border">
      <span className="font-display text-2xl font-bold text-primary">{stat}</span>
      <span className="text-xs text-muted-foreground ml-2">{statLabel}</span>
    </div>
  </div>
);

// ─── Quick Category Card ───
// Extract "H, S%, L%" from an "hsl(H, S%, L%)" string so we can build valid
// hsl()/hsla() values with alpha. Falls back to primary if parsing fails.
const parseHsl = (raw: string): string => {
  const m = raw.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  return m ? `${m[1]}, ${m[2]}%, ${m[3]}%` : '185, 100%, 50%';
};

const CategoryCard: React.FC<{ name: string; count: number; icon: React.ElementType; color: string }> =
  ({ name, count, icon: Icon, color }) => {
  const hsl = parseHsl(color);
  return (
    <Link to={`/#games`} className="group">
      <div className="glass-panel rounded-2xl p-5 text-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-glow cursor-pointer hover-lift">
        <div
          className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg animate-pop-in"
          style={{
            background: `linear-gradient(135deg, hsla(${hsl}, 0.9), hsla(${hsl}, 0.55))`,
            boxShadow: `0 6px 24px -6px hsla(${hsl}, 0.6), inset 0 1px 0 hsla(0, 0%, 100%, 0.25)`,
          }}
        >
          <Icon className="w-7 h-7 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />
        </div>
        <h4 className="font-display text-sm font-bold mb-1">{name}</h4>
        <p className="text-xs text-muted-foreground">{count} games</p>
      </div>
    </Link>
  );
};

// ─── Main Component ───
const Index: React.FC = () => {
  const { isLoggedIn, gamesShutdown, user, currentStreak, lastClaimDate, gameStats, leaderboard } = useGame();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllGames, setShowAllGames] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hasReward = lastClaimDate !== today;

  const lastPlayedGame = useMemo(() => {
    const entries = Object.entries(gameStats);
    if (entries.length === 0) return undefined;
    const mostPlayed = entries.sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed)[0];
    const game = games.find(g => g.id === mostPlayed[0]);
    return game ? { gameId: game.id, gameName: game.title, score: mostPlayed[1].highScore } : undefined;
  }, [gameStats]);

  const miniLeaderboardEntries = useMemo(() => {
    return leaderboard.slice(0, 5).map((entry, i) => ({
      rank: i + 1, username: entry.username, avatar: entry.avatar, score: entry.score,
      level: Math.floor(entry.score / 500) + 1,
    }));
  }, [leaderboard]);

  const filteredGames = selectedCategory === 'All' ? games : games.filter(g => g.category === selectedCategory);
  const displayedGames = showAllGames ? filteredGames : filteredGames.slice(0, 16);

  const topRated = useMemo(() => [...games].sort((a, b) => b.rating - a.rating).slice(0, 5), []);
  const mostPopular = useMemo(() => [...games].sort((a, b) => {
    const pa = parseFloat(a.players.replace('K', ''));
    const pb = parseFloat(b.players.replace('K', ''));
    return pb - pa;
  }).slice(0, 5), []);
  const newGames = useMemo(() => games.slice(-6), []);
  const spotlightGames = useMemo(() => [...games].sort((a, b) => b.rating - a.rating).slice(0, 3), []);
  const popularNowGames = useMemo(() => [...games].sort((a, b) => {
    const pa = parseFloat(a.players.replace('K', ''));
    const pb = parseFloat(b.players.replace('K', ''));
    return pb - pa;
  }).slice(0, 5).map(g => ({ ...g, trend: 'up' as const })), []);
  const puzzleGames = useMemo(() => games.filter(g => g.category === 'Puzzle').slice(0, 8), []);
  const arcadeGames = useMemo(() => games.filter(g => g.category === 'Arcade').slice(0, 8), []);
  const recentlyAdded = useMemo(() => games.slice(-10), []);

  const totalGamesPlayed = useMemo(() => Object.values(gameStats).reduce((acc, s) => acc + s.gamesPlayed, 0), [gameStats]);
  const totalScore = useMemo(() => Object.values(gameStats).reduce((acc, s) => acc + s.highScore, 0), [gameStats]);

  const categoryIcons: Record<string, React.ElementType> = {
    Puzzle: Layers, Arcade: Gamepad2, Strategy: Target, Shooter: Swords,
    Runner: Rocket, Word: BookOpen, Brain: BarChart3, Memory: Eye,
    Skill: Timer, Classic: Globe, Card: Compass, Trivia: MessageSquare,
    Racing: Zap, Idle: Clock, Luck: Gift, '3D': Gem, Action: Flame,
    Multiplayer: Users, Plus: Crown, Sports: Trophy,
    ASMR: Heart, Destruction: Flame, Casual: Star,

  };

  const milestones = useMemo(() => [
    { id: '1', title: 'Play 10 Games', description: 'Play 10 different games', target: 10, current: Math.min(totalGamesPlayed, 10), reward: { coins: 100, gems: 5 }, icon: '🎮' },
    { id: '2', title: 'Score 50K', description: 'Accumulate 50,000 total score', target: 50000, current: Math.min(totalScore, 50000), reward: { coins: 500, gems: 25 }, icon: '🏆' },
    { id: '3', title: '7-Day Streak', description: 'Play for 7 days in a row', target: 7, current: Math.min(currentStreak, 7), reward: { coins: 300, gems: 15 }, icon: '🔥' },
  ], [totalGamesPlayed, totalScore, currentStreak]);

  const eventDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <Seo
        title="Glitch Games — Free Browser Arcade & Classic Games"
        description="Play 70+ free browser games on Glitch Games. Discover arcade hits, classic puzzles, and indie gems — earn coins, climb leaderboards, and unlock achievements."
        path="/"
      />
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <UltraParticles count={30} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="ultra-orb ultra-orb-cyan w-[600px] h-[600px] -top-20 -left-40" />
          <div className="ultra-orb ultra-orb-magenta w-[500px] h-[500px] top-1/3 right-0 translate-x-1/2" />
          <div className="ultra-orb ultra-orb-purple w-[400px] h-[400px] bottom-0 left-1/3" />
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />

        <div className="container mx-auto relative z-10">
          {isLoggedIn && user && (
            <div className="max-w-4xl mx-auto mb-8 space-y-4 animate-fade-in">
              <WelcomeBack username={user.username} avatar={user.avatar} level={user.level}
                streak={currentStreak} lastPlayed={lastPlayedGame} hasReward={hasReward} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TipOfTheDay />
                <QuickStats />
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel mb-8 animate-fade-in">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">60+ Premium Games • Free to Play</span>
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />)}
                </div>
              </div>
              
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6">
                <span className="text-gradient animate-glitch inline-block">GLITCH</span>
                <br />
                <span className="text-foreground relative inline-block">
                  GAMES
                  <Crown className="absolute -top-4 -right-8 w-8 h-8 text-warning fill-warning animate-float" />
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
                Play the hottest games, earn <span className="text-warning font-semibold">epic rewards</span>, and compete with players worldwide!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                <Button variant="gaming" size="xl" asChild className="group">
                  <Link to="/login">
                    <Zap className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                    Join Now - It's Free!
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild className="group border-primary/30 hover:border-primary hover:bg-primary/10">
                  <Link to="/leaderboard">
                    <Trophy className="w-5 h-5 mr-2 text-warning transition-transform group-hover:scale-110" />
                    View Leaderboard
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto mt-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <LivePlayerCount compact />
              <QuickPlayButton games={games} isLoggedIn={isLoggedIn} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <UltraStatsCounter value="50K+" label="Active Players" color="primary" />
              <UltraStatsCounter value="60+" label="Premium Games" color="secondary" />
              <UltraStatsCounter value="$10K" label="In Rewards" color="warning" />
              <UltraStatsCounter value="99.9%" label="Uptime" color="success" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ QUICK ACCESS BAR ═══ */}
      <section className="py-4 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <QuickAccessBar />
        </div>
      </section>

      {/* ═══ FEATURED GAME SHOWCASE (Auto-rotating carousel) ═══ */}
      <section className="py-6 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <GameShowcase games={games} />
        </div>
      </section>

      {/* ═══ ANNOUNCEMENTS + HERO BANNER ═══ */}
      <section className="py-6 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl space-y-6">
          <AnimatedHeroBanner />
          <Announcements />
        </div>
      </section>

      {/* ═══ DAILY BONUS (logged in) ═══ */}
      {isLoggedIn && (
        <section className="py-4 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <DailyBonus />
          </div>
        </section>
      )}

      {/* ═══ SPOTLIGHT GAMES ═══ */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader icon={Star} title="Spotlight" subtitle="Editor's picks — the very best games on the platform" iconColor="text-warning" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spotlightGames.map((game, i) => (
              <SpotlightCard key={game.id} game={game} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUICK PLAY CAROUSELS ═══ */}
      {showMore && <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl space-y-8">
          <QuickPlayCarousel games={puzzleGames} title="🧩 Puzzle Games" />
          <QuickPlayCarousel games={arcadeGames} title="🕹️ Arcade Classics" />
        </div>
      </section>}


      {/* ═══ GAME OF THE DAY + POPULAR NOW + NEWS ═══ */}
      <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <GameOfTheDay games={games} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PopularNow games={popularNowGames} />
                <GamingNews />
              </div>
            </div>
            <div className="space-y-6">
              <Countdown targetDate={eventDate} title="🎉 Weekend Tournament" subtitle="Double XP for all players!" />
              <SearchGames games={games.map(g => ({ id: g.id, title: g.title, category: g.category, rating: g.rating, color: g.color }))} />
              <GenreSpotlight games={games} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ QUICK CATEGORIES ═══ */}
      {showMore && <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader icon={Compass} title="Browse Categories" subtitle="Find your perfect game genre" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {categories.filter(c => c !== 'All').map(cat => (
              <CategoryCard key={cat} name={cat} count={games.filter(g => g.category === cat).length}
                icon={categoryIcons[cat] || Gamepad2}
                color={games.find(g => g.category === cat)?.color || 'hsl(var(--primary))'} />
            ))}
          </div>
        </div>
      </section>}


      {/* ═══ TRENDING + LEADERBOARD + RECENT WINNERS ═══ */}
      <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TrendingGames games={games} limit={5} />
            <MiniLeaderboard entries={miniLeaderboardEntries.length > 0 ? miniLeaderboardEntries : [
              { rank: 1, username: 'ProGamer99', score: 15420, level: 25, avatar: '' },
              { rank: 2, username: 'PixelQueen', score: 12350, level: 20, avatar: '' },
              { rank: 3, username: 'NeonKnight', score: 11200, level: 18, avatar: '' },
              { rank: 4, username: 'StarPlayer', score: 9800, level: 15, avatar: '' },
              { rank: 5, username: 'GameWizard', score: 8500, level: 12, avatar: '' },
            ]} />
            <RecentWinners />
          </div>
        </div>
      </section>

      {/* ═══ TOP RATED + MOST POPULAR + STAFF PICKS ═══ */}
      {showMore && <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" /> Top Rated
              </h3>
              <div className="space-y-1">
                {topRated.map((game, i) => <CompactGameRow key={game.id} game={game} rank={i + 1} />)}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Most Popular
              </h3>
              <div className="space-y-1">
                {mostPopular.map((game, i) => <CompactGameRow key={game.id} game={game} rank={i + 1} />)}
              </div>
            </div>
            <StaffPicks games={games} />
          </div>
        </div>
      </section>}

      {/* ═══ NEW THIS WEEK ═══ */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader icon={Rocket} title="New This Week" subtitle="Fresh games just added to the library" iconColor="text-success"
            action={<Link to="/#games"><Button variant="outline" size="sm" className="gap-1">View All <ArrowRight className="w-4 h-4" /></Button></Link>} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {newGames.map((game, i) => (
              <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <Link to={`/game/${game.id}`} className="group block">
                  <div className="relative rounded-xl overflow-hidden aspect-square mb-2 transition-transform duration-300 group-hover:scale-105">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${game.image})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-success/90 text-xs font-bold text-success-foreground">NEW</div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-background/80 rounded-full px-2 py-0.5">
                      <Star className="w-3 h-3 text-warning fill-warning" /> {game.rating}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{game.title}</h4>
                  <p className="text-xs text-muted-foreground">{game.category}</p>
                </Link>
              </div>
            ))}
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

      {/* ═══ ALL GAMES LIBRARY ═══ */}
      <section id="games" className="py-16 px-4 relative">
        <UltraParticles count={15} className="opacity-50" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <SectionHeader icon={Gamepad2} title="Game Library" subtitle={`${games.length} games available — choose your adventure!`}
            action={isLoggedIn && (
              <Link to="/rewards">
                <Button variant="gold" size="lg" className="gap-2 group">
                  <Gift className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  Daily Rewards
                  {hasReward && <span className="ml-1 px-2 py-0.5 rounded-full bg-foreground/20 text-xs animate-pulse">NEW</span>}
                </Button>
              </Link>
            )} />

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <Button key={category}
                variant={selectedCategory === category ? 'gaming' : 'outline'}
                size="sm" onClick={() => { setSelectedCategory(category); setShowAllGames(false); }}
                className="transition-all">
                {category}
                {category !== 'All' && (
                  <span className="ml-1 text-xs opacity-60">({games.filter(g => g.category === category).length})</span>
                )}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedGames.map((game, index) => (
              <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}>
                <GameCard {...game} />
              </div>
            ))}
          </div>

          {!showAllGames && filteredGames.length > 16 && (
            <div className="text-center mt-10">
              <Button variant="outline" size="lg" onClick={() => setShowAllGames(true)} className="gap-2 group">
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                Show All {filteredGames.length} Games
              </Button>
            </div>
          )}

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No games in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ QUESTS + CHALLENGES + SEASON PASS ═══ */}
      <section className="py-12 px-4 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <SectionHeader icon={Target} title="Quests & Challenges" subtitle="Complete objectives to earn bonus rewards" iconColor="text-accent" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DailyQuests />
            <WeeklyChallenge />
            <SeasonPass currentTier={3} currentXP={750} xpPerTier={1000} isPremium={false} seasonName={`Season ${__SEASON__.index}: ${__SEASON__.name}`} daysLeft={__SEASON__.daysLeft} />
          </div>
        </div>
      </section>

      {/* ═══ ACHIEVEMENTS + MILESTONES ═══ */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader icon={Trophy} title="Achievements & Milestones" subtitle="Track your gaming journey" iconColor="text-warning" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AchievementShowcase />
            <MilestoneTracker milestones={milestones} title="Your Progress" />
          </div>
        </div>
      </section>

      {/* ═══ PLAYER TESTIMONIALS ═══ */}
      {showMore && <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader icon={MessageSquare} title="What Players Say" subtitle="Real reviews from our community" iconColor="text-secondary" />
          <PlayerTestimonials />
        </div>
      </section>}

      {/* ═══ SOCIAL - FRIEND ACTIVITY + STATS ═══ */}
      {isLoggedIn && (
        <section className="py-12 px-4 relative z-10">
          <div className="container mx-auto max-w-6xl">
            <SectionHeader icon={Users} title="Community" subtitle="See what your friends are up to" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FriendActivityFeed />
              <StatsOverview
                totalGamesPlayed={totalGamesPlayed}
                totalScore={totalScore}
                totalTimePlayed={Object.values(gameStats).reduce((a, s) => a + (s.timePlayed || 0), 0)}
                achievements={3}
                currentStreak={currentStreak}
                level={user?.level || 1}
                favoriteGame={lastPlayedGame?.gameName}
                winRate={68}
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ WHY CHOOSE GLITCH GAMES ═══ */}
      {showMore && <section className="py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />
        <UltraParticles count={10} className="opacity-30" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Why Choose <span className="text-gradient">Glitch Games</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The ultimate gaming platform built for players who demand the best</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={Trophy} title="Compete & Win" description="Climb leaderboards and prove you're the best player on the platform."
              gradient="from-warning/20 to-warning/5" stat="50K+" statLabel="competitions" />
            <FeatureCard icon={Gift} title="Daily Rewards" description="Log in every day to claim free coins, gems, and exclusive items."
              gradient="from-success/20 to-success/5" stat="500" statLabel="coins/day" />
            <FeatureCard icon={Zap} title="Instant Play" description="No downloads, no installs. Play directly in your browser in seconds."
              gradient="from-primary/20 to-primary/5" stat="<1s" statLabel="load time" />
            <FeatureCard icon={Shield} title="Safe & Secure" description="Your progress is saved in the cloud. Play from any device, anytime."
              gradient="from-secondary/20 to-secondary/5" stat="99.9%" statLabel="uptime" />
          </div>
        </div>
      </section>}

      {/* ═══ PLATFORM STATS ═══ */}
      {showMore && (
        <section className="py-12 px-4 relative z-10">
          <div className="container mx-auto max-w-5xl">
            <PlatformStats />
          </div>
        </section>
      )}

      {/* ═══ SHOW MORE TOGGLE ═══ */}
      <section className="py-8 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl text-center">
          <Button variant="outline" size="lg" className="gap-2" onClick={() => setShowMore(v => !v)}>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            {showMore ? 'Show less' : 'More from Glitch Games'}
          </Button>
        </div>
      </section>

      {/* ═══ COMMUNITY CTA ═══ */}
      {!isLoggedIn && (
        <section className="py-16 px-4 relative z-10">
          <div className="container mx-auto max-w-4xl">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
              <div className="absolute inset-0 glass-panel" />
              <div className="relative z-10 p-6 sm:p-10 md:p-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Join 50,000+ Players</span>
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-black mb-4">
                  Ready to <span className="text-gradient">Level Up</span>?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Create your free account, start playing, and join the most exciting gaming community on the web.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
                  <Button variant="gaming" size="xl" asChild className="group w-full sm:w-auto px-4 sm:px-10 text-base sm:text-lg">
                    <Link to="/login">
                      <Rocket className="w-5 h-5 mr-2 transition-transform group-hover:scale-110 shrink-0" />
                      Create Free Account
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" asChild className="border-primary/30 hover:border-primary hover:bg-primary/10 w-full sm:w-auto px-4 sm:px-10 text-base sm:text-lg">
                    <a href="#games">
                      <Eye className="w-5 h-5 mr-2 shrink-0" />
                      Browse Games First
                    </a>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Zap className="w-4 h-4 text-primary" /> No credit card</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Shield className="w-4 h-4 text-success" /> Privacy first</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-4 h-4 text-warning" /> 30 sec signup</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
