import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Gamepad2, Home, ArrowLeft, Ghost, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();
  const [glitchText, setGlitchText] = useState("404");
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const glitchChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const glitched = "404".split("").map((char) =>
        Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
      ).join("");
      setGlitchText(glitched);
      setTimeout(() => setGlitchText("404"), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ultra-orb ultra-orb-cyan w-[500px] h-[500px] -top-40 -left-40" />
        <div className="ultra-orb ultra-orb-magenta w-[400px] h-[400px] bottom-0 right-0 translate-x-1/3" />
        <div className="ultra-orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: 'hsl(280 100% 60% / 0.1)', filter: 'blur(80px)', animation: 'float 12s ease-in-out infinite' }} />
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-primary/40 animate-float pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}

      <div className="text-center relative z-10 px-4 max-w-lg">
        {/* Ghost icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-8 animate-float relative">
          <Ghost className="w-12 h-12 text-primary" />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-warning animate-pulse" />
        </div>

        {/* Glitch 404 text */}
        <h1
          className="font-display text-8xl md:text-9xl font-black mb-4 text-gradient animate-glitch select-none"
          aria-label="404"
        >
          {glitchText}
        </h1>

        {/* Subtitle */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6">
          <Gamepad2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-primary uppercase tracking-wider">Level Not Found</span>
        </div>

        <p className="text-lg text-muted-foreground mb-2">
          Oops! This page got lost in the void.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          The path <code className="px-2 py-0.5 rounded bg-muted text-primary font-mono text-xs">{location.pathname}</code> doesn't exist.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gaming" size="lg" asChild className="gap-2">
            <Link to="/">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()} className="gap-2 hover:border-primary/50">
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Fun suggestion */}
        <div className="mt-10 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur">
          <p className="text-xs text-muted-foreground">
            💡 <strong className="text-foreground">Pro Tip:</strong> Try playing one of our 50 awesome games instead!
          </p>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            {['pac-man', 'tetris', 'snake', 'chess', 'wordle'].map((game) => (
              <Link
                key={game}
                to={`/game/${game}`}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors border border-border/50 hover:border-primary/30 capitalize"
              >
                {game.replace('-', ' ')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
