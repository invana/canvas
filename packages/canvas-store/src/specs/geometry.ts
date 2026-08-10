/**
 * Pure geometry — points, rectangles, polylines, paths, and the router / pathStyle
 * function contracts that operate on them. No drawing library appears here.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

// ─── Geometry primitives ───────────────────────────────────────────────────

// Defined once, in the kernel's geometry vocabulary, and re-exported here so the
// spec surface stays self-describing. Do not redeclare them — `../geom/types` is
// the single home (see the RFC that merged the two definitions:
// `docs/rfcs/fix/2026-08-10-zustand-imported-outside-canvas-store.md` §4.4).
export type { Point, Vec2, Rect, Size } from '../geom/types';

import type { Point, Vec2, Rect } from '../geom/types';

/** Endpoint anchor a router consumes — point + optional outgoing tangent. */

export interface Endpoint {
  readonly x: number;
  readonly y: number;
  readonly tangent?: Vec2;
}

// ─── Polyline (router output, pathStyle input) ─────────────────────────────

/**
 * Flat ordered list of points. Output of a `Router`; input to a `PathStyle`.
 * Also used as the densified form of a `Path` for hit-testing
 * (`samplePath(path)`).
 */

export type Polyline = ReadonlyArray<Point>;

// ─── Path (pathStyle output, connector input) ──────────────────────────────

/**
 * One step of a `Path`. Mirrors SVG path commands one-for-one:
 * - `M` move to absolute (x, y) — must be the first command of any Path.
 * - `L` line to (x, y) from the current point.
 * - `Q` quadratic Bézier with one control point.
 * - `C` cubic Bézier with two control points.
 *
 * No relative variants, no arcs, no shorthand — pathStyles emit one of these
 * four. Connector renders by walking the path and dispatching to Pixi's
 * `moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`.
 */

export type PathCommand =
  | { readonly kind: 'M'; readonly x: number; readonly y: number }
  | { readonly kind: 'L'; readonly x: number; readonly y: number }
  | { readonly kind: 'Q'; readonly cx: number; readonly cy: number; readonly x: number; readonly y: number }
  | { readonly kind: 'C'; readonly c1x: number; readonly c1y: number; readonly c2x: number; readonly c2y: number; readonly x: number; readonly y: number };

export type Path = ReadonlyArray<PathCommand>;

/**
 * Read-only scene context handed to routers that need awareness of other
 * shapes — primarily for obstacle-avoidance routing (`manhattan` and
 * friends). Simple geometric routers (`straight`, `orth`) ignore it.
 *
 * `obstacles` are world-space `Rect`s the router should not cross. Each
 * obstacle may also expose `containsInflated` for pixel-accurate silhouette
 * testing (e.g. circles route around their tangent, not their AABB).
 * The renderer auto-collects these from `shapeInstances` (excluding the
 * source/target shapes); callers can override or opt out via
 * `routerOpts.obstacles`.
 */

export interface RouterCtx {
  readonly obstacles: ReadonlyArray<Obstacle>;
}

/**
 * Obstacle handed to obstacle-aware routers. `Obstacle extends Rect` so any
 * `Rect[]` is assignable; the optional `containsInflated` callback unlocks
 * silhouette-tight routing for non-rect shapes (circles, polygons, paths).
 */

export interface Obstacle extends Rect {
  /**
   * Optional silhouette obstacle-test in world coordinates. Returns `true`
   * when `(worldX, worldY)` lies inside the obstacle's silhouette OR within
   * `inflate` world units of it.
   *
   * Routers use this for pixel-accurate marking — when present, the grid
   * blocks only cells that pass this test (in addition to the cheap AABB
   * pre-filter). When absent, the inflated AABB is the source of truth.
   *
   * Shapes opt in by overriding `IShape.obstacleTest`.
   */
  readonly containsInflated?: (worldX: number, worldY: number, inflate: number) => boolean;
}

/**
 * Router: a pure function `(source, target, waypoints?, opts?, ctx?) → Polyline`.
 *
 * Routers decide path **topology** — where bends sit. They emit a flat
 * polyline (Point[]); the visual style of segments between bend points is
 * decided by the downstream `PathStyle`. Routers never touch pixi.
 *
 * `waypoints` are intermediate user-supplied points the router should respect.
 * Built-in `straight` passes them through verbatim; topological routers
 * (orth, manhattan, …) anchor stair / corner segments to them.
 *
 * `ctx` is optional — only obstacle-aware routers consume it. The renderer
 * always passes a `RouterCtx`; routers that ignore it lose nothing.
 */

export type IRouter = (
  source: Endpoint,
  target: Endpoint,
  waypoints?: ReadonlyArray<Point>,
  opts?: Record<string, unknown>,
  ctx?: RouterCtx,
) => Polyline;

/**
 * Anchor-resolved endpoints handed to a pathStyle alongside the polyline.
 *
 * Tangent-aware pathStyles (`bump-horizontal`, …) read `source.tangent` /
 * `target.tangent` to place their Bézier handles along each shape's outward
 * surface normal, so the curve leaves and arrives flush with the silhouette
 * instead of in a hard-coded direction. Tangent-agnostic pathStyles (`normal`,
 * `rounded`, …) simply ignore the argument — it's optional and additive.
 */

export interface PathStyleEndpoints {
  readonly source: Endpoint;
  readonly target: Endpoint;
}

/**
 * PathStyle: a pure function `(polyline, opts?, endpoints?) → Path`.
 *
 * PathStyles decide visual **style** — how segments between polyline points
 * are drawn (sharp, rounded fillets, bezier-smoothed, single bezier A→B).
 * They never see the connector spec or shape context; pure geometric
 * transform.
 *
 * `endpoints` carries the anchor-resolved source/target (with `tangent`) so
 * tangent-aware styles can align Bézier handles with each shape's outward
 * normal. Optional — styles that don't need it ignore the argument and a
 * direct unit-test invocation (`bumpHorizontal(polyline)`) keeps working.
 *
 * Built-ins: `normal` (sharp), `rounded` (quadratic fillets at corners),
 * `smooth` (Catmull-Rom → cubic), `bezier` (single cubic with auto controls).
 */

export type IPathStyle = (
  polyline: Polyline,
  opts?: Record<string, unknown>,
  endpoints?: PathStyleEndpoints,
) => Path;

// ─── Fill ──────────────────────────────────────────────────────────────────

/**
 * Anchor positions for inset content layers (`glyph`, `svg`, `svg-url`).
 * Defaults to `'center'`. Use `'top-right'` etc. for corner-badge
 * composition.
 */

/**
 * Stable key of a connector spec with paint removed — geometry only.
 *
 * Two specs with the same key route to the same path, so a caller can skip a
 * re-route when only `stroke` changed. Pure: it reads the spec and nothing
 * else, which is why it lives here rather than on a renderer.
 */
export function connectorGeometryKey(spec: object): string {
  const { stroke: _stroke, ...geometry } = spec as { stroke?: unknown };
  return JSON.stringify(geometry);
}
