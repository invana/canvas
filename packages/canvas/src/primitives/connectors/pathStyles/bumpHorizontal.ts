import type { IPathStyle, PathCommand } from '../../types';

/**
 * Single cubic Bézier from the first to the last polyline point with the
 * control points placed on the **vertical midline** between source and
 * target — `c1 = ((sx + tx)/2, sy)` and `c2 = ((sx + tx)/2, ty)`.
 *
 * This is the curve d3-shape's `linkHorizontal()` (and d3-sankey's
 * `sankeyLinkHorizontal()`) produces: the path leaves the source tangent
 * to the **horizontal** axis and arrives at the target tangent to the
 * horizontal axis, with all of the vertical motion compressed into the
 * middle of the span. It reads cleanly as the Sankey "ribbon" curve when
 * the connector is stroked at `strokeWidth = link.value`.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored (a router that produces extra points doesn't compose
 * meaningfully with a horizontal-bump curve).
 *
 * Edge cases:
 *  - Polyline shorter than two points → `[]` (matches the other pathStyles).
 *  - `sx === tx` (vertical link) → degenerates to a straight vertical line;
 *    the formula stays well-defined (both control points sit on `x = sx`).
 */
export const bumpHorizontalPathStyle: IPathStyle = (polyline) => {
  if (polyline.length < 2) return [];

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const midX = (s.x + t.x) / 2;

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'C', c1x: midX, c1y: s.y, c2x: midX, c2y: t.y, x: t.x, y: t.y },
  ];
  return out;
};
