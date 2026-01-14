import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface UltraTypewriterProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  cursorColor?: string;
  loop?: boolean;
}

const UltraTypewriter: React.FC<UltraTypewriterProps> = ({
  texts,
  className,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  cursorColor,
  loop = true
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];

    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimeout);
    }

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false);
        if (loop || currentTextIndex < texts.length - 1) {
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
        return;
      }

      const deleteTimeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
      return () => clearTimeout(deleteTimeout);
    }

    if (displayText === currentFullText) {
      setIsPaused(true);
      return;
    }

    const typeTimeout = setTimeout(() => {
      setDisplayText(currentFullText.slice(0, displayText.length + 1));
    }, typingSpeed);
    return () => clearTimeout(typeTimeout);
  }, [displayText, isDeleting, isPaused, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration, loop]);

  return (
    <span className={cn('inline-flex items-center', className)}>
      <span>{displayText}</span>
      <span
        className="ml-0.5 w-0.5 h-[1.2em] animate-blink"
        style={{ backgroundColor: cursorColor || 'currentColor' }}
      />
    </span>
  );
};

export default UltraTypewriter;
