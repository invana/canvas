import type { IPathStyle, PathCommand } from '../../../../specs';

/**
 * Single cubic Bézier from the first to the last polyline point, pulled
 * **vertically** — the curve of a top-to-bottom tree, d3-shape's
 * `linkVertical()`: `c1 = (sx, (sy + ty)/2)`, `c2 = (tx, (sy + ty)/2)`.
 *
 * Unlike `bump-horizontal` it ignores the anchors' tangents. On a circle with
 * the default `boundary` anchor the tangent points at the other node, so a
 * tangent-following curve flattens into a straight line; the midline keeps the
 * S-curve on every shape.
 *
 * Pair with `router: 'straight'`; intermediate waypoints are ignored.
 *
 * Edge cases: fewer than two points → `[]`; `sy === ty` → a straight line.
 */
export const bumpVerticalPathStyle: IPathStyle = (polyline) => {
  if (polyline.length < 2) return [];

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const midY = (s.y + t.y) / 2;

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'C', c1x: s.x, c1y: midY, c2x: t.x, c2y: midY, x: t.x, y: t.y },
  ];
  return out;
};
