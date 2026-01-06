import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';

const SpinWheel: React.FC = () => {
  const { addCoins } = useGame();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [spinsUsed, setSpinsUsed] = useState(0);
  const maxSpins = 3;
  
  const prizes = [
    { value: 100, color: 'from-red-500 to-red-600', label: '100' },
    { value: 50, color: 'from-yellow-500 to-yellow-600', label: '50' },
    { value: 200, color: 'from-green-500 to-green-600', label: '200' },
    { value: 25, color: 'from-blue-500 to-blue-600', label: '25' },
    { value: 500, color: 'from-purple-500 to-purple-600', label: '500' },
    { value: 75, color: 'from-pink-500 to-pink-600', label: '75' },
    { value: 150, color: 'from-orange-500 to-orange-600', label: '150' },
    { value: 10, color: 'from-gray-500 to-gray-600', label: '10' },
  ];
  
  const spin = async () => {
    if (spinning || spinsUsed >= maxSpins) return;
    
    setSpinning(true);
    setResult(null);
    
    const extraSpins = 5 + Math.random() * 3;
    const randomSegment = Math.floor(Math.random() * prizes.length);
    const segmentAngle = 360 / prizes.length;
    const finalRotation = rotation + (extraSpins * 360) + (randomSegment * segmentAngle);
    
    setRotation(finalRotation);
    
    setTimeout(async () => {
      const prize = prizes[randomSegment];
      setResult(prize.value);
      await addCoins(prize.value);
      setSpinsUsed(s => s + 1);
      setSpinning(false);
    }, 4000);
  };
  
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Daily Spin Wheel</h2>
        <p className="text-muted-foreground">Spins remaining: {maxSpins - spinsUsed}</p>
      </div>
      
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-4xl">
          ▼
        </div>
        
        {/* Wheel */}
        <div 
          className="w-64 h-64 rounded-full border-4 border-border shadow-2xl transition-transform duration-[4000ms] ease-out"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${prizes.map((p, i) => 
              `${p.color.split(' ')[0].replace('from-', '')} ${i * (100/prizes.length)}% ${(i+1) * (100/prizes.length)}%`
            ).join(', ')})`
          }}
        >
          {prizes.map((prize, i) => (
            <div
              key={i}
              className="absolute text-white font-bold text-sm"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * (360/prizes.length) + (360/prizes.length/2)}deg) translateY(-100px)`,
                transformOrigin: '0 0',
              }}
            >
              {prize.label}
            </div>
          ))}
        </div>
        
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card border-4 border-border flex items-center justify-center">
          <span className="text-2xl">🎰</span>
        </div>
      </div>
      
      <Button 
        onClick={spin} 
        disabled={spinning || spinsUsed >= maxSpins}
        variant="gaming"
        size="lg"
        className="min-w-[150px]"
      >
        {spinning ? 'Spinning...' : spinsUsed >= maxSpins ? 'No Spins Left' : 'SPIN!'}
      </Button>
      
      {result !== null && (
        <div className="text-2xl font-bold text-success animate-bounce">
          🎉 You won {result} coins!
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
