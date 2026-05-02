// ── geometry/ ─────────────────────────────────────────────────────────────────
// Pure ray-vs-primitive math + Bezier flattening helpers.
// Stateless. No PixiJS, no plugin types.

export {
  rayVsSegment,
  rayVsCircle,
  rayVsEllipse,
  rayVsRect,
  rayVsPolyline,
  rayPointAt,
  unit,
} from './ray.js';
export type { RayPolylineHit } from './ray.js';

export { flattenCubic, flattenQuadratic, flattenPath } from './flatten.js';
