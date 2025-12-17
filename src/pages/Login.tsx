import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, bannedUsers } = useGame();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const success = login(username, password);
        if (success) {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        } else {
          toast({
            title: 'Login failed',
            description: 'Invalid username or password, or account is banned.',
            variant: 'destructive',
          });
        }
      } else {
        if (password !== confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match.',
            variant: 'destructive',
          });
          return;
        }
        
        if (username.length < 3) {
          toast({
            title: 'Error',
            description: 'Username must be at least 3 characters.',
            variant: 'destructive',
          });
          return;
        }

        if (password.length < 6) {
          toast({
            title: 'Error',
            description: 'Password must be at least 6 characters.',
            variant: 'destructive',
          });
          return;
        }

        const success = register(username, password);
        if (success) {
          toast({
            title: 'Account created!',
            description: 'Welcome to Nexus Games!',
          });
          navigate('/');
        } else {
          toast({
            title: 'Registration failed',
            description: 'Username already exists.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-neon-cyan">
            <Gamepad2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-gradient">NEXUS GAMES</span>
        </Link>

        {/* Form Card */}
        <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl">
          <h1 className="font-display text-2xl font-bold text-center mb-2">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin ? 'Sign in to continue your gaming journey' : 'Join thousands of players today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12 bg-muted border-border"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-muted border-border"
                required
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 bg-muted border-border"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="gaming"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link to="/recovery" className="text-sm text-muted-foreground hover:text-primary">
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Demo Account Hint */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">
              <strong className="text-primary">Tip:</strong> Create an account with username "admin" to access the admin panel!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
