import { describe, expect, it } from 'vitest';

import {
  distanceToLine,
  keyholeRing,
  openRing,
  pointInPolygon,
  prepare,
  radiusKmToWorld,
  signedArea,
  validateGeometry,
  type Pt,
} from '../src/features/geometry';
import { projectLngLat } from '../src/mercator';
import { resolveStyle, parseColor } from '../src/features/style';
import { parseReliability, provenanceProblems } from '../src/features/provenance';

const sq = (x: number, y: number, s: number): Pt[] => [
  { x, y },
  { x: x + s, y },
  { x: x + s, y: y + s },
  { x, y: y + s },
];
const area = (r: Pt[]): number => Math.abs(signedArea(r));

describe('keyholeRing', () => {
  it('fills outer minus one hole (the bridge adds no area)', () => {
    const ring = keyholeRing(sq(0, 0, 10), [sq(3, 3, 4)]);
    expect(area(ring)).toBeCloseTo(100 - 16, 9);
    // outer 4 + hole 4 + the hole vertex and the outer vertex each visited twice (out and back along the bridge)
    expect(ring).toHaveLength(10);
  });

  it('fills outer minus several holes', () => {
    const ring = keyholeRing(sq(0, 0, 20), [sq(2, 2, 4), sq(12, 3, 5), sq(5, 12, 6)]);
    expect(area(ring)).toBeCloseTo(400 - 16 - 25 - 36, 9);
  });

  it('is indifferent to ring direction and to closing duplicates', () => {
    const closed = [...sq(0, 0, 10), { x: 0, y: 0 }];
    const holeCcw = sq(3, 3, 4).reverse();
    expect(area(keyholeRing(closed, [holeCcw]))).toBeCloseTo(84, 9);
    expect(area(keyholeRing(closed.slice().reverse(), [sq(3, 3, 4)]))).toBeCloseTo(84, 9);
  });

  it('with no holes is just the outer ring', () => {
    expect(keyholeRing(sq(0, 0, 10), [])).toHaveLength(4);
  });

  it('bridges around a hole that blocks the nearest vertex (a concave outer)', () => {
    // A "C": the hole sits in the mouth; the nearest outer vertex is not visible.
    const outer: Pt[] = [
      { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 14 }, { x: 20, y: 14 }, { x: 20, y: 20 }, { x: 0, y: 20 },
    ];
    const hole = sq(2, 8, 4);
    expect(area(keyholeRing(outer, [hole]))).toBeCloseTo(area(outer) - 16, 9);
  });

  it('returns nothing for a degenerate outer ring', () => {
    expect(keyholeRing([{ x: 0, y: 0 }, { x: 1, y: 1 }], [])).toEqual([]);
  });
});

describe('pointInPolygon', () => {
  const rings = [sq(0, 0, 10), sq(3, 3, 4)];
  it('is inside the outer ring, outside the holes', () => {
    expect(pointInPolygon(1, 1, rings)).toBe(true);
    expect(pointInPolygon(5, 5, rings)).toBe(false); // in the hole
    expect(pointInPolygon(20, 5, rings)).toBe(false);
  });
});

