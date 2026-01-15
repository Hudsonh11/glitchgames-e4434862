import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Flame, Star, Gift, Zap, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}

const banners: Banner[] = [
  {
    id: 'daily-rewards',
    title: 'Claim Your Daily Reward!',
    subtitle: 'Login daily for up to 500 coins + 25 gems',
    cta: 'Claim Now',
    link: '/rewards',
    icon: <Gift className="w-8 h-8" />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    accentColor: 'hsl(45, 100%, 55%)',
  },
  {
    id: 'leaderboard',
    title: 'Weekly Tournament Live!',
    subtitle: 'Compete for the #1 spot and win exclusive prizes',
    cta: 'Join Now',
    link: '/leaderboard',
    icon: <Trophy className="w-8 h-8" />,
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    accentColor: 'hsl(280, 100%, 60%)',
  },
  {
    id: 'streak',
    title: 'Keep Your Streak Alive!',
    subtitle: '7-day streak bonus: 2x XP all week',
    cta: 'Play Now',
    link: '/#games',
    icon: <Flame className="w-8 h-8" />,
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    accentColor: 'hsl(15, 100%, 55%)',
  },
  {
    id: 'new-games',
    title: 'New Games Added!',
    subtitle: '5 fresh games to master this week',
    cta: 'Explore',
    link: '/#games',
    icon: <Rocket className="w-8 h-8" />,
    gradient: 'from-cyan-500 via-blue-500 to-purple-500',
    accentColor: 'hsl(200, 100%, 50%)',
  },
];

interface AnimatedHeroBannerProps {
  autoPlayInterval?: number;
}

const AnimatedHeroBanner: React.FC<AnimatedHeroBannerProps> = ({
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentBanner = banners[currentIndex];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setIsAnimating(false);
      }, 300);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlayInterval, isPaused]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.gradient} transition-all duration-500`} />
      
      {/* Animated Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                             radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            animation: 'pan 20s linear infinite',
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + Math.sin(i) * 30}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {i % 3 === 0 ? (
              <Star className="w-4 h-4 text-white/30" />
            ) : i % 3 === 1 ? (
              <Sparkles className="w-3 h-3 text-white/20" />
            ) : (
              <Zap className="w-3 h-3 text-white/25" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 px-6 py-8 md:px-10 md:py-10 transition-all duration-300 ${
        isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Text Content */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Icon */}
            <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white shadow-xl">
              {currentBanner.icon}
            </div>

            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Featured
                </span>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-black mb-1">
                {currentBanner.title}
              </h3>
              <p className="text-sm md:text-base text-white/80">
                {currentBanner.subtitle}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Link to={currentBanner.link}>
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl transition-all group"
            >
              {currentBanner.cta}
              <Zap className="w-4 h-4 ml-2 transition-transform group-hover:scale-110" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 h-2 bg-white rounded-full'
                : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-white/50"
            style={{
              animation: `progress ${autoPlayInterval}ms linear infinite`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pan {
          from { transform: translateX(0); }
          to { transform: translateX(40px); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHeroBanner;
