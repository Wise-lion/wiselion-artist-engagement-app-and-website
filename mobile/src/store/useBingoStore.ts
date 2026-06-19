import { create } from 'zustand';

export type Grid = number[][];
export interface MyCard {
  id: string;
  cardId: string;
  grid: Grid;
  isWinner: boolean;
}

interface BingoState {
  gameId: string | null;
  drawnNumbers: number[];
  lastNumber: number | null;
  myCards: MyCard[];
  winner: { winnerId: string; winnerName?: string; share: number } | null;

  setGame: (gameId: string, drawnNumbers: number[]) => void;
  setMyCards: (cards: MyCard[]) => void;
  addNumber: (n: number) => void;
  setWinner: (w: BingoState['winner']) => void;
  reset: () => void;
}

export const useBingoStore = create<BingoState>((set) => ({
  gameId: null,
  drawnNumbers: [],
  lastNumber: null,
  myCards: [],
  winner: null,

  setGame: (gameId, drawnNumbers) => set({ gameId, drawnNumbers }),
  setMyCards: (myCards) => set({ myCards }),
  addNumber: (n) =>
    set((s) => (s.drawnNumbers.includes(n) ? s : { drawnNumbers: [...s.drawnNumbers, n], lastNumber: n })),
  setWinner: (winner) => set({ winner }),
  reset: () => set({ gameId: null, drawnNumbers: [], lastNumber: null, myCards: [], winner: null }),
}));
