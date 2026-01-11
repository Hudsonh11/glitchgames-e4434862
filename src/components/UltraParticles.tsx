import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: 'cyan' | 'magenta' | 'purple' | 'gold';
}

const UltraParticles: React.FC<{ count?: number; className?: string }> = ({ 
  count = 20,
  className = ''
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors: Array<'cyan' | 'magenta' | 'purple' | 'gold'> = ['cyan', 'magenta', 'purple', 'gold'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);
  }, [count]);

  const getColor = (color: string) => {
    switch (color) {
      case 'cyan':
        return 'bg-primary/30';
      case 'magenta':
        return 'bg-accent/25';
      case 'purple':
        return 'bg-secondary/20';
      case 'gold':
        return 'bg-warning/25';
      default:
        return 'bg-primary/20';
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${getColor(particle.color)}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};

export default UltraParticles;
