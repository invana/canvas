import { describe, expect, it } from 'vitest';

import {
  destinationPoint,
  distanceToPolylineKm,
  distanceToSegmentKm,
  haversineKm,
  initialBearing,
  polylineLengthKm,
  sphericalPolygonAreaKm2,
  sphericalRingAreaKm2,
} from '../src/geo/geodesy';

const within = (actual: number, expected: number, pct = 0.5): void => {
  expect(Math.abs(actual - expected) / expected).toBeLessThan(pct / 100);
};

describe('haversineKm', () => {
  it('one degree of latitude is ~111.19 km, anywhere', () => {
    within(haversineKm([10, 0], [10, 1]), 111.195);
    within(haversineKm([80, 60], [80, 61]), 111.195);
  });
  it('one degree of longitude shrinks with cos(lat)', () => {
    within(haversineKm([0, 0], [1, 0]), 111.195);
    within(haversineKm([0, 60], [1, 60]), 111.195 * Math.cos(Math.PI / 3), 0.6);
  });
  it('is symmetric and zero for the same point', () => {
    expect(haversineKm([5, 5], [5, 5])).toBe(0);
    expect(haversineKm([78.49, 17.38], [79.59, 17.97])).toBeCloseTo(haversineKm([79.59, 17.97], [78.49, 17.38]), 9);
  });
  it('Hyderabad to Warangal is ~130 km', () => {
    within(haversineKm([78.4867, 17.385], [79.5941, 17.9689]), 132, 3);
  });
});

describe('initialBearing', () => {
  it('north is 0, east 90, south 180, west 270', () => {
    expect(initialBearing([0, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(initialBearing([0, 0], [1, 0])).toBeCloseTo(90, 6);
    expect(initialBearing([0, 1], [0, 0])).toBeCloseTo(180, 6);
    expect(initialBearing([1, 0], [0, 0])).toBeCloseTo(270, 6);
  });
});

describe('destinationPoint', () => {
  it('round-trips with distance and bearing', () => {
    const from: [number, number] = [78.4867, 17.385];
    const to = destinationPoint(from, 72, 250);
    within(haversineKm(from, to), 250, 0.01);
    expect(initialBearing(from, to)).toBeCloseTo(72, 3);
  });
});

describe('polylineLengthKm', () => {
  it('sums the legs', () => {
    const line: [number, number][] = [[0, 0], [0, 1], [0, 2]];
    within(polylineLengthKm(line), 2 * 111.195);
  });
});

describe('spherical area', () => {
  it('a 1° × 1° cell at the equator is ~12,364 km²', () => {
    within(sphericalRingAreaKm2([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]), 12364, 0.5);
  });
  it('shrinks with cos(lat): ~half at 60° N', () => {
    within(sphericalRingAreaKm2([[0, 60], [1, 60], [1, 61], [0, 61]]), 12364 * 0.5, 2);
  });
  it('is the same either way round, with or without the closing point', () => {
    const open: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const a = sphericalRingAreaKm2(open);
    expect(sphericalRingAreaKm2([...open].reverse())).toBeCloseTo(a, 6);
    expect(sphericalRingAreaKm2([...open, [0, 0]])).toBeCloseTo(a, 6);
  });
  it('subtracts holes', () => {
    const outer: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
    const hole: [number, number][] = [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5], [0.5, 0.5]];
    within(sphericalPolygonAreaKm2([outer, hole]), sphericalRingAreaKm2(outer) - sphericalRingAreaKm2(hole), 0.01);
  });
  it('is zero for a degenerate ring', () => {
    expect(sphericalRingAreaKm2([[0, 0], [1, 1]])).toBe(0);
    expect(sphericalPolygonAreaKm2([])).toBe(0);
  });
});

describe('distance to a segment / polyline', () => {
  const a: [number, number] = [0, 0];
  const b: [number, number] = [2, 0];
  it('is the perpendicular distance beside the segment', () => {
    within(distanceToSegmentKm([1, 0.5], a, b), 0.5 * 111.195, 0.5);
  });
  it('clamps to the nearer end beyond it', () => {
    within(distanceToSegmentKm([3, 0], a, b), 111.195, 0.5);
    within(distanceToSegmentKm([-1, 0], a, b), 111.195, 0.5);
  });
  it('is zero on the segment', () => {
    expect(distanceToSegmentKm([1, 0], a, b)).toBeLessThan(0.01);
  });
  it('a degenerate segment is a point', () => {
    within(distanceToSegmentKm([0, 1], a, a), 111.195, 0.5);
  });
  it('a polyline takes the nearest leg, at high latitude too', () => {
    const line: [number, number][] = [[10, 60], [11, 60], [11, 61]];
    const d = distanceToPolylineKm([11.2, 60.5], line);
    within(d, 0.2 * 111.195 * Math.cos((60.5 * Math.PI) / 180), 1.5);
    expect(distanceToPolylineKm([0, 0], [])).toBe(Infinity);
    within(distanceToPolylineKm([0, 1], [[0, 0]]), 111.195, 0.5);
  });
});
