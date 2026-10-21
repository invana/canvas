/**
 * Where each annotation card goes, so no card covers another.
 *
 * A card wants to sit beside its record. When that spot covers another card, a
 * group's label or the board's chrome (the row, the rail, an open panel, the
 * dock, the presenter), it takes the nearest free spot instead — searched
 * outward in rings from where it wanted to be, preferring a spot that covers no
 * node. Runs every frame the camera moves, so it stops at the first good ring.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardBox extends Rect {
  id: string;
  /** Room kept above the card — the selected one's format bar. */
  reserveTop?: number;
}

export interface Point {
  x: number;
  y: number;
}

const MARGIN = 8;
const STEP = 12;
const REACH = 420;
const DIRECTIONS = 16;

export function overlaps(a: Rect, b: Rect, gap = 0): boolean {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

/**
 * Places `cards` in order — the first keeps its spot most often, so pass the
 * selected card first. Returns each card's top-left.
 */
export function placeCards(
  cards: readonly CardBox[],
  obstacles: readonly Rect[],
  nodes: readonly Point[],
  bounds: { w: number; h: number },
): Map<string, Point> {
  const placed: Rect[] = [];
  const out = new Map<string, Point>();
  for (const c of cards) {
    const top = c.reserveTop ?? 0;
    const boxAt = (x: number, y: number): Rect => ({ x, y: y - top, w: c.w, h: c.h + top });
    const inBounds = (b: Rect) => b.x >= MARGIN && b.y >= MARGIN && b.x + b.w <= bounds.w - MARGIN && b.y + b.h <= bounds.h - MARGIN;
    const free = (b: Rect) => inBounds(b) && !obstacles.some((o) => overlaps(b, o, 4)) && !placed.some((o) => overlaps(b, o, 8));
    const covers = (b: Rect) => nodes.some((n) => n.x > b.x - 8 && n.x < b.x + b.w + 8 && n.y > b.y - 18 && n.y < b.y + b.h + 8);

    let best: Point | null = free(boxAt(c.x, c.y)) ? { x: c.x, y: c.y } : null;
    let fallback: Point | null = null;
    for (let d = STEP; !best && d <= REACH; d += STEP) {
      for (let i = 0; i < DIRECTIONS; i++) {
        const a = (i / DIRECTIONS) * Math.PI * 2;
        const x = Math.round(c.x + Math.cos(a) * d);
        const y = Math.round(c.y + Math.sin(a) * d);
        const b = boxAt(x, y);
        if (!free(b)) continue;
        if (!covers(b)) {
          best = { x, y };
          break;
        }
        fallback ??= { x, y };
      }
      // A free spot that covers a node beats walking much further for a clean one.
      if (!best && fallback && d >= 120) best = fallback;
    }
    const p = best ?? fallback ?? { x: c.x, y: c.y };
    out.set(c.id, p);
    placed.push(boxAt(p.x, p.y));
  }
  return out;
}

/** A card's height before it is measured: the kit card's padding, lines of text, foot and extras. */
export function estimateCardHeight(text: string, extras: { value?: boolean; changed?: boolean; editing?: boolean }): number {
  const lines = Math.max(1, Math.ceil(Math.max(1, text.length) / 26));
  return 40 + lines * 17 + (extras.value ? 28 : 0) + (extras.changed ? 18 : 0) + (extras.editing ? 40 : 0);
}
