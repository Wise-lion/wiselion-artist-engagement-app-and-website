import { generateCard, generateUniqueCards, checkBingoWin, drawNextNumber, Grid } from './bingo';

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 15], [16, 30], [31, 45], [46, 60], [61, 75],
];

describe('generateCard', () => {
  it('produces a 5x5 grid with a free center', () => {
    const g = generateCard();
    expect(g).toHaveLength(5);
    g.forEach((row) => expect(row).toHaveLength(5));
    expect(g[2][2]).toBe(0); // free space
  });

  it('keeps every column within its BINGO range', () => {
    for (let trial = 0; trial < 50; trial++) {
      const g = generateCard();
      for (let col = 0; col < 5; col++) {
        const [lo, hi] = COLUMN_RANGES[col];
        for (let row = 0; row < 5; row++) {
          if (row === 2 && col === 2) continue; // free
          expect(g[row][col]).toBeGreaterThanOrEqual(lo);
          expect(g[row][col]).toBeLessThanOrEqual(hi);
        }
      }
    }
  });

  it('has no duplicate numbers within a column', () => {
    for (let trial = 0; trial < 50; trial++) {
      const g = generateCard();
      for (let col = 0; col < 5; col++) {
        const colVals = [0, 1, 2, 3, 4]
          .map((r) => g[r][col])
          .filter((v) => v !== 0);
        expect(new Set(colVals).size).toBe(colVals.length);
      }
    }
  });
});

describe('generateUniqueCards', () => {
  it('generates the requested count, all unique', () => {
    const cards = generateUniqueCards(1000);
    expect(cards).toHaveLength(1000);
    const sigs = new Set(cards.map((c) => c.map((r) => r.join('-')).join('|')));
    expect(sigs.size).toBe(1000);
  });
});

describe('checkBingoWin', () => {
  // Fixed grid for deterministic line tests (col ranges respected; center free).
  const grid: Grid = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, 0, 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65],
  ];

  it('detects a full top row', () => {
    expect(checkBingoWin(grid, [1, 16, 31, 46, 61])).toBe(true);
  });

  it('detects a full first column', () => {
    expect(checkBingoWin(grid, [1, 2, 3, 4, 5])).toBe(true);
  });

  it('detects the main diagonal using the free center', () => {
    // diagonal cells: 1, 17, FREE, 49, 65 → free counts automatically
    expect(checkBingoWin(grid, [1, 17, 49, 65])).toBe(true);
  });

  it('detects the anti-diagonal', () => {
    // cells: 61, 47, FREE, 19, 5
    expect(checkBingoWin(grid, [61, 47, 19, 5])).toBe(true);
  });

  it('returns false for an incomplete line', () => {
    expect(checkBingoWin(grid, [1, 16, 31, 46])).toBe(false); // missing 61
  });

  it('does not falsely win from scattered marks', () => {
    expect(checkBingoWin(grid, [1, 17, 34, 50, 61])).toBe(false);
  });
});

describe('drawNextNumber', () => {
  it('never repeats and stays within 1..75 over a full draw', () => {
    const drawn: number[] = [];
    for (let i = 0; i < 75; i++) {
      const n = drawNextNumber(drawn);
      expect(n).not.toBeNull();
      expect(n!).toBeGreaterThanOrEqual(1);
      expect(n!).toBeLessThanOrEqual(75);
      expect(drawn).not.toContain(n!);
      drawn.push(n!);
    }
    expect(new Set(drawn).size).toBe(75);
  });

  it('returns null once all 75 are drawn', () => {
    const all = Array.from({ length: 75 }, (_, i) => i + 1);
    expect(drawNextNumber(all)).toBeNull();
  });
});
