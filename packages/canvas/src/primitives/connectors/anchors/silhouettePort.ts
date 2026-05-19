import type { IAnchor, Point } from '../../types';

/**
 * Silhouette-port anchor — silhouette-aware sibling of {@link edgePortAnchor}.
 *
 * Same `{ side, offset }` opts as `edge-port`, but resolves the endpoint by
 * casting a ray from the shape's centre through the AABB's face point
 * `(±halfW, offset)` (or `(offset, ±halfH)` for top / bottom faces) and
 * intersecting it with the shape's actual silhouette via
 * `ref.boundaryIntersect`. The endpoint therefore lands on the rendered
 * outline — not on the AABB face — for every shape that overrides
 * `boundaryIntersect` (circle, polygon, …). Shapes without an override fall
 * through to the AABB face, matching `edge-port` exactly.
 *
 * Use this when fanning many connectors along one face of a non-rect node
 * (parallel graph edges between two circles, ER table → enum, etc.) — every
 * offset stays on the silhouette instead of floating off the AABB tangent
 * point. Large offsets that would exceed the face on a rect auto-wrap around
 * the corner to the top / bottom face instead of falling off the shape.
 *
 * Opts:
 *  - `side: 'left' | 'right' | 'top' | 'bottom' | 'auto'` — which AABB face's
 *    direction the offset is measured against. `'auto'` picks the face whose
 *    outward normal best aligns with the vector from this shape's centre to
 *    the *other* endpoint (`fromPoint`) — dominant-axis rule. Default
 *    `'auto'`.
 *  - `offset: number` — displacement from the face midpoint along the face
 *    axis. For `'left'` / `'right'` this is a vertical offset (+ down); for
 *    `'top'` / `'bottom'` a horizontal offset (+ right). Default `0`.
 *
 * The returned `tangent` is the outward radial unit vector from shape centre
 * to the silhouette point (matches `boundary`'s convention). For analytic
 * shapes this is the true surface normal; orth / er routers consume the
 * dominant axis component and remain happy.
 *
 * Geometric only: no graph / node / port domain concepts in the
 * implementation. Composable from any domain layer that already speaks the
 * `{ side, offset }` port vocabulary.
 */

interface SilhouettePortOpts {
  readonly side?: 'left' | 'right' | 'top' | 'bottom' | 'auto';
  readonly offset?: number;
}

export const silhouettePortAnchor: IAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`silhouettePortAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const opts = endpoint.opts as SilhouettePortOpts | undefined;
  const offset = opts?.offset ?? 0;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;

  // Default `side` is `'auto'` — pick the face pointing toward the other
  // endpoint. Callers that want a fixed face pass an explicit `side`.
  const requestedSide = opts?.side ?? 'auto';
  const side: 'left' | 'right' | 'top' | 'bottom' =
    requestedSide === 'auto' ? resolveAutoSide(fromPoint, ref.center) : requestedSide;

  // Centre-relative target the ray aims at. The ray runs from local origin
  // (= centre) through this point and intersects the silhouette en route.
  let localTarget: Point;
  switch (side) {
    case 'left':   localTarget = { x: -halfW, y: offset }; break;
    case 'right':  localTarget = { x:  halfW, y: offset }; break;
    case 'top':    localTarget = { x: offset, y: -halfH }; break;
    case 'bottom': localTarget = { x: offset, y:  halfH }; break;
  }

  // Analytical shapes (circle / polygon) override `boundaryIntersect` and
  // return the exact silhouette exit. Shapes without an override fall back
  // to the AABB target — same behaviour as `edge-port` for that case.
  const exit = ref.boundaryIntersect?.(localTarget) ?? localTarget;

  const x = ref.center.x + exit.x;
  const y = ref.center.y + exit.y;
  const len = Math.hypot(exit.x, exit.y);
  const tangent = len === 0
    ? { x: 1, y: 0 }
    : { x: exit.x / len, y: exit.y / len };

  return { x, y, tangent };
};

/**
 * Pick the AABB face whose outward normal best aligns with the vector from
 * the host centre to `fromPoint` (the other endpoint). Dominant axis wins;
 * ties resolve to the horizontal face (`right` / `left`).
 */
function resolveAutoSide(
  fromPoint: Point,
  center: Point,
): 'left' | 'right' | 'top' | 'bottom' {
  const dx = fromPoint.x - center.x;
  const dy = fromPoint.y - center.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}
