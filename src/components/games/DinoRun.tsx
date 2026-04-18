import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Zap, Star, Moon, Sun } from 'lucide-react';

interface DinoRunProps {
  onScoreUpdate?: (score: number) => void;
}

interface PowerUp {
  x: number;
  type: 'shield' | 'doubleJump' | 'slowMo' | 'magnet' | 'multiplier';
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const DinoRun: React.FC<DinoRunProps> = ({ onScoreUpdate }) => {
  const [gameState, setGameState] = useState({
    dinoY: 0,
    isJumping: false,
    canDoubleJump: false,
    hasDoubleJumped: false,
    obstacles: [] as { x: number; type: 'cactus' | 'bird' | 'meteor' }[],
    powerUps: [] as PowerUp[],
    coins: [] as Coin[],
    particles: [] as Particle[],
    score: 0,
    coinsCollected: 0,
    gameOver: false,
    gameStarted: false,
    speed: 8,
    isNightMode: false,
    hasShield: false,
    shieldTimer: 0,
    slowMoActive: false,
    slowMoTimer: 0,
    scoreMultiplier: 1,
    multiplierTimer: 0,
    combo: 0,
    maxCombo: 0,
    screenShake: 0,
  });

  const gameLoopRef = useRef<number>();
  const dinoYRef = useRef(0);
  const jumpIntervalRef = useRef<number>();

  const jump = useCallback(() => {
    if (gameState.gameOver) return;
    
    // Start game on first jump
    if (!gameState.gameStarted) {
      setGameState(prev => ({ ...prev, gameStarted: true }));
    }

    // Check for double jump
    if (gameState.isJumping) {
      if (gameState.canDoubleJump && !gameState.hasDoubleJumped) {
        // Perform double jump
        if (jumpIntervalRef.current) {
          clearInterval(jumpIntervalRef.current);
        }
        
        let jumpHeight = dinoYRef.current;
        setGameState(prev => ({ ...prev, hasDoubleJumped: true }));
        
        // Add jump particles
        const particles: Particle[] = Array.from({ length: 8 }, () => ({
          x: 70,
          y: 40 + dinoYRef.current,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3,
          life: 20,
          color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`,
        }));
        setGameState(prev => ({ ...prev, particles: [...prev.particles, ...particles] }));

        jumpIntervalRef.current = window.setInterval(() => {
          jumpHeight += 10;
          dinoYRef.current = jumpHeight;
          setGameState(prev => ({ ...prev, dinoY: jumpHeight }));
          if (jumpHeight >= 150) {
            clearInterval(jumpIntervalRef.current);
            const fallDown = setInterval(() => {
              jumpHeight -= 8;
              dinoYRef.current = Math.max(0, jumpHeight);
              setGameState(prev => ({ ...prev, dinoY: Math.max(0, jumpHeight) }));
              if (jumpHeight <= 0) {
                clearInterval(fallDown);
                setGameState(prev => ({ 
                  ...prev, 
                  isJumping: false, 
                  hasDoubleJumped: false,
                  dinoY: 0 
                }));
                dinoYRef.current = 0;
              }
            }, 20);
          }
        }, 20);
      }
      return;
    }

    setGameState(prev => ({ ...prev, isJumping: true, hasDoubleJumped: false }));
    let jumpHeight = 0;
    
    // Add jump particles
    const particles: Particle[] = Array.from({ length: 5 }, () => ({
      x: 70,
      y: 40,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2,
      life: 15,
      color: `hsl(${Math.random() * 40 + 20}, 80%, 50%)`,
    }));
    setGameState(prev => ({ ...prev, particles: [...prev.particles, ...particles] }));

    jumpIntervalRef.current = window.setInterval(() => {
      jumpHeight += 8;
      dinoYRef.current = jumpHeight;
      setGameState(prev => ({ ...prev, dinoY: jumpHeight }));
      if (jumpHeight >= 100) {
        clearInterval(jumpIntervalRef.current);
        const fallDown = setInterval(() => {
          jumpHeight -= 8;
          dinoYRef.current = Math.max(0, jumpHeight);
          setGameState(prev => ({ ...prev, dinoY: Math.max(0, jumpHeight) }));
          if (jumpHeight <= 0) {
            clearInterval(fallDown);
            setGameState(prev => ({ 
              ...prev, 
              isJumping: false,
              hasDoubleJumped: false,
              dinoY: 0 
            }));
            dinoYRef.current = 0;
          }
        }, 20);
      }
    }, 20);
  }, [gameState.gameOver, gameState.gameStarted, gameState.isJumping, gameState.canDoubleJump, gameState.hasDoubleJumped]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Main game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const speedMultiplier = gameState.slowMoActive ? 0.5 : 1;
    const baseSpeed = Math.min(gameState.speed + Math.floor(gameState.score / 500), 15);

    gameLoopRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.gameOver) return prev;

        const currentSpeed = baseSpeed * speedMultiplier;
        
        // Move obstacles
        let newObstacles = prev.obstacles
          .map(o => ({ ...o, x: o.x - currentSpeed }))
          .filter(o => o.x > -50);
        
        // Add new obstacle
        if (newObstacles.length === 0 || newObstacles[newObstacles.length - 1]?.x < 300) {
          if (Math.random() < 0.025) {
            const types: ('cactus' | 'bird' | 'meteor')[] = ['cactus', 'bird', 'meteor'];
            const typeRoll = Math.random();
            let type: 'cactus' | 'bird' | 'meteor' = 'cactus';
            if (typeRoll > 0.85) type = 'meteor';
            else if (typeRoll > 0.65) type = 'bird';
            
            newObstacles.push({ x: 550, type });
          }
        }

        // Move and spawn power-ups
        let newPowerUps = prev.powerUps
          .map(p => ({ ...p, x: p.x - currentSpeed }))
          .filter(p => p.x > -50);

        if (Math.random() < 0.005 && newPowerUps.length < 2) {
          const types: PowerUp['type'][] = ['shield', 'doubleJump', 'slowMo', 'magnet', 'multiplier'];
          newPowerUps.push({
            x: 550,
            type: types[Math.floor(Math.random() * types.length)],
          });
        }

        // Move and spawn coins
        let newCoins = prev.coins
          .map(c => ({ ...c, x: c.x - currentSpeed }))
          .filter(c => c.x > -30 && !c.collected);

        if (Math.random() < 0.03) {
          newCoins.push({
            x: 550,
            y: 40 + Math.random() * 80,
            collected: false,
          });
        }

        // Update particles
        let newParticles = prev.particles
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: p.life - 1,
          }))
          .filter(p => p.life > 0);

        // Check power-up collection
        const dinoLeft = 50;
        const dinoRight = 90;
        const dinoBottom = dinoYRef.current;
        const dinoTop = dinoYRef.current + 50;

        let hasShield = prev.hasShield;
        let shieldTimer = prev.shieldTimer;
        let canDoubleJump = prev.canDoubleJump;
        let slowMoActive = prev.slowMoActive;
        let slowMoTimer = prev.slowMoTimer;
        let scoreMultiplier = prev.scoreMultiplier;
        let multiplierTimer = prev.multiplierTimer;

        newPowerUps = newPowerUps.filter(p => {
          const collected = (
            dinoRight > p.x &&
            dinoLeft < p.x + 30 &&
            dinoTop > 60 &&
            dinoBottom < 100
          );
          
          if (collected) {
            // Add collection particles
            const particles: Particle[] = Array.from({ length: 10 }, () => ({
              x: p.x,
              y: 80,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 25,
              color: p.type === 'shield' ? '#3b82f6' : 
                     p.type === 'doubleJump' ? '#22c55e' :
                     p.type === 'slowMo' ? '#a855f7' :
                     p.type === 'magnet' ? '#ef4444' : '#eab308',
            }));
            newParticles = [...newParticles, ...particles];

            switch (p.type) {
              case 'shield':
                hasShield = true;
                shieldTimer = 300;
                toast.success('🛡️ Shield activated!');
                break;
              case 'doubleJump':
                canDoubleJump = true;
                toast.success('🦘 Double Jump unlocked!');
                break;
              case 'slowMo':
                slowMoActive = true;
                slowMoTimer = 200;
                toast.success('⏱️ Slow Motion!');
                break;
              case 'multiplier':
                scoreMultiplier = 2;
                multiplierTimer = 300;
                toast.success('⭐ 2x Score!');
                break;
              case 'magnet':
                // Collect all nearby coins
                newCoins = newCoins.map(c => {
                  if (Math.abs(c.x - 70) < 200) {
                    return { ...c, collected: true };
                  }
                  return c;
                });
                toast.success('🧲 Coin Magnet!');
                break;
            }
          }
          return !collected;
        });

        // Check coin collection
        let coinsCollected = prev.coinsCollected;
        let combo = prev.combo;
        let maxCombo = prev.maxCombo;

        newCoins = newCoins.map(c => {
          if (c.collected) return c;
          
          const collected = (
            dinoRight > c.x &&
            dinoLeft < c.x + 20 &&
            dinoTop > c.y - 20 &&
            dinoBottom < c.y + 20
          );
          
          if (collected) {
            coinsCollected += 1;
            combo += 1;
            maxCombo = Math.max(maxCombo, combo);
            
            // Add coin particles
            const particles: Particle[] = Array.from({ length: 6 }, () => ({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 20,
              color: '#fbbf24',
            }));
            newParticles = [...newParticles, ...particles];
          }
          
          return { ...c, collected };
        });

        // Update timers
        if (shieldTimer > 0) shieldTimer--;
        else hasShield = false;
        
        if (slowMoTimer > 0) slowMoTimer--;
        else slowMoActive = false;
        
        if (multiplierTimer > 0) multiplierTimer--;
        else scoreMultiplier = 1;

        // Check collision
        let gameOver = false;
        let screenShake = Math.max(0, prev.screenShake - 1);

        for (const o of newObstacles) {
          const obstacleLeft = o.x;
          const obstacleRight = o.x + 30;
          const obstacleBottom = o.type === 'bird' ? 60 : o.type === 'meteor' ? 80 : 0;
          const obstacleTop = o.type === 'bird' ? 100 : o.type === 'meteor' ? 140 : 50;

          const collision = (
            dinoRight > obstacleLeft &&
            dinoLeft < obstacleRight &&
            dinoTop > obstacleBottom &&
            dinoBottom < obstacleTop
          );

          if (collision) {
            if (hasShield) {
              hasShield = false;
              shieldTimer = 0;
              screenShake = 10;
              // Remove the obstacle
              newObstacles = newObstacles.filter(ob => ob !== o);
              
              // Add explosion particles
              const particles: Particle[] = Array.from({ length: 15 }, () => ({
                x: o.x,
                y: 70,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
              }));
              newParticles = [...newParticles, ...particles];
              toast.info('Shield blocked the hit!');
            } else {
              gameOver = true;
              screenShake = 20;
              combo = 0;
              break;
            }
          }
        }

        // Update score
        const newScore = prev.score + (1 * scoreMultiplier);
        
        // Toggle night mode every 500 points
        const isNightMode = Math.floor(newScore / 500) % 2 === 1;

        if (gameOver) {
          toast.error(`Game Over! Score: ${Math.floor(newScore)} | Coins: ${coinsCollected} | Max Combo: ${maxCombo}`);
          onScoreUpdate?.(Math.floor(newScore));
        } else if (newScore % 100 < 2) {
          onScoreUpdate?.(Math.floor(newScore));
        }

        return {
          ...prev,
          obstacles: newObstacles,
          powerUps: newPowerUps,
          coins: newCoins.filter(c => !c.collected),
          particles: newParticles,
          score: newScore,
          coinsCollected,
          combo,
          maxCombo,
          gameOver,
          isNightMode,
          hasShield,
          shieldTimer,
          canDoubleJump,
          slowMoActive,
          slowMoTimer,
          scoreMultiplier,
          multiplierTimer,
          screenShake,
        };
      });
    }, 50);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState.gameStarted, gameState.gameOver, gameState.speed, gameState.slowMoActive, onScoreUpdate]);

  const restart = () => {
    if (jumpIntervalRef.current) {
      clearInterval(jumpIntervalRef.current);
    }
    dinoYRef.current = 0;
    setGameState({
      dinoY: 0,
      isJumping: false,
      canDoubleJump: false,
      hasDoubleJumped: false,
      obstacles: [],
      powerUps: [],
      coins: [],
      particles: [],
      score: 0,
      coinsCollected: 0,
      gameOver: false,
      gameStarted: false,
      speed: 8,
      isNightMode: false,
      hasShield: false,
      shieldTimer: 0,
      slowMoActive: false,
      slowMoTimer: 0,
      scoreMultiplier: 1,
      multiplierTimer: 0,
      combo: 0,
      maxCombo: 0,
      screenShake: 0,
    });
  };

  const getPowerUpIcon = (type: PowerUp['type']) => {
    switch (type) {
      case 'shield': return '🛡️';
      case 'doubleJump': return '🦘';
      case 'slowMo': return '⏱️';
      case 'magnet': return '🧲';
      case 'multiplier': return '⭐';
    }
  };

  const shakeStyle = gameState.screenShake > 0 ? {
    transform: `translate(${Math.sin(gameState.screenShake * 2) * gameState.screenShake * 0.5}px, ${Math.cos(gameState.screenShake * 3) * gameState.screenShake * 0.3}px)`,
  } : {};

  return (
    <div className="flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="flex items-center gap-6 text-lg font-bold">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5" />
          <span>{Math.floor(gameState.score)}</span>
          {gameState.scoreMultiplier > 1 && (
            <span className="text-yellow-500 animate-pulse">x{gameState.scoreMultiplier}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-yellow-500">
          <span>🪙</span>
          <span>{gameState.coinsCollected}</span>
        </div>
        {gameState.combo > 2 && (
          <div className="flex items-center gap-2 text-orange-500 animate-bounce">
            <span>🔥</span>
            <span>x{gameState.combo}</span>
          </div>
        )}
        {gameState.isNightMode ? (
          <Moon className="w-5 h-5 text-indigo-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </div>

      {/* Active Power-ups */}
      <div className="flex gap-2 h-8">
        {gameState.hasShield && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full text-sm animate-pulse">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-blue-500">{Math.ceil(gameState.shieldTimer / 20)}s</span>
          </div>
        )}
        {gameState.canDoubleJump && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full text-sm">
            <span>🦘</span>
            <span className="text-green-500">2x Jump</span>
          </div>
        )}
        {gameState.slowMoActive && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full text-sm animate-pulse">
            <span>⏱️</span>
            <span className="text-purple-500">{Math.ceil(gameState.slowMoTimer / 20)}s</span>
          </div>
        )}
      </div>
      
      <div 
        className={`relative w-[500px] h-[200px] max-w-full rounded-lg border-2 border-primary overflow-hidden cursor-pointer transition-all duration-500 ${
          gameState.isNightMode 
            ? 'bg-gradient-to-b from-indigo-950 to-slate-900' 
            : 'bg-gradient-to-b from-sky-200 to-sky-100'
        }`}
        onClick={jump}
        style={shakeStyle}
      >
        {/* Ground */}
        <div className={`absolute bottom-0 left-0 right-0 h-10 transition-colors duration-500 ${
          gameState.isNightMode 
            ? 'bg-gradient-to-t from-slate-800 to-slate-700' 
            : 'bg-gradient-to-t from-amber-700 to-amber-600'
        }`} />
        
        {/* Stars (night mode) */}
        {gameState.isNightMode && (
          <>
            <div className="absolute top-4 left-20 text-lg animate-pulse">⭐</div>
            <div className="absolute top-12 left-60 text-sm animate-pulse delay-100">✨</div>
            <div className="absolute top-6 right-40 text-xs animate-pulse delay-200">⭐</div>
            <div className="absolute top-16 right-20 text-lg animate-pulse delay-300">✨</div>
          </>
        )}
        
        {/* Clouds */}
        {!gameState.isNightMode && (
          <>
            <div className="absolute top-4 left-20 text-4xl opacity-50">☁️</div>
            <div className="absolute top-8 left-60 text-2xl opacity-50">☁️</div>
            <div className="absolute top-2 right-20 text-3xl opacity-50">☁️</div>
          </>
        )}

        {/* Particles */}
        {gameState.particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: p.x,
              bottom: p.y,
              backgroundColor: p.color,
              opacity: p.life / 30,
            }}
          />
        ))}

        {/* Coins */}
        {gameState.coins.map((coin, i) => (
          <div
            key={i}
            className="absolute text-xl animate-spin-slow"
            style={{ left: coin.x, bottom: coin.y }}
          >
            🪙
          </div>
        ))}

        {/* Power-ups */}
        {gameState.powerUps.map((powerUp, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce"
            style={{ left: powerUp.x, bottom: 70 }}
          >
            {getPowerUpIcon(powerUp.type)}
          </div>
        ))}

        {/* Dino */}
        <div
          className={`absolute text-4xl transition-transform ${gameState.slowMoActive ? 'animate-pulse' : ''}`}
          style={{ left: 50, bottom: 40 + gameState.dinoY }}
        >
          <span className="relative">
            🦖
            {gameState.hasShield && (
              <span className="absolute -inset-2 border-2 border-blue-500 rounded-full animate-pulse opacity-60" />
            )}
          </span>
        </div>

        {/* Obstacles */}
        {gameState.obstacles.map((obstacle, i) => (
          <div
            key={i}
            className={`absolute text-3xl ${obstacle.type === 'meteor' ? 'animate-pulse text-orange-500' : ''}`}
            style={{ 
              left: obstacle.x, 
              bottom: obstacle.type === 'bird' ? 80 : obstacle.type === 'meteor' ? 100 : 40 
            }}
          >
            {obstacle.type === 'bird' ? '🦅' : obstacle.type === 'meteor' ? '☄️' : '🌵'}
          </div>
        ))}

        {!gameState.gameStarted && !gameState.gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
              <p className="text-2xl font-bold mb-2">🦖 Dino Run</p>
              <p className="text-lg mb-4">Tap or Press Space to Start!</p>
              <div className="flex gap-2 justify-center text-sm opacity-80">
                <span>🛡️ Shield</span>
                <span>🦘 Double Jump</span>
                <span>⏱️ Slow-Mo</span>
              </div>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center space-y-3">
              <p className="text-white text-2xl font-bold">Game Over!</p>
              <div className="flex gap-4 text-white">
                <div className="text-center">
                  <p className="text-2xl text-primary">{Math.floor(gameState.score)}</p>
                  <p className="text-xs opacity-60">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-yellow-500">{gameState.coinsCollected}</p>
                  <p className="text-xs opacity-60">Coins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl text-orange-500">{gameState.maxCombo}</p>
                  <p className="text-xs opacity-60">Max Combo</p>
                </div>
              </div>
              <Button onClick={restart} variant="gaming" className="mt-2">Play Again</Button>
            </div>
          </div>
        )}
      </div>

      <Button onClick={jump} variant="gaming" size="lg" className="w-40">
        JUMP 🦘
      </Button>
      
      <p className="text-sm text-muted-foreground">Tap, click, or press Space/Up to jump • Collect power-ups!</p>
    </div>
  );
};

export default DinoRun;
