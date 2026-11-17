import { describe, expect, it } from 'vitest';

import { PointerCollector } from '../src/tools/PointerCollector';
import { haversineKm } from '../src/geo/geodesy';

const A: [number, number] = [78, 17];
const B: [number, number] = [79, 17];
const C: [number, number] = [79, 18];
const D: [number, number] = [78, 18];

describe('PointerCollector — polygon', () => {
  it('click · click · click · finish closes it', () => {
    const c = new PointerCollector('polygon');
    c.click(A);
    c.click(B);
    c.click(C);
    expect(c.points).toHaveLength(3);
    const shape = c.finish();
    expect(shape).toEqual({ kind: 'polygon', points: [A, B, C] });
    expect(c.active).toBe(false); // finishing resets it
  });

  it('finishing with fewer than 3 vertices does nothing', () => {
    const c = new PointerCollector('polygon');
    c.click(A);
    c.click(B);
    expect(c.finish()).toBeNull();
    expect(c.points).toHaveLength(2); // still drawing
  });

  it('ignores the second click of a double-click (same spot)', () => {
    const c = new PointerCollector('polygon');
    c.click(A, 0.5);
    c.click(B, 0.5);
    c.click(C, 0.5);
    c.click([C[0] + 1e-6, C[1]], 0.5); // the double-click's second click
    expect(c.points).toHaveLength(3);
  });

  it('Backspace drops the last vertex, cancel abandons the shape', () => {
    const c = new PointerCollector('polygon');
    c.click(A);
    c.click(B);
    c.undoLast();
    expect(c.points).toEqual([A]);
    c.cancel();
    expect(c.active).toBe(false);
    expect(c.preview()).toBeNull();
  });

  it('previews a point, then a line, then a polygon, with the pointer included', () => {
    const c = new PointerCollector('polygon');
    expect(c.preview()).toBeNull();
    c.click(A);
    expect(c.preview()).toMatchObject({ geometry: 'point' });
    c.move(B);
    expect(c.preview()).toMatchObject({ geometry: 'line', points: [A, B] });
    c.click(B);
    c.move(C);
    expect(c.preview()).toMatchObject({ geometry: 'polygon', points: [A, B, C] });
  });
});

describe('PointerCollector — line', () => {
  it('needs two vertices', () => {
    const c = new PointerCollector('line');
    c.click(A);
    expect(c.finish()).toBeNull();
    c.click(B);
    expect(c.finish()).toEqual({ kind: 'line', points: [A, B] });
  });

  it('keeps going past two vertices', () => {
    const c = new PointerCollector('line');
    for (const p of [A, B, C, D]) c.click(p);
    expect(c.finish()!.points).toHaveLength(4);
  });
});

describe('PointerCollector — circle', () => {
  it('the second click finishes it, radius = the ground distance', () => {
    const c = new PointerCollector('circle');
    expect(c.click(A)).toBeNull();
    const shape = c.click(B)!;
    expect(shape.kind).toBe('circle');
    expect(shape.points).toEqual([A]);
    expect(shape.radiusKm).toBeCloseTo(haversineKm(A, B), 9);
  });

  it('Enter finishes it with the radius taken from the pointer', () => {
    const c = new PointerCollector('circle');
    c.click(A);
    expect(c.finish()).toBeNull(); // no pointer yet
    c.move(B);
    expect(c.finish()!.radiusKm).toBeCloseTo(haversineKm(A, B), 9);
  });

  it('previews the radius as the pointer moves', () => {
    const c = new PointerCollector('circle');
    c.click(A);
    c.move(B);
    const p = c.preview()!;
    expect(p.geometry).toBe('point');
    expect(p.radiusKm).toBeCloseTo(haversineKm(A, B), 9);
  });
});
