import { describe, expect, it } from 'vitest';
import { createOutline } from 'bubblesets-js';

import { LIB_CELL, createScaledOutline, normalisationFactor, type OutlineOptions } from '../src/outline';

/** Defaults the layer uses (`BUBBLE_SETS_LAYER_DEFAULTS`), in world units. */
const DEFAULTS: OutlineOptions = {
  pixelGroup: 4,
  nodeR0: 15,
  nodeR1: 50,
  edgeR0: 10,
  edgeR1: 20,
  morphBuffer: 10,
  maxRoutingIterations: 100,
  maxMarchingIterations: 20,
};

/** Square member of half-size `r` centred on `(x, y)`. */
const member = (x: number, y: number, r: number) => ({ x: x - r, y: y - r, width: 2 * r, height: 2 * r });

/**
 * Six sites spread over ~0.7 world units — the scale of one district on a
 * `MapLayer` canvas (the whole earth is 512 units there).
 */
const MAP_SITES: Array<[number, number]> = [
  [369.49, 230.78],
  [369.45, 230.64],
  [369.46, 230.67],
  [369.77, 230.95],
  [369.74, 230.16],
  [369.83, 230.31],
];

/** Map-scale options: everything a few thousandths of a world unit. */
const MAP_OPTS: OutlineOptions = {
  ...DEFAULTS,
  pixelGroup: 0.002,
  nodeR0: 0.006,
  nodeR1: 0.02,
  edgeR0: 0.004,
  edgeR1: 0.01,
  morphBuffer: 0.006,
};

describe('normalisationFactor', () => {
  it('is 1 at the library default grid, so existing users are untouched', () => {
    expect(normalisationFactor(LIB_CELL)).toBe(1);
  });

  it('scales a finer grid up to the library cell', () => {
    expect(normalisationFactor(0.002)).toBeCloseTo(2000, 6);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('falls back to 1 for %s', (bad) => {
    expect(normalisationFactor(bad)).toBe(1);
  });
});

describe('createScaledOutline', () => {
  it('is byte-identical to the library at the default grid (k = 1)', () => {
    const members = [member(100, 100, 10), member(160, 120, 10), member(130, 170, 10)];
    const direct = createOutline(members, [], [], DEFAULTS);
    const scaled = createScaledOutline(members, [], [], DEFAULTS);
    expect(scaled.points).toEqual(direct.points);
  });

  it('draws nothing when the library is fed map-scale units directly (the defect)', () => {
    const members = MAP_SITES.map(([x, y]) => member(x, y, 0.004));
    expect(createOutline(members, [], [], MAP_OPTS).length).toBe(0);
  });

  it('draws a contour at map scale (the fix)', () => {
    const members = MAP_SITES.map(([x, y]) => member(x, y, 0.004));
    expect(createScaledOutline(members, [], [], MAP_OPTS).length).toBeGreaterThan(100);
  });

  it('returns the contour in world units, around the members', () => {
    const members = MAP_SITES.map(([x, y]) => member(x, y, 0.004));
    const path = createScaledOutline(members, [], [], MAP_OPTS);
    const xs = path.points.map((p) => p.x);
    const ys = path.points.map((p) => p.y);
    // Wraps every member …
    expect(Math.min(...xs)).toBeLessThan(369.45);
    expect(Math.max(...xs)).toBeGreaterThan(369.83);
    expect(Math.min(...ys)).toBeLessThan(230.16);
    expect(Math.max(...ys)).toBeGreaterThan(230.95);
    // … and stays within the node-influence reach of them (nodeR1 + morph buffer, with slack).
    const reach = MAP_OPTS.nodeR1 + MAP_OPTS.morphBuffer;
    expect(Math.min(...xs)).toBeGreaterThan(369.45 - reach - 0.05);
    expect(Math.max(...xs)).toBeLessThan(369.83 + reach + 0.05);
  });

  it('matches a run in scaled space, divided back (round trip)', () => {
    const k = normalisationFactor(MAP_OPTS.pixelGroup);
    const members = MAP_SITES.map(([x, y]) => member(x, y, 0.004));
    const viaWrapper = createScaledOutline(members, [], [], MAP_OPTS);
    const direct = createOutline(
      members.map((r) => ({ x: r.x * k, y: r.y * k, width: r.width * k, height: r.height * k })),
      [],
      [],
      {
        pixelGroup: LIB_CELL,
        nodeR0: MAP_OPTS.nodeR0 * k,
        nodeR1: MAP_OPTS.nodeR1 * k,
        edgeR0: MAP_OPTS.edgeR0 * k,
        edgeR1: MAP_OPTS.edgeR1 * k,
        morphBuffer: MAP_OPTS.morphBuffer * k,
        maxRoutingIterations: MAP_OPTS.maxRoutingIterations,
        maxMarchingIterations: MAP_OPTS.maxMarchingIterations,
      } as never,
    );
    expect(viaWrapper.length).toBe(direct.length);
    for (let i = 0; i < direct.length; i++) {
      expect(viaWrapper.get(i).x).toBeCloseTo(direct.get(i).x / k, 6);
      expect(viaWrapper.get(i).y).toBeCloseTo(direct.get(i).y / k, 6);
    }
  });

  it('is empty for no members', () => {
    expect(createScaledOutline([], [], [], MAP_OPTS).length).toBe(0);
  });

  it('honours a non-member at map scale (it is scaled with everything else)', () => {
    // Three members in a row, and a blocker sitting on the contour's top edge. If the
    // blocker were left in raw map units it would land far outside the normalised
    // grid and change nothing — so a different outline proves it was scaled in.
    const members = [member(369.4, 230.6, 0.004), member(369.45, 230.6, 0.004), member(369.5, 230.6, 0.004)];
    const blocker = member(369.45, 230.606, 0.003);
    const open = createScaledOutline(members, [], [], MAP_OPTS);
    const routed = createScaledOutline(members, [blocker], [], MAP_OPTS);
    expect(routed.length).toBeGreaterThan(0);
    expect(JSON.stringify(routed.points)).not.toBe(JSON.stringify(open.points));
  });
});
