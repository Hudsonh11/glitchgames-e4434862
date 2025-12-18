import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import BlockBlast from '@/components/games/BlockBlast';
import ClickerGame from '@/components/games/ClickerGame';
import GeometryDash from '@/components/games/GeometryDash';
import RacingGame from '@/components/games/RacingGame';
import PacMan from '@/components/games/PacMan';
import { useGame } from '@/contexts/GameContext';

const games: Record<string, React.FC> = {
  'block-blast': BlockBlast,
  'clicker': ClickerGame,
  'geometry-dash': GeometryDash,
  'racing': RacingGame,
  'pac-man': PacMan,
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
  const GameComponent = id ? games[id] : null;
  
  if (!GameComponent) {
    return <Navigate to="/" />;
  }

  return <GameComponent />;
};

export default Game;
