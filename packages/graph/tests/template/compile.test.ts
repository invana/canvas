import { describe, expect, it } from 'vitest';
import { compileCard, compileSimple } from '../../src/template/compile';
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
