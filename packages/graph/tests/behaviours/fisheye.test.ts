import { describe, expect, it } from 'vitest';

import { fisheyeDisplace } from '../../src/behaviours/fisheye';

/** Drawn distance from the focus for a point at `dist` along +x. */
function drawnDistance(dist: number, r: number, d: number): number {
  const res = fisheyeDisplace(dist, 0, 0, 0, r, d, 1);
  if (!res) throw new Error('outside lens');
  return dist + res.dx;
}

describe('fisheyeDisplace', () => {
  it('leaves the focus in place and scales it fully', () => {
    expect(fisheyeDisplace(5, 5, 5, 5, 100, 2, 1.5)).toEqual({ dx: 0, dy: 0, scale: 1.5 });
  });

  it('is continuous at the rim — no move, no scale', () => {
    const res = fisheyeDisplace(100, 0, 0, 0, 100, 3, 2)!;
    expect(res.dx).toBeCloseTo(0, 9);
    expect(res.dy).toBeCloseTo(0, 9);
    expect(res.scale).toBeCloseTo(1, 9);
  });

  it('returns null outside the lens', () => {
    expect(fisheyeDisplace(101, 0, 0, 0, 100, 1.5, 1.5)).toBeNull();
  });

  it('is the identity when distortion is 0', () => {
    const res = fisheyeDisplace(30, -40, 0, 0, 100, 0, 1)!;
    expect(res.dx).toBeCloseTo(0, 9);
    expect(res.dy).toBeCloseTo(0, 9);
  });

  it('pushes points outward along their own ray', () => {
    const res = fisheyeDisplace(30, 40, 0, 0, 100, 1.5, 1)!;
    // Same direction as (30, 40): the displacement is a positive multiple of it.
    expect(res.dx / 30).toBeGreaterThan(0);
    expect(res.dx / 30).toBeCloseTo(res.dy / 40, 9);
  });

  it('is monotonic in distance (never reorders points along a ray)', () => {
    let prev = -1;
    for (let dist = 0; dist <= 100; dist += 5) {
      const drawn = drawnDistance(dist, 100, 2.5);
      expect(drawn).toBeGreaterThan(prev);
      expect(drawn).toBeLessThanOrEqual(100 + 1e-9);
      prev = drawn;
    }
  });

  it('matches the Sarkar–Brown map', () => {
    // dist' = (d+1)·r·dist / (d·dist + r) with r=100, d=1.5, dist=20 → 50/1.3
    expect(drawnDistance(20, 100, 1.5)).toBeCloseTo((2.5 * 100 * 20) / (1.5 * 20 + 100), 9);
  });

  it('eases the size multiplier linearly to 1 at the rim', () => {
    expect(fisheyeDisplace(50, 0, 0, 0, 100, 1, 2)!.scale).toBeCloseTo(1.5, 9);
  });
});
