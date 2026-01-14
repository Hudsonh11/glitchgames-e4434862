import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface UltraSpotlightProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
}

const UltraSpotlight: React.FC<UltraSpotlightProps> = ({
  children,
  className,
  spotlightColor = 'rgba(255, 255, 255, 0.1)',
  spotlightSize = 300
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Spotlight gradient */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          width: spotlightSize,
          height: spotlightSize,
          left: position.x - spotlightSize / 2,
          top: position.y - spotlightSize / 2,
          background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 70%)`,
          opacity: isHovered ? 1 : 0
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default UltraSpotlight;
