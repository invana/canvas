import type { CompositePart, CompositeShapeOption, NodeStyle } from '@invana/graph';

import { hexToNumber, numberToHex } from '../../shared/color';
import type { NodeStyleOverviewFields } from './types';

/** Seed the form from an engine colour (`0xRRGGBB` → `#rrggbb`). Non-numeric
 * (unset) colours seed an empty field. */
export function colorToForm(color?: number): NodeStyleOverviewFields {
  return typeof color === 'number' ? { color: numberToHex(color) } : {};
}

/** Read the chosen colour back as an engine `0xRRGGBB`, or `undefined` if the
 * field was left blank. */
export function formToColor(f: NodeStyleOverviewFields): number | undefined {
  return f.color && f.color.length > 0 ? hexToNumber(f.color) : undefined;
}

/**
 * Build the `Partial<NodeStyle>` patch that recolours a node — the "works for
 * both kinds" bridge:
 *
 * - **composite / card** (`style.shape.kind === 'composite'`) → recolour the
 *   card **body** `fill` **and** every solid **accent part** (a `rect` / `circle`
 *   part that already carries a `fill`). Label parts keep their text colour so
 *   copy stays readable.
 * - **simple shape** → set `bgFill`.
 *
 * Spread over the node's resolved style on apply (since `updateNode` replaces
 * `style` wholesale):
 * `store.updateNode(id, { style: { ...resolveNodeStyle(node), ...recolorNodeStyle(style, color) } })`.
 */
export function recolorNodeStyle(style: Partial<NodeStyle>, color: number): Partial<NodeStyle> {
  const shape = style.shape;
  if (shape && shape.kind === 'composite') {
    // The open-keyed custom-shape variant defeats `kind`-narrowing on the union,
    // so assert the composite shape after the literal check.
    const card = shape as CompositeShapeOption;
    const parts: CompositePart[] = card.parts.map((p) =>
      (p.part === 'rect' || p.part === 'circle') && p.fill !== undefined ? { ...p, fill: color } : p,
    );
    return { shape: { ...card, fill: color, parts } };
  }
  return { bgFill: color };
}
