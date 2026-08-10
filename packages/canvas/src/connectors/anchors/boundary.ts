import type { IAnchor, Point } from '@invana/canvas-store';

/**
 * Boundary anchor — snaps the endpoint onto the shape silhouette where the
 * ray from the shape's geometric **centre** toward the *other* endpoint
 * exits.
 *
 * The ray is cast from `ref.center` (the bounding-box centre, computed by
 * the renderer from `origin + bounds`) rather than from `ref.origin` so the
 * behaviour is uniform regardless of each shape's local-origin convention.
 * `RectShape` is anchored top-left, `CircleShape` is centred — `ref.center`
 * normalises the difference.
 *
 * Calls the shape's optional `boundaryIntersect(localFromCenter)` for
 * analytical shapes (`CircleShape` overrides). For shapes that don't
 * override, falls back to a centred-AABB ray-exit (provided by
 * `ShapeBase.boundaryIntersect`). The input is centre-relative; the output
 * is centre-relative; this anchor converts back to world via `ref.center`.
 *
 * Sets an outward-pointing `tangent` on the returned endpoint (unit vector
 * from shape centre to the boundary point) so port-aware routers can use it
 * as an exit-direction hint.
 */
export const boundaryAnchor: IAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`boundaryAnchor: unknown shape "${endpoint.shapeId}"`);
  }

  const localFromCenter: Point = {
    x: fromPoint.x - ref.center.x,
    y: fromPoint.y - ref.center.y,
  };

  const localPoint = ref.boundaryIntersect?.(localFromCenter)
    ?? { x: 0, y: 0 };

  const x = ref.center.x + localPoint.x;
  const y = ref.center.y + localPoint.y;

  const len = Math.hypot(localPoint.x, localPoint.y);
  const tangent = len === 0
    ? { x: 1, y: 0 }
    : { x: localPoint.x / len, y: localPoint.y / len };

  return { x, y, tangent };
};
