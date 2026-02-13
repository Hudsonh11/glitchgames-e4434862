import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Target { id: number; x: number; y: number; size: number; speed: number; dx: number; dy: number; type: 'normal' | 'gold' | 'bomb'; }

const SkeetShoot: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [hits, setHits] = useState<{ x: number; y: number; id: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      const type = Math.random() > 0.85 ? 'bomb' : Math.random() > 0.8 ? 'gold' : 'normal';
      setTargets(prev => [...prev, {
        id: nextId.current++,
        x: Math.random() > 0.5 ? -30 : 430,
        y: 50 + Math.random() * 300,
        size: type === 'gold' ? 20 : 30,
        speed: 1 + Math.random() * 2,
        dx: Math.random() > 0.5 ? 1 : -1,
        dy: (Math.random() - 0.5) * 0.5,
        type,
      }]);
    }, 600);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTargets(prev => prev.filter(t => t.x > -50 && t.x < 450 && t.y > -50 && t.y < 450)
        .map(t => ({ ...t, x: t.x + t.speed * t.dx, y: t.y + t.speed * t.dy })));
    }, 20);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { setGameOver(true); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  const shoot = (id: number, type: string, x: number, y: number) => {
    setShots(s => s + 1);
    setTargets(prev => prev.filter(t => t.id !== id));
    if (type === 'bomb') {
      setScore(s => Math.max(0, s - 50));
    } else {
      setScore(s => s + (type === 'gold' ? 50 : 10));
    }
    setHits(prev => [...prev, { x, y, id }]);
    setTimeout(() => setHits(prev => prev.filter(h => h.id !== id)), 300);
  };

  const accuracy = shots > 0 ? Math.round((score / (shots * 10)) * 100) : 0;

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-lg mx-auto">
      <div className="flex justify-between w-full mb-2">
        <span className="font-bold text-primary">Score: {score}</span>
        <span className="text-sm text-muted-foreground">Accuracy: {accuracy}%</span>
        <span className="font-bold text-destructive">Time: {timeLeft}s</span>
      </div>
      <div className="relative w-full bg-gradient-to-b from-blue-900 to-blue-950 rounded-xl overflow-hidden cursor-crosshair" style={{ height: 400 }}>
        {targets.map(t => (
          <div
            key={t.id}
            onClick={() => shoot(t.id, t.type, t.x, t.y)}
            className="absolute rounded-full cursor-crosshair transition-transform hover:scale-110"
            style={{
              left: t.x - t.size / 2,
              top: t.y - t.size / 2,
              width: t.size,
              height: t.size,
              backgroundColor: t.type === 'bomb' ? '#333' : t.type === 'gold' ? '#FFD700' : '#FF6B6B',
              boxShadow: t.type === 'gold' ? '0 0 15px #FFD700' : t.type === 'bomb' ? '0 0 10px #FF0000' : '0 0 10px rgba(255,107,107,0.5)',
            }}
          >
            {t.type === 'bomb' && <span className="absolute inset-0 flex items-center justify-center text-xs">💣</span>}
          </div>
        ))}
        {hits.map(h => (
          <div key={h.id} className="absolute pointer-events-none animate-ping" style={{ left: h.x, top: h.y }}>✨</div>
        ))}
        {gameOver && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center flex-col gap-4">
            <h2 className="text-3xl font-bold">Time's Up!</h2>
            <p className="text-xl text-primary">Score: {score}</p>
            <button onClick={() => { setScore(0); setShots(0); setTimeLeft(45); setGameOver(false); setTargets([]); }} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkeetShoot;
