import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-24 z-40 rounded-full h-10 w-10 shadow-lg border-primary/30 hover:border-primary/60 bg-card/80 backdrop-blur animate-in fade-in"
    >
      <ArrowUp className="w-4 h-4" />
    </Button>
  );
};

export default BackToTop;
