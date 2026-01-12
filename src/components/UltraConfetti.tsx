import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  type: 'circle' | 'square' | 'star';
}

interface UltraConfettiProps {
  active: boolean;
  duration?: number;
  pieces?: number;
}

const colors = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--accent))',
];

const UltraConfetti: React.FC<UltraConfettiProps> = ({
  active,
  duration = 3000,
  pieces = 100,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newConfetti: ConfettiPiece[] = [];
      for (let i = 0; i < pieces; i++) {
        newConfetti.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 8,
          rotation: Math.random() * 360,
          type: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'star',
        });
      }
      setConfetti(newConfetti);

      const timer = setTimeout(() => {
        setConfetti([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, pieces]);

  if (!active || confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.x}%`,
            top: '-5%',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          {piece.type === 'circle' && (
            <div
              className="rounded-full"
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          )}
          {piece.type === 'square' && (
            <div
              className="rounded-sm"
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          )}
          {piece.type === 'star' && (
            <svg
              width={piece.size}
              height={piece.size}
              viewBox="0 0 24 24"
              fill={piece.color}
              style={{ transform: `rotate(${piece.rotation}deg)` }}
            >
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          )}
        </div>
      ))}

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default UltraConfetti;
