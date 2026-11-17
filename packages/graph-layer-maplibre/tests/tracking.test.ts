import { describe, expect, it } from 'vitest';

import { lngLatFix, lngLatFixes, worldUnitsPerMetre } from '../src/tracking';
import { projectLngLat } from '../src/mercator';

/** Ground distance in metres between two points, haversine, on the sphere mercator assumes. */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6_371_008.8;
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

describe('worldUnitsPerMetre', () => {
  it.each([1.3, 30, 60])('matches the great-circle value at %d° N within 0.5 %%', (lat) => {
    // A short east-west hop: 0.01° of longitude, whose ground length is known exactly.
    const a: [number, number] = [100, lat];
    const b: [number, number] = [100.01, lat];
    const metres = haversine(a, b);
    const world = projectLngLat(b).x - projectLngLat(a).x;
    expect(world / metres / worldUnitsPerMetre(lat)).toBeGreaterThan(0.995);
    expect(world / metres / worldUnitsPerMetre(lat)).toBeLessThan(1.005);
  });

  it('is the same factor north–south (mercator is conformal)', () => {
    const lat = 45;
    const a: [number, number] = [10, lat];
    const b: [number, number] = [10, lat + 0.01];
    const metres = haversine(a, b);
    const world = Math.abs(projectLngLat(b).y - projectLngLat(a).y);
    expect(world / metres / worldUnitsPerMetre(lat + 0.005)).toBeGreaterThan(0.995);
    expect(world / metres / worldUnitsPerMetre(lat + 0.005)).toBeLessThan(1.005);
  });
});

describe('lngLatFix', () => {
  it('projects the position and keeps id, time and course', () => {
    const w = lngLatFix({ id: 'v1', t: 1000, lng: 103.8, lat: 1.3, course: 270 });
    expect(w).toMatchObject({ id: 'v1', t: 1000, course: 270 });
    expect(w.x).toBeCloseTo(projectLngLat([103.8, 1.3]).x, 12);
    expect(w.y).toBeCloseTo(projectLngLat([103.8, 1.3]).y, 12);
    expect('speed' in w).toBe(false);
  });

  it('converts knots to world units per second', () => {
    const w = lngLatFix({ id: 'v', t: 0, lng: 0, lat: 0, speedKn: 10 });
    // 10 kn = 5.144 m/s; at the equator one metre is 512 / 40 075 016.7 world units.
    expect(w.speed!).toBeCloseTo((10 * 1852) / 3600 * (512 / 40_075_016.686), 12);
  });

  it('prefers knots over metres per second, and accepts either', () => {
    expect(lngLatFix({ id: 'v', t: 0, lng: 0, lat: 0, speedKn: 10, speedMps: 999 }).speed).toBe(
      lngLatFix({ id: 'v', t: 0, lng: 0, lat: 0, speedKn: 10 }).speed,
    );
    expect(lngLatFix({ id: 'v', t: 0, lng: 0, lat: 0, speedMps: 5 }).speed).toBeGreaterThan(0);
  });

  it('a batch converts each fix', () => {
    expect(lngLatFixes([{ id: 'a', t: 0, lng: 0, lat: 0 }, { id: 'b', t: 0, lng: 1, lat: 1 }]).map((f) => f.id)).toEqual(['a', 'b']);
  });
});
