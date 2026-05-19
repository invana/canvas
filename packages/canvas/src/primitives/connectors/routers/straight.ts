import type { IRouter } from '../../types';

/**
 * Direct line from source through any waypoints to target.
 * Output: `[source, ...waypoints, target]` — a flat polyline.
 *
 * Routers decide topology (where bends sit). The visual style of segments
 * between these points is owned by the downstream `PathStyle`:
 * - `normal` → straight segments (`M, L, L, …`)
 * - `rounded` → quadratic fillets at corners
 * - `smooth` → Catmull-Rom cubic spline
 * - `bezier` → single cubic A→B (intermediate points ignored)
 */
export const straightRouter: IRouter = (source, target, waypoints) => {
  if (!waypoints || waypoints.length === 0) {
    return [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y },
    ];
  }
  return [
    { x: source.x, y: source.y },
    ...waypoints.map((p) => ({ x: p.x, y: p.y })),
    { x: target.x, y: target.y },
  ];
};
