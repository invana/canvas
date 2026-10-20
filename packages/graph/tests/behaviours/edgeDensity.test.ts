import { describe, expect, it } from 'vitest';
import { EDGE_DENSITY, edgeAlphaForCount, edgesThinned } from '../../src/behaviours/edgeDensity';

describe('edge density', () => {
  it('fades past the threshold and never below the floor', () => {
    expect(edgeAlphaForCount(120)).toBe(1);
    expect(edgeAlphaForCount(800)).toBeCloseTo(0.5);
    expect(edgeAlphaForCount(1_000_000)).toBe(EDGE_DENSITY.minAlpha);
  });

  it('thins a large graph only while zoomed out', () => {
    expect(edgesThinned(2500, 0.14)).toBe(true);
    expect(edgesThinned(2500, 0.9)).toBe(false);
    expect(edgesThinned(120, 0.14)).toBe(false);
  });
});