describe('distanceToLine', () => {
  it('measures to the nearest segment', () => {
    const line: Pt[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    expect(distanceToLine(5, 3, line)).toBeCloseTo(3, 9);
    expect(distanceToLine(13, 5, line)).toBeCloseTo(3, 9);
    expect(distanceToLine(-4, 3, line)).toBeCloseTo(5, 9);
  });
});

describe('radiusKmToWorld (V2)', () => {
  const haversine = (a: [number, number], b: [number, number]): number => {
    const R = 6_371_008.8;
    const r = Math.PI / 180;
    const dLat = (b[1] - a[1]) * r;
    const dLng = (b[0] - a[0]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  it.each([1.3, 30, 60])('a 5 km radius at %d° N matches the projected east–west distance within 0.5 %%', (lat) => {
    // A point 5 km east, by the great circle, projected: its world distance is the radius.
    const dLng = 5000 / (111_195 * Math.cos((lat * Math.PI) / 180));
    const a = projectLngLat([10, lat]);
    const b = projectLngLat([10 + dLng, lat]);
    const world = Math.hypot(b.x - a.x, b.y - a.y);
    expect(world / radiusKmToWorld(haversine([10, lat], [10 + dLng, lat]) / 1000, lat)).toBeGreaterThan(0.995);
    expect(world / radiusKmToWorld(haversine([10, lat], [10 + dLng, lat]) / 1000, lat)).toBeLessThan(1.005);
  });
});

describe('prepare / validateGeometry', () => {
  const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] as const;
  it('projects each geometry kind', () => {
    expect(prepare({ type: 'Point', coordinates: [10, 20] })).toMatchObject({ kind: 'point' });
    expect(prepare({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })).toMatchObject({ kind: 'lines' });
    const poly = prepare({ type: 'Polygon', coordinates: [ring, ring] });
    expect(poly.kind === 'polygons' && poly.polygons[0]).toHaveLength(2);
    const multi = prepare({ type: 'MultiPolygon', coordinates: [[ring], [ring]] });
    expect(multi.kind === 'polygons' && multi.polygons).toHaveLength(2);
  });

  it('refuses unusable geometry', () => {
    expect(validateGeometry({ type: 'Point', coordinates: [Number.NaN, 0] })).not.toBeNull();
    expect(validateGeometry({ type: 'LineString', coordinates: [[0, 0]] })).not.toBeNull();
    expect(validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] })).not.toBeNull();
    expect(validateGeometry({ type: 'Polygon', coordinates: [ring] })).toBeNull();
    expect(validateGeometry({ type: 'MultiPolygon', coordinates: [] })).not.toBeNull();
  });

  it('openRing drops the closing duplicate only', () => {
    expect(openRing([...sq(0, 0, 1), { x: 0, y: 0 }])).toHaveLength(4);
    expect(openRing(sq(0, 0, 1))).toHaveLength(4);
  });
});

describe('style', () => {
  it('feature properties beat config defaults beat built-ins', () => {
    const s = resolveStyle('polygon', { stroke: '#ff0000', 'stroke-width': 4 }, { stroke: '#00ff00', strokeWidthPx: 9, fill: '#0000ff' }, undefined);
    expect(s.stroke).toBe(0xff0000);
    expect(s.strokeWidthPx).toBe(4);
    expect(s.fill).toBe(0x0000ff);
    expect(s.fillOpacity).toBe(0.15); // built-in
  });

  it('parses colours as hex strings, short hex and numbers', () => {
    expect(parseColor('#abc')).toBe(0xaabbcc);
    expect(parseColor('ff8800')).toBe(0xff8800);
    expect(parseColor(0x123456)).toBe(0x123456);
    expect(parseColor('nope')).toBeUndefined();
  });

  it('draws unconfirmed features dashed and faded', () => {
    const base = resolveStyle('polygon', {}, undefined, undefined);
    expect(base.unconfirmed).toBe(false);
    for (const props of [{ confidence: 0.3 }, { confirmed: false }]) {
      const s = resolveStyle('polygon', props, undefined, undefined);
      expect(s.unconfirmed).toBe(true);
      expect(s.dash).toEqual([6, 4]);
      expect(s.fillOpacity).toBeCloseTo(base.fillOpacity * 0.6, 9);
    }
    expect(resolveStyle('polygon', { confidence: 0.6 }, undefined, undefined).unconfirmed).toBe(false);
    expect(resolveStyle('polygon', { confidence: 0.6 }, undefined, { below: 0.7, alpha: 0.5, dash: [2, 2] }).dash).toEqual([2, 2]);
  });
});

describe('provenance', () => {
  it('parses the Admiralty code', () => {
    expect(parseReliability('B2')).toEqual({ source: 'B', information: 2 });
    expect(parseReliability(' f6 ')).toEqual({ source: 'F', information: 6 });
    expect(parseReliability('G2')).toBeNull();
    expect(parseReliability('B7')).toBeNull();
    expect(parseReliability(12)).toBeNull();
  });

  it('reports only a value that is present and wrong', () => {
    expect(provenanceProblems(undefined)).toEqual([]);
    expect(provenanceProblems({ source: 'sensor 7', confidence: 0.4, reliability: 'C3', reportedAt: '2026-11-17T10:00:00Z' })).toEqual([]);
    expect(provenanceProblems({ confidence: 2 })).toHaveLength(1);
    expect(provenanceProblems({ reliability: 'Z9' })).toHaveLength(1);
    expect(provenanceProblems({ reportedAt: 'yesterday' })).toHaveLength(1);
  });
});
