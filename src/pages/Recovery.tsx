import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Seo from '@/components/Seo';

const Recovery: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.length < 3) {
      toast({
        title: 'Error',
        description: 'Please enter a valid username.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: 'Recovery Initiated',
      description: 'If this account exists, you will receive recovery instructions.',
    });
  };

  return (
    <>
      <Seo
        title="Account Recovery — Glitch Games"
        description="Recover your Glitch Games account. Enter your username to receive recovery instructions and regain access to your profile, coins, and achievements."
        path="/recovery"
      />
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
          <span className="font-display text-2xl font-bold text-gradient">GLITCH GAMES</span>
        </Link>

        {/* Form Card */}
        <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl">
          {!isSubmitted ? (
            <>
              <h1 className="font-display text-2xl font-bold text-center mb-2">
                Account Recovery
              </h1>
              <p className="text-muted-foreground text-center mb-6">
                Enter your username and we'll help you recover your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 bg-muted border-border"
                    required
                  />
                </div>

                <Button type="submit" variant="gaming" size="lg" className="w-full">
                  <Send className="w-5 h-5 mr-2" />
                  Send Recovery Instructions
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">
                Check Your Account
              </h1>
              <p className="text-muted-foreground mb-6">
                If the username "{username}" exists, recovery instructions have been sent. 
                Please check any associated recovery methods.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                <strong>Note:</strong> This is a demo system. In a real application, 
                this would send an email or SMS with recovery instructions.
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link to="/login" className="flex items-center justify-center gap-2 text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Recovery;
