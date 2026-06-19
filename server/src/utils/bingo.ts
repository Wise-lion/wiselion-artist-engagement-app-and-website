// Bingo card generation + win validation.
// A card grid is number[5][5]. Columns follow standard BINGO ranges:
//   col0 (B): 1-15, col1 (I): 16-30, col2 (N): 31-45, col3 (G): 46-60, col4 (O): 61-75
// The center cell [2][2] is the FREE space, stored as 0.

import crypto from 'crypto';

export type Grid = number[][];

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
];

// Fisher-Yates shuffle using crypto for unbiased randomness.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate a single valid 5x5 card.
export function generateCard(): Grid {
  const grid: Grid = [[], [], [], [], []]; // rows
  for (let col = 0; col < 5; col++) {
    const [lo, hi] = COLUMN_RANGES[col];
    const pool: number[] = [];
    for (let n = lo; n <= hi; n++) pool.push(n);
    const picked = shuffle(pool).slice(0, 5); // 5 numbers for this column
    for (let row = 0; row < 5; row++) {
      grid[row][col] = picked[row];
    }
  }
  grid[2][2] = 0; // free center
  return grid;
}

// Stable signature so we can guarantee uniqueness across generated cards.
function cardSignature(grid: Grid): string {
  return grid.map((row) => row.join('-')).join('|');
}

// Generate `count` unique cards (default 1000) for a game.
export function generateUniqueCards(count = 1000): Grid[] {
  const cards: Grid[] = [];
  const seen = new Set<string>();
  // Guard against an impossible loop; collisions are astronomically rare here.
  let safety = count * 50;
  while (cards.length < count && safety-- > 0) {
    const card = generateCard();
    const sig = cardSignature(card);
    if (seen.has(sig)) continue;
    seen.add(sig);
    cards.push(card);
  }
  return cards;
}

/**
 * checkBingoWin — returns true if the card has any complete line.
 * A cell is "marked" when it's the free center (0) or its number was drawn.
 * Checks: 5 rows, 5 columns, 2 diagonals.
 */
export function checkBingoWin(grid: Grid, drawnNumbers: number[]): boolean {
  const drawn = new Set(drawnNumbers);
  const marked = (r: number, c: number): boolean => {
    const v = grid[r][c];
    return v === 0 || drawn.has(v);
  };

  // Rows
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => marked(r, c))) return true;
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => marked(r, c))) return true;
  }
  // Diagonals
  if ([0, 1, 2, 3, 4].every((i) => marked(i, i))) return true;
  if ([0, 1, 2, 3, 4].every((i) => marked(i, 4 - i))) return true;

  return false;
}

// Draw the next unique number (1-75) not already drawn.
export function drawNextNumber(alreadyDrawn: number[]): number | null {
  if (alreadyDrawn.length >= 75) return null;
  const remaining: number[] = [];
  const drawn = new Set(alreadyDrawn);
  for (let n = 1; n <= 75; n++) if (!drawn.has(n)) remaining.push(n);
  return remaining[crypto.randomInt(0, remaining.length)];
}
