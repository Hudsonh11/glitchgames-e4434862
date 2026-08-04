import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { playSfx } from '@/lib/sfx';

type Cell = 0 | 1 | 2; // 0 empty, 1 player (black), 2 bot (white)
const SIZE = 8;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

const initialBoard = (): Cell[][] => {
  const b: Cell[][] = Array.from({ length: SIZE }, () => Array< Cell>(SIZE).fill(0) as Cell[]);
  b[3][3] = 2; b[4][4] = 2; b[3][4] = 1; b[4][3] = 1;
  return b;
};

const flipsFor = (board: Cell[][], r: number, c: number, player: Cell): [number, number][] => {
  if (board[r][c] !== 0) return [];
  const out: [number, number][] = [];
  const opp = player === 1 ? 2 : 1;
  for (const [dr, dc] of DIRS) {
    const line: [number, number][] = [];
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[rr][cc] === opp) {
      line.push([rr, cc]); rr += dr; cc += dc;
    }
    if (line.length && rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[rr][cc] === player) out.push(...line);
  }
  return out;
};

const legalMoves = (board: Cell[][], player: Cell) => {
  const moves: { r: number; c: number; flips: [number, number][] }[] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const f = flipsFor(board, r, c, player);
    if (f.length) moves.push({ r, c, flips: f });
  }
  return moves;
};

const countDiscs = (board: Cell[][]) => {
  let p = 0, b = 0;
  for (const row of board) for (const cell of row) { if (cell === 1) p++; else if (cell === 2) b++; }
  return { p, b };
};

const Reversi: React.FC = () => {
  const [board, setBoard] = useState<Cell[][]>(initialBoard);
  const [turn, setTurn] = useState<Cell>(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Your move — place a black disc');
  const [rewarded, setRewarded] = useState(false);
  const { updateGameStats, addCoins } = useGame();

  const { p, b } = countDiscs(board);
  const myMoves = legalMoves(board, 1);

  const applyMove = useCallback((base: Cell[][], r: number, c: number, player: Cell) => {
    const flips = flipsFor(base, r, c, player);
    if (!flips.length) return null;
    const next = base.map((row) => [...row]) as Cell[][];
    next[r][c] = player;
    for (const [fr, fc] of flips) next[fr][fc] = player;
    return next;
  }, []);

  const finish = useCallback((finalBoard: Cell[][]) => {
    setGameOver(true);
    const { p: mine, b: bot } = countDiscs(finalBoard);
    setMessage(mine > bot ? `You win ${mine}–${bot}!` : mine === bot ? `Draw ${mine}–${bot}` : `Bot wins ${bot}–${mine}`);
    playSfx(mine > bot ? 'win' : 'lose');
    if (!rewarded) {
      setRewarded(true);
      const score = mine * (mine > bot ? 2 : 1);
      updateGameStats('reversi', score, 0);
      addCoins(mine > bot ? mine * 2 : Math.floor(mine / 2));
    }
  }, [rewarded, updateGameStats, addCoins]);

  const play = (r: number, c: number) => {
    if (gameOver || turn !== 1) return;
    const next = applyMove(board, r, c, 1);
    if (!next) return;
    playSfx('pop');
    setBoard(next);
    setTurn(2);
  };

  // Bot turn + pass handling
  useEffect(() => {
    if (gameOver) return;
    const mine = legalMoves(board, 1);
    const theirs = legalMoves(board, 2);
    if (!mine.length && !theirs.length) { finish(board); return; }

    if (turn === 1 && !mine.length) {
      setMessage('No moves for you — turn passed');
      const t = setTimeout(() => setTurn(2), 700);
      return () => clearTimeout(t);
    }
    if (turn === 2) {
      if (!theirs.length) {
        setMessage('Bot has no moves — your turn again');
        const t = setTimeout(() => setTurn(1), 700);
        return () => clearTimeout(t);
      }
      setMessage('Bot is thinking…');
      const t = setTimeout(() => {
        let best = theirs[0];
        let bestScore = -Infinity;
        for (const m of theirs) {
          const sim = applyMove(board, m.r, m.c, 2)!;
          let s = WEIGHTS[m.r][m.c] + m.flips.length;
          // Penalise giving the player corner access
          s -= legalMoves(sim, 1).filter((o) => (o.r === 0 || o.r === 7) && (o.c === 0 || o.c === 7)).length * 60;
          if (s > bestScore) { bestScore = s; best = m; }
        }
        const next = applyMove(board, best.r, best.c, 2)!;
        playSfx('click');
        setBoard(next);
        setTurn(1);
        setMessage('Your move');
      }, 550);
      return () => clearTimeout(t);
    }
  }, [turn, board, gameOver, applyMove, finish]);

  const reset = () => {
    setBoard(initialBoard());
    setTurn(1);
    setGameOver(false);
    setRewarded(false);
    setMessage('Your move — place a black disc');
  };

  const hint = new Set(turn === 1 && !gameOver ? myMoves.map((m) => `${m.r}-${m.c}`) : []);

  return (
    <div className="w-full max-w-md mx-auto text-center animate-fade-in">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-foreground border border-border inline-block" />
          <span className="font-bold">You {p}</span>
        </div>
        <span className="text-xs text-muted-foreground">{message}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{b} Bot</span>
          <span className="w-5 h-5 rounded-full bg-background border-2 border-foreground inline-block" />
        </div>
      </div>

      <div className="grid grid-cols-8 gap-[3px] p-2 rounded-xl bg-success/20 border border-border">
        {board.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => play(r, c)}
            className="aspect-square rounded-[4px] bg-success/40 hover:bg-success/60 transition-colors flex items-center justify-center"
          >
            {cell !== 0 && (
              <span
                className={`w-[80%] h-[80%] rounded-full animate-bounce-in ${cell === 1 ? 'bg-foreground' : 'bg-background border-2 border-foreground'}`}
              />
            )}
            {cell === 0 && hint.has(`${r}-${c}`) && (
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" />
            )}
          </button>
        )))}
      </div>

      <div className="mt-4 flex gap-3 justify-center">
        <Button variant="gaming" onClick={reset}>{gameOver ? 'Play Again' : 'Restart'}</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Outflank the bot's discs to flip them. Most discs when the board fills wins.</p>
    </div>
  );
};

export default Reversi;
