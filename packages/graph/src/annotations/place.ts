/**
 * Where a new annotation card goes: beside its record, in the nearest spot no
 * node or card already takes. Nothing else moves — the next layout run lays
 * every card out with the data.
 */

import type { GraphLayer } from '../layer/GraphLayer';
import { resolveNodeSize } from '../layout/groups';
import type { Vec2 } from '../store/types';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box, gap: number) =>
  a.x - gap < b.x + b.w && b.x - gap < a.x + a.w && a.y - gap < b.y + b.h && b.y - gap < a.y + a.h;

/**
 * The centre for a `size` card beside `anchorId`: tried right, left, below and
 * above at growing distances, the first spot clear of every drawn node (and of
 * `ignore`, the card's own id, and of `occupied`, cards placed earlier in the
 * same pass) by `gap`. Falls back to the right of the record.
 * `null` when the record has no position.
 */
export function placeBeside(
  layer: GraphLayer,
  anchorId: string,
  size: { width: number; height: number },
  opts: {
    gap?: number;
    ignore?: string;
    /** Boxes already taken this pass but not yet in the store (centre, size). */
    occupied?: ReadonlyArray<{ x: number; y: number; width: number; height: number }>;
  } = {},
): Vec2 | null {
  const gap = opts.gap ?? 16;
  const store = layer.store;
  const at = store.getPosition(anchorId);
  if (!at) return null;
  const anchor = store.getNode(anchorId);
  const a = anchor ? resolveNodeSize(layer, anchor) : { width: 24, height: 24 };

  const taken: Box[] = [];
  for (const n of store.nodes()) {
    if (n.id === opts.ignore || n.hidden) continue;
    const p = store.getPosition(n.id);
    if (!p) continue;
    const s = resolveNodeSize(layer, n);
    taken.push({ x: p.x - s.width / 2, y: p.y - s.height / 2, w: s.width, h: s.height });
  }
  for (const o of opts.occupied ?? []) taken.push({ x: o.x - o.width / 2, y: o.y - o.height / 2, w: o.width, h: o.height });

  const dx = a.width / 2 + gap + size.width / 2;
  const dy = a.height / 2 + gap + size.height / 2;
  const sides: Vec2[] = [
    { x: dx, y: 0 },
    { x: -dx, y: 0 },
    { x: 0, y: dy },
    { x: 0, y: -dy },
    { x: dx, y: -dy },
    { x: dx, y: dy },
    { x: -dx, y: -dy },
    { x: -dx, y: dy },
  ];
  for (let ring = 1; ring <= 6; ring++) {
    for (const s of sides) {
      const c = { x: at.x + s.x * ring, y: at.y + s.y * ring };
      const box = { x: c.x - size.width / 2, y: c.y - size.height / 2, w: size.width, h: size.height };
      if (!taken.some((t) => overlaps(box, t, gap))) return c;
    }
  }
  return { x: at.x + dx, y: at.y };
}
