import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuizGameProps {
  onScoreUpdate?: (score: number) => void;
}

type Question = {
  question: string;
  options: string[];
  correct: number;
  category: string;
};

const QUESTIONS: Question[] = [
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2, category: "Geography" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, category: "Science" },
  { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"], correct: 2, category: "Art" },
  { question: "What is 12 × 12?", options: ["124", "144", "132", "156"], correct: 1, category: "Math" },
  { question: "Which element has the symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Oganesson"], correct: 1, category: "Science" },
  { question: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, category: "History" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, category: "Geography" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], correct: 1, category: "Literature" },
  { question: "What is the chemical formula for water?", options: ["CO2", "H2O", "NaCl", "O2"], correct: 1, category: "Science" },
  { question: "Which country invented pizza?", options: ["France", "USA", "Italy", "Greece"], correct: 2, category: "Food" },
];

const QuizGame: React.FC<QuizGameProps> = ({ onScoreUpdate }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const startGame = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    setShuffledQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(15);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleAnswer(-1); // Time's up
          return 15;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, showResult, currentQuestion]);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);

    const question = shuffledQuestions[currentQuestion];
    if (index === question.correct) {
      const points = 100 + timeLeft * 5;
      setScore(s => s + points);
      toast.success(`Correct! +${points} points`);
    } else {
      toast.error(`Wrong! The answer was: ${question.options[question.correct]}`);
    }

    setTimeout(() => {
      if (currentQuestion < shuffledQuestions.length - 1) {
        setCurrentQuestion(q => q + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(15);
      } else {
        setIsPlaying(false);
        const finalScore = score + (index === question.correct ? 100 + timeLeft * 5 : 0);
        onScoreUpdate?.(finalScore);
        toast.success(`Quiz complete! Final score: ${finalScore}`);
      }
    }, 1500);
  };

  const getButtonColor = (index: number) => {
    if (!showResult) return 'bg-muted hover:bg-muted/80';
    if (index === shuffledQuestions[currentQuestion]?.correct) return 'bg-green-500 text-white';
    if (index === selectedAnswer) return 'bg-red-500 text-white';
    return 'bg-muted opacity-50';
  };

  if (!isPlaying && shuffledQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-primary">Quiz Challenge</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Answer 5 questions as fast as you can! Faster answers = more points!
        </p>
        <Button onClick={startGame} variant="gaming" size="lg">Start Quiz</Button>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-primary">Quiz Complete!</h2>
        <div className="text-4xl font-bold text-secondary">{score}</div>
        <p className="text-muted-foreground">Final Score</p>
        <Button onClick={startGame} variant="gaming" size="lg">Play Again</Button>
      </div>
    );
  }

  const question = shuffledQuestions[currentQuestion];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex justify-between w-full">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestion + 1}/{shuffledQuestions.length}
        </div>
        <div className="text-sm text-primary font-bold">Score: {score}</div>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-full rounded-full transition-all ${timeLeft <= 5 ? 'bg-red-500' : 'bg-primary'}`}
          style={{ width: `${(timeLeft / 15) * 100}%` }}
        />
      </div>

      <div className="text-center">
        <span className="px-2 py-1 bg-secondary/20 rounded text-xs text-secondary">
          {question.category}
        </span>
      </div>

      <div className="text-xl font-bold text-center p-4 bg-card rounded-xl border border-border w-full">
        {question.question}
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`p-4 rounded-xl font-medium transition-all text-left ${getButtonColor(index)}`}
            onClick={() => handleAnswer(index)}
            disabled={showResult}
          >
            <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>

      <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
        {timeLeft}s
      </div>
    </div>
  );
};

export default QuizGame;
