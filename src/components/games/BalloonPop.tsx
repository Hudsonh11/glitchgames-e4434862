import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  popped: boolean;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

const BalloonPop: React.FC = () => {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [pops, setPops] = useState<{ x: number; y: number; id: number }[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnBalloon = useCallback(() => {
    const balloon: Balloon = {
      id: nextId.current++,
      x: 10 + Math.random() * 80,
      y: 105,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 0.3 + Math.random() * 0.5,
      size: 30 + Math.random() * 20,
      popped: false,
    };
    setBalloons(prev => [...prev, balloon]);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(spawnBalloon, 800);
    return () => clearInterval(interval);
  }, [gameOver, spawnBalloon]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setBalloons(prev => prev.filter(b => !b.popped && b.y > -10).map(b => ({ ...b, y: b.y - b.speed })));
    }, 30);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  const popBalloon = (id: number, x: number, y: number) => {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    const points = 10 + combo * 5;
    setScore(prev => prev + points);
    setCombo(prev => prev + 1);
    setPops(prev => [...prev, { x, y, id }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 500);
    setTimeout(() => setCombo(0), 2000);
  };

  const restart = () => {
    setBalloons([]);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setCombo(0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold text-primary">Score: {score}</div>
        <div className="text-lg font-bold text-destructive">Time: {timeLeft}s</div>
        {combo > 1 && <div className="text-lg font-bold text-warning animate-bounce">Combo x{combo}!</div>}
      </div>
      <div
        ref={containerRef}
        className="relative w-full bg-gradient-to-b from-sky-200 to-sky-400 dark:from-sky-900 dark:to-sky-700 rounded-xl overflow-hidden cursor-crosshair"
        style={{ height: 400 }}
      >
        {balloons.filter(b => !b.popped).map(b => (
          <div
            key={b.id}
            className="absolute cursor-pointer transition-transform hover:scale-110"
            style={{ left: `${b.x}%`, bottom: `${100 - b.y}%`, transform: 'translate(-50%, 50%)' }}
            onClick={() => popBalloon(b.id, b.x, b.y)}
          >
            <div style={{ width: b.size, height: b.size * 1.2, backgroundColor: b.color, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.15), inset 5px 5px 10px rgba(255,255,255,0.3)` }} />
            <div style={{ width: 2, height: 15, backgroundColor: '#888', margin: '0 auto' }} />
          </div>
        ))}
        {pops.map(p => (
          <div key={p.id} className="absolute text-2xl font-bold text-primary animate-ping pointer-events-none" style={{ left: `${p.x}%`, bottom: `${100 - p.y}%` }}>
            💥
          </div>
        ))}
        {gameOver && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center flex-col gap-4">
            <h2 className="text-3xl font-bold text-foreground">Game Over!</h2>
            <p className="text-xl text-primary">Score: {score}</p>
            <button onClick={restart} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalloonPop;
