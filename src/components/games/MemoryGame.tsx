import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';

const EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame: React.FC = () => {
  const { addCoins, soundSettings, updateGameStats } = useGame();
  const soundEnabled = !soundSettings.isMuted;
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const playSound = useCallback((type: 'flip' | 'match' | 'win') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'flip') {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'match') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(784, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } else {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [soundEnabled]);

  const initializeGame = useCallback(() => {
    const shuffledEmojis = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameComplete(false);
    setIsPlaying(true);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || gameComplete) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, gameComplete]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        playSound('match');
        setCards(prev => prev.map((card, i) => 
          i === first || i === second ? { ...card, isMatched: true } : card
        ));
        setMatches(m => m + 1);
        setFlippedCards([]);
        setIsChecking(false);

        if (matches + 1 === EMOJIS.length) {
          playSound('win');
          setGameComplete(true);
          setIsPlaying(false);
          const score = Math.max(1000 - moves * 10 - timer * 2, 100);
          const coinsEarned = Math.floor(score / 20);
          addCoins(coinsEarned);
          updateGameStats('memory', score, timer);
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => 
            i === first || i === second ? { ...card, isFlipped: false } : card
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }, [flippedCards, cards, matches, moves, timer, playSound, addCoins, updateGameStats]);

  const handleCardClick = (index: number) => {
    if (!isPlaying || isChecking || flippedCards.length >= 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    playSound('flip');
    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
    setMoves(m => m + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Moves</p>
              <p className="font-display text-lg font-bold text-primary">{moves}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Matches</p>
              <p className="font-display text-lg font-bold text-success">{matches}/{EMOJIS.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-display text-lg font-bold text-warning">{formatTime(timer)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        {!isPlaying && !gameComplete ? (
          <div className="w-80 h-80 flex flex-col items-center justify-center gap-4 bg-card rounded-xl border border-border">
            <h2 className="font-display text-2xl font-bold text-gradient">MEMORY MATCH</h2>
            <p className="text-muted-foreground text-sm text-center px-4">
              Match all pairs with the fewest moves!
            </p>
            <Button variant="gaming" onClick={initializeGame} className="gap-2">
              <Play className="w-4 h-4" />
              Start Game
            </Button>
          </div>
        ) : gameComplete ? (
          <div className="w-80 h-80 flex flex-col items-center justify-center gap-4 bg-card rounded-xl border border-border">
            <Trophy className="w-16 h-16 text-warning animate-bounce" />
            <h2 className="font-display text-2xl font-bold text-gradient">You Win!</h2>
            <p className="text-muted-foreground">
              Completed in {moves} moves • {formatTime(timer)}
            </p>
            <Button variant="gaming" onClick={initializeGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl font-display text-3xl transition-all duration-300 transform ${
                  card.isFlipped || card.isMatched
                    ? 'bg-card border-2 border-primary rotate-0 scale-100'
                    : 'bg-gradient-to-br from-primary to-secondary hover:scale-105 cursor-pointer'
                } ${card.isMatched ? 'opacity-60 border-success' : ''}`}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                }}
              >
                {card.isFlipped || card.isMatched ? card.emoji : '?'}
              </button>
            ))}
          </div>
        )}
      </div>

      {isPlaying && !gameComplete && (
        <Button variant="outline" onClick={initializeGame} className="mt-6 gap-2">
          <RotateCcw className="w-4 h-4" />
          Restart
        </Button>
      )}
    </div>
  );
};

export default MemoryGame;
