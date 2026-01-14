import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface UltraMagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  radius?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const UltraMagneticButton: React.FC<UltraMagneticButtonProps> = ({
  children,
  strength = 30,
  radius = 200,
  variant = 'primary',
  className,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
    if (distance < radius) {
      const factor = (radius - distance) / radius;
      setPosition({
        x: distanceX * factor * (strength / 100),
        y: distanceY * factor * (strength / 100)
      });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-white/10 border border-white/20'
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative px-6 py-3 rounded-xl font-semibold transition-colors duration-200',
        variantStyles[variant],
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.3s ease-out' : 'none'
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default UltraMagneticButton;
