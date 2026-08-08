/**
 * Connector geometry — spec in, path out, with no backend involved.
 *
 * **Anchors** resolve an endpoint to a point, **routers** turn two endpoints
 * (plus obstacles) into a `Path`, **path styles** restyle that path's segments,
 * and `pathSampling` densifies a path into a polyline and measures it.
 *
 * This is engine code, not drawing code. It moved out of `primitives/` when the
 * pixi backend was split off (§9, P6): a router answers a *geometry* question,
 * and the design already requires that geometry answers not need a backend
 * (§5) — the same rule that put picking and bounds engine-side. A three.js
 * renderer reuses every file here unchanged.
 */

// ─── Anchors — endpoint → point ────────────────────────────────────────────
export { centerAnchor } from './anchors/center';
export { boundaryAnchor } from './anchors/boundary';
export { perpendicularAnchor } from './anchors/perpendicular';
export { edgePortAnchor } from './anchors/edgePort';
export { silhouettePortAnchor } from './anchors/silhouettePort';

// ─── Routers — endpoints (+ obstacles) → Path ──────────────────────────────
export { straightRouter } from './routers/straight';
export { orthRouter } from './routers/orth';
export { manhattanRouter } from './routers/manhattan';
export { metroRouter } from './routers/metro';
export { erRouter } from './routers/er';
export { oneSideRouter } from './routers/oneSide';

// ─── Path styles — Path → restyled Path ────────────────────────────────────
export { normalPathStyle } from './pathStyles/normal';
export { roundedPathStyle } from './pathStyles/rounded';
export { bezierPathStyle } from './pathStyles/bezier';
export { quadraticPathStyle } from './pathStyles/quadratic';
export { bumpRadialPathStyle } from './pathStyles/bumpRadial';
export { bumpHorizontalPathStyle } from './pathStyles/bumpHorizontal';
export { smoothPathStyle } from './pathStyles/smooth';
export { stepRadialPathStyle } from './pathStyles/stepRadial';
export { bundlePathStyle } from './pathStyles/bundle';
export { loopPolylinePathStyle } from './pathStyles/loopPolyline';
export {
  loopCurvePathStyle,
  LOOP_CURVE_PRESETS,
  type LoopCurvePresetName,
} from './pathStyles/loopCurve';

// ─── Sampling + measurement ────────────────────────────────────────────────
export {
  samplePath,
  samplePathAt,
  pathBounds,
  trimPathEnds,
  distanceToPolylineSq,
} from './pathSampling';
