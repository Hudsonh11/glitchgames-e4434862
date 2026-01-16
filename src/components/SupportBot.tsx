import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Zap, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import BugReportModal from '@/components/BugReportModal';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

const SupportBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey there! 🎮 I'm Pixel, your gaming assistant. Need help with a game, your account, or just want to chat? I'm here for you!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage].slice(-10) }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2].role === 'user') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Something went wrong. Please try again! 🎮" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button with enhanced design */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl transition-all duration-500 group",
          "bg-gradient-to-br from-primary via-secondary to-accent hover:from-secondary hover:via-primary hover:to-accent",
          "border-2 border-primary/30 hover:border-primary/60",
          isOpen ? "rotate-180 scale-95" : "hover:scale-110 animate-pulse-glow"
        )}
        size="icon"
      >
        <div className="relative">
          {isOpen ? (
            <X className="h-7 w-7 transition-transform duration-300" />
          ) : (
            <>
              <Bot className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-warning animate-pulse" />
            </>
          )}
        </div>
        
        {/* Pulse rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </Button>

      {/* Chat Window with enhanced design */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-3xl",
          "border-2 border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl",
          "animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500"
        )}>
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-t-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
            
            <div className="relative flex items-center gap-4 px-5 py-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-sm border border-white/20">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-white animate-pulse" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-white">Pixel</h3>
                  <Zap className="h-4 w-4 text-warning animate-pulse" />
                </div>
                <p className="text-xs text-white/80">AI Gaming Assistant • Online</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[380px] p-4" ref={scrollRef}>
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300",
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-secondary to-accent' 
                      : 'bg-gradient-to-br from-primary to-secondary'
                  )}>
                    {msg.role === 'user' ? 
                      <User className="h-5 w-5 text-white" /> : 
                      <Bot className="h-5 w-5 text-white" />
                    }
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm max-w-[75%] shadow-lg",
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md' 
                      : 'bg-muted/80 text-foreground rounded-bl-md border border-border/50'
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                    <Bot className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-muted/80 border border-border/50 px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-secondary" style={{ animationDelay: '150ms' }} />
                      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input with enhanced design */}
          <div className="border-t border-border/50 p-4 rounded-b-3xl bg-muted/30">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl border-border/50 bg-background/80 focus:border-primary/50 focus:ring-primary/20 h-12"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all duration-300",
                  "bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  input.trim() && !isLoading && "shadow-lg shadow-primary/30 hover:scale-105"
                )}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Quick suggestions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {['How do I play?', 'Account help', 'Game tips'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                >
                  {suggestion}
                </button>
              ))}
              <button
                onClick={() => setIsBugReportOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-warning/20 hover:bg-warning/30 text-warning transition-colors border border-warning/50 flex items-center gap-1"
              >
                <Bug className="w-3 h-3" />
                Report Bug
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bug Report Modal */}
      <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
    </>
  );
};

export default SupportBot;
