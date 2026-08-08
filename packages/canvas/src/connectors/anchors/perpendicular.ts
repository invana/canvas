import type { IAnchor } from '../../specs';

/**
 * Perpendicular anchor — exits at the **midpoint of the face** of the
 * shape's bounding box that is closest to the other endpoint. The face is
 * picked by comparing `|dx| / halfWidth` against `|dy| / halfHeight`: the
 * ratio that's larger wins (so a target slightly to the right of a wide,
 * short rect still picks the right side; a tall, narrow rect picks the top
 * or bottom more readily).
 *
 * Best for **orth-style routing** (`orth`, `manhattan`, `metro`, `er`,
 * `oneSide`) where the natural exit is along one cardinal axis. Produces
 * the "lines start at the middle of a side" look common in flowcharts and
 * ER diagrams.
 *
 * For circles (square bounds), this lands at the cardinal points
 * (N / S / E / W) on the perimeter — a useful default though `boundary`
 * still gives smoother diagonal exits for non-orthogonal routers.
 *
 * Sets the outward tangent to the face normal: `(±1, 0)` for left/right
 * faces, `(0, ±1)` for top/bottom. Routers like `orth` consume this to
 * pick H-first vs V-first.
 */
export const perpendicularAnchor: IAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`perpendicularAnchor: unknown shape "${endpoint.shapeId}"`);
  }

  const dx = fromPoint.x - ref.center.x;
  const dy = fromPoint.y - ref.center.y;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;

  // Degenerate fallback when the two endpoints coincide.
  if (dx === 0 && dy === 0) {
    return {
      x: ref.center.x + halfW,
      y: ref.center.y,
      tangent: { x: 1, y: 0 },
    };
  }

  // Compare the ratio so the face choice scales with each axis's extent.
  const rx = halfW > 0 ? Math.abs(dx) / halfW : Infinity;
  const ry = halfH > 0 ? Math.abs(dy) / halfH : Infinity;

  if (rx >= ry) {
    // Left or right face.
    const sx = dx >= 0 ? halfW : -halfW;
    return {
      x: ref.center.x + sx,
      y: ref.center.y,
      tangent: { x: dx >= 0 ? 1 : -1, y: 0 },
    };
  }

  // Top or bottom face.
  const sy = dy >= 0 ? halfH : -halfH;
  return {
    x: ref.center.x,
    y: ref.center.y + sy,
    tangent: { x: 0, y: dy >= 0 ? 1 : -1 },
  };
};
