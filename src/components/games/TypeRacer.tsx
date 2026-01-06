import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, Play } from 'lucide-react';

const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "The five boxing wizards jump quickly.",
  "Sphinx of black quartz judge my vow.",
  "Two driven jocks help fax my big quiz.",
  "Crazy Frederick bought many very exquisite opal jewels.",
  "We promptly judged antique ivory buckles for the next prize.",
];

const TypeRacer: React.FC = () => {
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const startGame = () => {
    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    setCurrentSentence(sentence);
    setUserInput('');
    setStarted(true);
    setFinished(false);
    setStartTime(Date.now());
    setWpm(0);
    setAccuracy(100);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  
  useEffect(() => {
    if (started && userInput === currentSentence) {
      setFinished(true);
      const timeElapsed = (Date.now() - (startTime || Date.now())) / 1000 / 60;
      const words = currentSentence.split(' ').length;
      setWpm(Math.round(words / timeElapsed));
    }
  }, [userInput, currentSentence, started, startTime]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === currentSentence[i]) correct++;
    }
    setAccuracy(Math.round((correct / value.length) * 100) || 100);
    
    // Update WPM in real-time
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
      const wordsTyped = value.trim().split(' ').filter(w => w).length;
      setWpm(Math.round(wordsTyped / timeElapsed) || 0);
    }
  };
  
  const getCharClass = (index: number) => {
    if (index >= userInput.length) return 'text-muted-foreground';
    return userInput[index] === currentSentence[index] ? 'text-success' : 'text-destructive bg-destructive/20';
  };
  
  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Type Racer</h2>
        <p className="text-muted-foreground">Type the sentence as fast as you can!</p>
      </div>
      
      <div className="flex gap-8 text-center">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-3xl font-bold text-primary">{wpm}</div>
          <div className="text-sm text-muted-foreground">WPM</div>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className={`text-3xl font-bold ${accuracy >= 90 ? 'text-success' : accuracy >= 70 ? 'text-warning' : 'text-destructive'}`}>
            {accuracy}%
          </div>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </div>
      </div>
      
      {!started ? (
        <Button onClick={startGame} variant="gaming" size="lg">
          <Play className="w-5 h-5 mr-2" /> Start Race
        </Button>
      ) : (
        <>
          <div className="bg-card p-6 rounded-xl border border-border w-full">
            <p className="text-xl leading-relaxed font-mono">
              {currentSentence.split('').map((char, i) => (
                <span key={i} className={getCharClass(i)}>
                  {char}
                </span>
              ))}
            </p>
          </div>
          
          <Input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            disabled={finished}
            placeholder="Start typing..."
            className="text-lg font-mono"
          />
          
          {finished && (
            <div className="text-center animate-bounce">
              <div className="text-2xl font-bold text-success mb-2">🏁 Race Complete!</div>
              <p className="text-muted-foreground">
                {wpm} WPM with {accuracy}% accuracy
              </p>
              <Button onClick={startGame} variant="outline" className="mt-4">
                <RotateCcw className="w-4 h-4 mr-2" /> Race Again
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TypeRacer;
