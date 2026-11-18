import { describe, expect, it } from 'vitest';

import { computeTint, hex, mix } from '../src/basemapTint';

/** The layer ids + types the OpenFreeMap styles share, trimmed. */
const LAYERS = [
  { id: 'background', type: 'background' },
  { id: 'park', type: 'fill' },
  { id: 'water', type: 'fill' },
  { id: 'building', type: 'fill' },
  { id: 'waterway', type: 'line' },
  { id: 'road_trunk_casing', type: 'line' },
  { id: 'road_trunk', type: 'line' },
  { id: 'boundary_2', type: 'line' },
  { id: 'aeroway-area', type: 'fill' },
  { id: 'label_city', type: 'symbol' },
];

const PALETTE = { surface: 0x101820, foreground: 0xe0e0e0, muted: 0x8090a0, accent: 0xe11d48 };

/** Op lookup by `layer/prop`. */
const byKey = (ops: ReturnType<typeof computeTint>) => new Map(ops.map((o) => [`${o.layer}/${o.prop}`, o.value]));

describe('mix / hex', () => {
  it('blends endpoints exactly and midpoints per channel', () => {
    expect(mix(0x000000, 0xffffff, 0)).toBe('#000000');
    expect(mix(0x000000, 0xffffff, 1)).toBe('#ffffff');
    expect(mix(0x000000, 0xfefefe, 0.5)).toBe('#7f7f7f');
  });
  it('formats a role number as css', () => {
    expect(hex(0x0284c7)).toBe('#0284c7');
  });
});

describe('computeTint', () => {
  const ops = byKey(computeTint(LAYERS, { kind: 'dark', palette: PALETTE }));

  it('paints the background with the surface role', () => {
    expect(ops.get('background/background-color')).toBe(hex(PALETTE.surface));
  });

  it('tints water toward the accent, distinct from land', () => {
    expect(ops.get('water/fill-color')).toBe(mix(PALETTE.surface, PALETTE.accent, 0.28));
    expect(ops.get('waterway/line-color')).toBe(ops.get('water/fill-color'));
    expect(ops.get('park/fill-color')).not.toBe(ops.get('water/fill-color'));
  });

  it('dresses buildings, roads (casing apart), boundaries and labels', () => {
    expect(ops.get('building/fill-color')).toBeDefined();
    expect(ops.get('road_trunk/line-color')).not.toBe(ops.get('road_trunk_casing/line-color'));
    expect(ops.get('boundary_2/line-color')).toBeDefined();
    expect(ops.get('label_city/text-color')).toBeDefined();
    expect(ops.get('label_city/text-halo-color')).toBe(hex(PALETTE.surface));
  });

  it('leaves layers it does not know alone', () => {
    expect([...ops.keys()].some((k) => k.startsWith('aeroway-area'))).toBe(false);
  });

  it('is kind-aware: the same family tints differently in light and dark', () => {
    const light = byKey(computeTint(LAYERS, { kind: 'light', palette: PALETTE }));
    expect(light.get('water/fill-color')).not.toBe(ops.get('water/fill-color'));
  });

  it('falls back to foreground for a missing muted / accent role', () => {
    const sparse = byKey(computeTint(LAYERS, { kind: 'light', palette: { surface: 0xffffff, foreground: 0x000000 } }));
    expect(sparse.get('water/fill-color')).toBe(mix(0xffffff, 0x000000, 0.22));
  });

  it('does nothing under an empty palette (the ThemeBehaviour light/dark shorthand)', () => {
    expect(computeTint(LAYERS, { kind: 'dark', palette: {} })).toEqual([]);
  });

  it('skips layers a style lacks, and yields nothing for a style matching none', () => {
    expect(computeTint([{ id: 'custom', type: 'raster' }], { kind: 'dark', palette: PALETTE })).toEqual([]);
    const onlyBg = computeTint([{ id: 'bg', type: 'background' }], { kind: 'dark', palette: PALETTE });
    expect(onlyBg).toEqual([{ layer: 'bg', prop: 'background-color', value: hex(PALETTE.surface) }]);
  });
});
