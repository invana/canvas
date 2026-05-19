import type { IPathStyle, PathCommand } from '../../types';

/**
 * Single cubic Bézier from the first to the last polyline point.
 *
 * Two modes depending on whether anchor `endpoints` are passed in:
 *
 *  - **Tangent-aware (preferred)** — when `endpoints.source.tangent` and / or
 *    `endpoints.target.tangent` are available, the control points are placed
 *    along each shape's outward surface normal: `c1 = s + sTan × handle`,
 *    `c2 = t + tTan × handle`, with `handle = |tx − sx| / 2`. The curve
 *    therefore leaves the source flush with its silhouette tangent and
 *    arrives at the target flush with *its* silhouette tangent — no kink
 *    at off-equator anchors (circles, polygons, rounded rects).
 *
 *  - **Fallback** — when no tangents are available (direct unit-test
 *    invocation, or an anchor that produced no tangent), the control
 *    points fall back to the **vertical midline** between source and
 *    target — `c1 = ((sx + tx)/2, sy)` and `c2 = ((sx + tx)/2, ty)` —
 *    matching d3-shape's `linkHorizontal()` / d3-sankey's
 *    `sankeyLinkHorizontal()` ribbon curve. For rect + horizontal-face
 *    anchors (`edge-port` on `'left'` / `'right'`) the tangent-aware
 *    formula reduces to this same placement, so existing rect-on-rect
 *    visuals are unchanged.
 *
 * Pair with `router: 'straight'`; intermediate polyline waypoints are
 * ignored (a router that produces extra points doesn't compose
 * meaningfully with a horizontal-bump curve).
 *
 * Edge cases:
 *  - Polyline shorter than two points → `[]` (matches the other pathStyles).
 *  - `sx === tx` (vertical link) → tangent-aware path uses `handle = 0`,
 *    collapsing both control points onto the endpoints (a straight line);
 *    fallback degenerates to a vertical line on `x = sx`. Both stay
 *    well-defined.
 */
export const bumpHorizontalPathStyle: IPathStyle = (polyline, _opts, endpoints) => {
  if (polyline.length < 2) return [];

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const handle = Math.abs(t.x - s.x) / 2;

  const sTan = endpoints?.source.tangent;
  const tTan = endpoints?.target.tangent;

  const c1x = sTan ? s.x + sTan.x * handle : (s.x + t.x) / 2;
  const c1y = sTan ? s.y + sTan.y * handle : s.y;
  const c2x = tTan ? t.x + tTan.x * handle : (s.x + t.x) / 2;
  const c2y = tTan ? t.y + tTan.y * handle : t.y;

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'C', c1x, c1y, c2x, c2y, x: t.x, y: t.y },
  ];
  return out;
};
