import { describe, expect, it } from 'vitest';
import { categoricalPaletteKeys, compileFreeform, compileSimple, resolveColorLookup } from '../../src/template/compile';
import { schemaCardStructure } from '../../src/template/schemaCard';
import type { SimpleStructure } from '../../src/template/types';
import { DEFAULT_THEME } from '../../src/theme/themes';
import type { GraphNode } from '../../src/store/types';

const { categorical, ...ROLES } = DEFAULT_THEME.dark;
const PALETTE = { ...ROLES, ...categoricalPaletteKeys(categorical) };
const HUE = { bind: 'data.hue', categorical: true } as const;
const node = (hue: unknown): GraphNode => ({ id: 'n', type: 't', data: { hue } }) as GraphNode;

describe('a categorical colour lookup', () => {
  it('resolves a 1-based slot to the ramp, wrapping past its end', () => {
    expect(resolveColorLookup(HUE, node(1), PALETTE)).toBe(categorical[0]);
    expect(resolveColorLookup(HUE, node(categorical.length + 2), PALETTE)).toBe(categorical[1]);
  });

  it('falls through on a value that is not a slot, and lets a map win', () => {
    expect(resolveColorLookup({ ...HUE, fallback: 'muted' }, node('x'), PALETTE)).toBe(ROLES.muted);
    expect(resolveColorLookup({ ...HUE, map: { '1': 0x123456 } }, node(1), PALETTE)).toBe(0x123456);
  });
});

describe('a styling template bound to a hue', () => {
  const frame: SimpleStructure = { name: 'frame', kind: 'simple', shape: { kind: 'rect', width: 10, height: 10 } } as SimpleStructure;

  it('washes and borders a simple shape in the slot colour', () => {
    const out = compileSimple(frame, { name: 's', fillLookup: HUE, fillAlpha: 0.1, strokeLookup: HUE, strokeRole: 'stroke' }, {}, node(3), PALETTE);
    expect(out.bgFill).toEqual({ kind: 'solid', color: categorical[2], alpha: 0.1 });
    expect(out.bgStrokeColor).toBe(categorical[2]);
  });

  it('keeps its role when the record has no hue', () => {
    const out = compileSimple(frame, { name: 's', strokeLookup: HUE, strokeRole: 'stroke' }, {}, node(undefined), PALETTE);
    expect(out.bgStrokeColor).toBe(ROLES.stroke);
  });
});

describe('schemaCardStructure', () => {
  const props = [
    { name: 'code', type: 'string', identity: true },
    { name: 'runways', type: 'integer' },
  ];

  it('draws a row per property, a key marker on the identity, and grows with the rows', () => {
    const s = schemaCardStructure('schema:Airport', { properties: props }, { subtitle: '{data.frame}' });
    const ids = s.elements.map((e) => e.id);
    expect(ids).toContain('row0-tags');
    expect(ids).not.toContain('row1-tags');
    expect(ids).toContain('subtitle');
    expect(s.height).toBe(90 + 16 + 2 * 22);
    const out = compileFreeform(s, node(2), PALETTE);
    expect((out.shape as { stroke?: { color: number } }).stroke?.color).toBe(categorical[1]);
  });
});
