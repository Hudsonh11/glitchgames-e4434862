import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play } from 'lucide-react';

const Solitaire: React.FC = () => {
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const [foundations, setFoundations] = useState<string[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<{ card: string; faceUp: boolean }[][]>([]);
  
  const createDeck = () => {
    const deck: string[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push(`${value}${suit}`);
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };
  
  const initGame = () => {
    const deck = createDeck();
    const newTableau: { card: string; faceUp: boolean }[][] = [];
    let deckIndex = 0;
    
    for (let i = 0; i < 7; i++) {
      newTableau[i] = [];
      for (let j = 0; j <= i; j++) {
        newTableau[i].push({
          card: deck[deckIndex++],
          faceUp: j === i
        });
      }
    }
    
    setTableau(newTableau);
    setFoundations([[], [], [], []]);
    setScore(0);
    setMoves(0);
    setGameWon(false);
  };
  
  useEffect(() => {
    initGame();
  }, []);
  
  const getCardColor = (card: string) => {
    return card.includes('♥') || card.includes('♦') ? 'text-red-500' : 'text-foreground';
  };
  
  const handleTableauClick = (pileIndex: number, cardIndex: number) => {
    const pile = tableau[pileIndex];
    if (!pile[cardIndex]?.faceUp) {
      const newTableau = [...tableau];
      newTableau[pileIndex][cardIndex].faceUp = true;
      setTableau(newTableau);
      setMoves(m => m + 1);
      setScore(s => s + 5);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-green-900/20 rounded-xl border border-green-500/30">
      <div className="flex items-center justify-between w-full max-w-2xl">
        <div className="text-lg font-bold">Score: {score}</div>
        <div className="text-lg">Moves: {moves}</div>
        <Button onClick={initGame} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" /> New Game
        </Button>
      </div>
      
      {/* Foundations */}
      <div className="flex gap-2 mb-4">
        {foundations.map((pile, i) => (
          <div
            key={i}
            className="w-16 h-24 border-2 border-dashed border-green-500/50 rounded-lg flex items-center justify-center text-2xl text-green-500/50"
          >
            {pile.length > 0 ? pile[pile.length - 1] : suits[i]}
          </div>
        ))}
      </div>
      
      {/* Tableau */}
      <div className="flex gap-2">
        {tableau.map((pile, pileIndex) => (
          <div key={pileIndex} className="relative w-16 min-h-[200px]">
            {pile.map((cardData, cardIndex) => (
              <div
                key={cardIndex}
                onClick={() => handleTableauClick(pileIndex, cardIndex)}
                className={`absolute w-16 h-24 rounded-lg border-2 flex items-center justify-center text-xl font-bold cursor-pointer transition-transform hover:scale-105 ${
                  cardData.faceUp 
                    ? `bg-card border-border ${getCardColor(cardData.card)}` 
                    : 'bg-primary/20 border-primary/50'
                }`}
                style={{ top: `${cardIndex * 25}px` }}
              >
                {cardData.faceUp ? cardData.card : '🂠'}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {gameWon && (
        <div className="text-2xl font-bold text-success animate-pulse">
          🎉 You Won! Score: {score}
        </div>
      )}
    </div>
  );
};

export default Solitaire;
