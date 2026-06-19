import { selectWinnerIndex } from './lotto';

describe('selectWinnerIndex', () => {
  it('always returns an index within [0, total)', () => {
    for (const total of [1, 2, 5, 100, 9999]) {
      for (let i = 0; i < 1000; i++) {
        const idx = selectWinnerIndex(total);
        expect(Number.isInteger(idx)).toBe(true);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(total);
      }
    }
  });

  it('throws when there are no tickets', () => {
    expect(() => selectWinnerIndex(0)).toThrow();
    expect(() => selectWinnerIndex(-3)).toThrow();
  });

  it('is reasonably uniform across the ticket range', () => {
    const total = 10;
    const counts = new Array(total).fill(0);
    const draws = 60000;
    for (let i = 0; i < draws; i++) counts[selectWinnerIndex(total)]++;
    const expected = draws / total;
    // Each bucket should land within ±15% of the expected share.
    counts.forEach((c) => {
      expect(c).toBeGreaterThan(expected * 0.85);
      expect(c).toBeLessThan(expected * 1.15);
    });
  });
});
