import { describe, expect, it } from 'vitest';
import { compileCard, compileFreeform, compileSimple } from '../../src/template/compile';
import type { FreeformStructure } from '../../src/template/types';
import { BUILT_IN_STRUCTURES, BUILT_IN_STYLINGS } from '../../src/template/structures';
import { DEFAULT_THEME } from '../../src/theme/themes';
import type { CardStructure, SimpleStructure } from '../../src/template/types';
import type { GraphNode } from '../../src/store/types';

const { categorical: _c, ...PALETTE } = DEFAULT_THEME.dark;

const idCard = BUILT_IN_STRUCTURES.idCard as CardStructure;
const idCardStyling = BUILT_IN_STYLINGS.idCard;
const circle = BUILT_IN_STRUCTURES.circle as SimpleStructure;
const circleStyling = BUILT_IN_STYLINGS.circle;

const person: GraphNode = {
  id: 'ada',
  type: 'person',
  data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'https://x/ada' },
} as GraphNode;

const bindings = { type: 'type', avatar: 'data.avatar', title: 'data.name', subtitle: 'data.role' };

describe('compileCard', () => {
  const out = compileCard(idCard, idCardStyling, bindings, person, PALETTE);
  const shape = out.shape as { kind: string; width: number; height: number; fill: number; parts: Array<Record<string, unknown>> };

  it('produces a composite shape at the structure size', () => {
    expect(shape.kind).toBe('composite');
    expect(shape.width).toBe(220);
    expect(shape.height).toBe(96);
  });

  it('resolves bg from the cardBg role', () => {
    expect(shape.fill).toBe(PALETTE.cardBg);
  });

  it('suppresses the base node border (card draws its own frame)', () => {
    expect(out.bgStrokeWidth).toBe(0);
  });

  it('binds slot text from the node data and uppercases the type tag', () => {
    const labels = shape.parts.filter((p) => p.part === 'label');
    const texts = labels.map((p) => p.text);
    expect(texts).toContain('PERSON'); // type tag, uppercased
    expect(texts).toContain('Ada Lovelace'); // title
    expect(texts).toContain('Mathematician'); // subtitle
  });

  it('resolves the title colour from the heading role', () => {
    const title = shape.parts.find((p) => p.part === 'label' && p.text === 'Ada Lovelace');
    expect(title?.fill).toBe(PALETTE.heading);
  });

  it('emits an accent bar and an avatar circle', () => {
    expect(shape.parts.some((p) => p.part === 'rect' && p.fill === PALETTE.accent)).toBe(true);
    expect(shape.parts.some((p) => p.part === 'circle')).toBe(true);
  });

  it('clips every label to a single ellipsised line', () => {
    for (const p of shape.parts.filter((p) => p.part === 'label')) {
      expect(p.maxLines).toBe(1);
      expect(p.overflow).toBe('ellipsis');
    }
  });
});

describe('compileSimple', () => {
  const concept: GraphNode = { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } } as GraphNode;
  const out = compileSimple(circle, circleStyling, { label: 'data.name' }, concept, PALETTE);

  it('keeps the structure shape', () => {
    expect(out.shape).toEqual({ kind: 'circle', radius: 10 });
  });

  it('binds the label text and resolves roles to numbers', () => {
    expect(out.labelText).toBe('Analytical Engine');
    expect(out.bgFill).toBe(PALETTE.accent); // fillRole: 'accent'
    expect(out.bgStrokeColor).toBe(PALETTE.stroke); // strokeRole: 'stroke'
    expect(out.labelColor).toBe(PALETTE.foreground); // label colorRole: 'foreground'
    expect(out.labelFontSize).toBe(12);
    expect(out.labelPlacement).toBe('bottom');
  });

  it('falls back to a direct colour when the role is absent from the palette', () => {
    const out2 = compileSimple(
      { name: 's', kind: 'simple', shape: { kind: 'circle', radius: 4 } },
      { name: 's', fill: 0x123456 },
      {},
      concept,
      {},
    );
    expect(out2.bgFill).toBe(0x123456);
  });
});

describe('compileFreeform', () => {
  const tpl: FreeformStructure = {
    name: 'movie',
    kind: 'freeform',
    width: 240,
    height: 140,
    cornerRadius: 12,
    bgRole: 'cardBg',
    elements: [
      { id: 'bar', type: 'rect', x: 0, y: 0, width: 240, height: 44, fillRole: 'accent' },
      { id: 'title', type: 'text', x: 16, y: 60, bind: 'data.name', fontSize: 22, fontWeight: 700, colorRole: 'heading' },
      { id: 'tag', type: 'text', x: 16, y: 14, text: 'movie', uppercase: true, color: 0xffffff },
      { id: 'div', type: 'line', x: 16, y: 44, x2: 224, y2: 44, colorRole: 'divider' },
      { id: 'avatar', type: 'image', x: 16, y: 80, size: 40, shape: 'circle' },
    ],
  };
  const movie: GraphNode = { id: 'm', type: 'movie', data: { name: 'Unforgiven' } } as GraphNode;
  const out = compileFreeform(tpl, movie, PALETTE);
  const shape = out.shape as { kind: string; width: number; fill: number; parts: Array<Record<string, unknown>> };

  it('produces a composite at the template size with the bg role resolved', () => {
    expect(shape.kind).toBe('composite');
    expect(shape.width).toBe(240);
    expect(shape.fill).toBe(PALETTE.cardBg);
    expect(out.bgStrokeWidth).toBe(0);
  });

  it('keeps element absolute coordinates and binds text', () => {
    const title = shape.parts.find((p) => p.part === 'label' && p.fill === PALETTE.heading);
    expect(title?.text).toBe('Unforgiven');
    expect(title?.x).toBe(16);
    expect(title?.y).toBe(60 + 22); // top + fontSize → baseline
  });

  it('uppercases + honours a direct (fixed) colour', () => {
    const tag = shape.parts.find((p) => p.text === 'MOVIE');
    expect(tag?.fill).toBe(0xffffff);
  });

  it('emits rect / line / image-placeholder parts', () => {
    expect(shape.parts.some((p) => p.part === 'rect' && p.fill === PALETTE.accent)).toBe(true);
    expect(shape.parts.some((p) => p.part === 'line')).toBe(true);
    expect(shape.parts.some((p) => p.part === 'circle')).toBe(true); // image placeholder
  });
});
