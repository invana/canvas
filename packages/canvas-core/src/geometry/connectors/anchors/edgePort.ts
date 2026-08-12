import type { IAnchor, Point } from '@invana/canvas-store';

/**
 * Edge-port anchor — lands the endpoint on a named face of the host's
 * bounding box, displaced from that face's midpoint along the face axis by
 * `offset` world units.
 *
 * Use this when many connectors share a node but each needs to attach at a
 * specific position along one of its faces — the canonical case is a Sankey
 * diagram, where the ribbons stack vertically on the source's right face and
 * the target's left face. The layout owns the offsets (they map to the
 * cumulative link y-positions); the anchor just resolves them to world points
 * every time the connector re-routes. Generally useful for any port-attached
 * edge model — ER table rows, BPMN sequence flows, switch-statement diagrams.
 *
 * Opts:
 *  - `side: 'left' | 'right' | 'top' | 'bottom' | 'auto'` — which face to
 *    attach to. `'auto'` picks the face whose outward normal best aligns
 *    with the vector from this shape's centre to the *other* endpoint
 *    (`fromPoint`) — dominant-axis rule. Default `'auto'`.
 *  - `offset: number` — displacement from the face midpoint along the face
 *    axis (the axis parallel to the face). For `'left'` / `'right'` this is
 *    a vertical offset (+ down); for `'top'` / `'bottom'` a horizontal offset
 *    (+ right). Default `0` (face midpoint).
 *
 * The returned `tangent` is the outward face normal — `(±1, 0)` for left /
 * right, `(0, ±1)` for top / bottom — so routers that consume the tangent
 * (orth, er, …) keep working unchanged.
 *
 * Geometric only: no graph / node / port domain concepts in the
 * implementation. The "port" word in the registered name describes a generic
 * port-on-an-AABB-face primitive; any domain can compose it.
 */

interface EdgePortOpts {
  readonly side?: 'left' | 'right' | 'top' | 'bottom' | 'auto';
  readonly offset?: number;
}

export const edgePortAnchor: IAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`edgePortAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const opts = endpoint.opts as EdgePortOpts | undefined;
  const offset = opts?.offset ?? 0;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;

  // Default `side` is `'auto'` — pick the face pointing toward the other
  // endpoint. Callers that want a fixed face pass an explicit `side`.
  const requestedSide = opts?.side ?? 'auto';
  const side: 'left' | 'right' | 'top' | 'bottom' =
    requestedSide === 'auto' ? resolveAutoSide(fromPoint, ref.center) : requestedSide;

  switch (side) {
    case 'left':
      return {
        x: ref.center.x - halfW,
        y: ref.center.y + offset,
        tangent: { x: -1, y: 0 },
      };
    case 'right':
      return {
        x: ref.center.x + halfW,
        y: ref.center.y + offset,
        tangent: { x: 1, y: 0 },
      };
    case 'top':
      return {
        x: ref.center.x + offset,
        y: ref.center.y - halfH,
        tangent: { x: 0, y: -1 },
      };
    case 'bottom':
      return {
        x: ref.center.x + offset,
        y: ref.center.y + halfH,
        tangent: { x: 0, y: 1 },
      };
  }
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
