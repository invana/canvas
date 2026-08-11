import type { IAnchor } from '@invana/canvas-store';

/**
 * Default anchor — resolves a shape endpoint to the shape's bounding-box
 * **centre** in world space. Uses `ref.center` (computed by the renderer
 * from `origin + bounds`) rather than the raw `(spec.x, spec.y)` origin so
 * the anchor is uniform regardless of each shape's local-origin convention
 * (`RectShape` is anchored top-left; `CircleShape` is centred).
 *
 * Ignores `fromPoint`; the centre never depends on the other endpoint.
 */
export const centerAnchor: IAnchor = (endpoint, _fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`centerAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  return { x: ref.center.x, y: ref.center.y };
};
