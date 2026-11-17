import { describe, expect, it } from 'vitest';

import { createMatcher } from '../src/geo/query';
import { destinationPoint } from '../src/geo/geodesy';
import type { GeoGeometry } from '../src/features/types';

const donut: GeoGeometry = {
  type: 'Polygon',
  coordinates: [
    [[78, 17], [79, 17], [79, 18], [78, 18], [78, 17]],
    [[78.4, 17.4], [78.6, 17.4], [78.6, 17.6], [78.4, 17.6], [78.4, 17.4]],
  ],
};

describe('createMatcher — polygon', () => {
  const inside = createMatcher(donut);
  it('is inside the outer ring and outside the holes', () => {
    expect(inside([78.2, 17.2])).toBe(true);
    expect(inside([78.5, 17.5])).toBe(false); // in the hole
    expect(inside([77.5, 17.5])).toBe(false);
  });

  it('within km of the boundary, geodesic, at low and high latitude', () => {
    const near = createMatcher(donut, 30);
    // 20 km west of the west edge (78°E, 17.5°N).
    expect(near(destinationPoint([78, 17.5], 270, 20))).toBe(true);
    expect(near(destinationPoint([78, 17.5], 270, 45))).toBe(false);
    // The same at 60° N, where a degree of longitude is half as long.
    const north: GeoGeometry = { type: 'Polygon', coordinates: [[[10, 60], [11, 60], [11, 61], [10, 61], [10, 60]]] };
    const nearNorth = createMatcher(north, 30);
    expect(nearNorth(destinationPoint([10, 60.5], 270, 20))).toBe(true);
    expect(nearNorth(destinationPoint([10, 60.5], 270, 45))).toBe(false);
  });

  it('a point in the hole is near the hole’s edge', () => {
    const near = createMatcher(donut, 10);
    expect(near([78.5, 17.5])).toBe(false); // 11 km+ from any edge: the hole is 22 km wide
    expect(near([78.41, 17.5])).toBe(true); // ~1 km from the hole's west edge
  });

  it('a MultiPolygon matches any of its polygons', () => {
    const multi: GeoGeometry = {
      type: 'MultiPolygon',
      coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]]],
    };
    const m = createMatcher(multi);
    expect(m([0.5, 0.5])).toBe(true);
    expect(m([5.5, 5.5])).toBe(true);
    expect(m([3, 3])).toBe(false);
  });
});

describe('createMatcher — line', () => {
  const route: GeoGeometry = { type: 'LineString', coordinates: [[78, 17], [79, 17], [79, 18]] };
  it('has no inside: it needs a distance to match anything', () => {
    expect(createMatcher(route)([78.5, 17])).toBe(false);
    const near = createMatcher(route, 10);
    expect(near([78.5, 17.05])).toBe(true); // ~5.5 km
    expect(near([78.5, 17.2])).toBe(false); // ~22 km
  });

  it('a MultiLineString takes the nearest line', () => {
    const lines: GeoGeometry = { type: 'MultiLineString', coordinates: [[[0, 0], [1, 0]], [[10, 10], [11, 10]]] };
    const near = createMatcher(lines, 5);
    expect(near([10.5, 10.01])).toBe(true);
    expect(near([5, 5])).toBe(false);
  });
});

describe('createMatcher — point', () => {
  const site: GeoGeometry = { type: 'Point', coordinates: [79, 17.5] };
  it('within km of a point; its radius counts', () => {
    expect(createMatcher(site, 25)(destinationPoint([79, 17.5], 40, 20))).toBe(true);
    expect(createMatcher(site, 25)(destinationPoint([79, 17.5], 40, 30))).toBe(false);
    expect(createMatcher(site, 0, 25)(destinationPoint([79, 17.5], 40, 20))).toBe(true);
    expect(createMatcher(site, 10, 25)(destinationPoint([79, 17.5], 40, 30))).toBe(true);
    expect(createMatcher(site)([79, 17.5])).toBe(true); // exactly on it
  });
});
