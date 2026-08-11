/**
 * Connector specs, endpoints and the anchor contract.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

import type { Endpoint, Point, Rect, Vec2 } from './geometry';
import type { MarkerShapeSpec } from './shape';
import type { ShapeStroke } from './style';

export type AnchorSpec =
  | string
  | { readonly name: string; readonly opts?: Readonly<Record<string, unknown>> };

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | {
      readonly kind: 'shape';
      readonly shapeId: string;
      readonly anchor?: AnchorSpec;
      /**
       * Outward offset applied AFTER the anchor resolves. The anchor's
       * returned `tangent` is treated as the outward direction; the endpoint
       * moves by `tangent * padding` world units before reaching the router.
       *
       * Use cases:
       * - Halo / glow decoration extends beyond the silhouette → set
       *   `padding` to the halo's outer radius so the connector visibly
       *   starts at the halo's edge, not at the shape's tight boundary.
       * - Visual breathing room around tightly packed shapes.
       *
       * No-op when the chosen anchor returns no tangent (e.g. `center`).
       * Negative values pull the endpoint INWARD; default `0`.
       */
      readonly padding?: number;
    };

/**
 * Read-only view of a shape that an anchor function consumes. The renderer
 * builds one of these for the referenced shape id and hands it to the
 * registered anchor. Anchors operate against this — they never see the live
 * `ShapeInstance` or `Pixi` objects.
 *
 * **Origin vs centre.** `origin` is the shape's spec position `(spec.x,
 * spec.y)` — this is the top-left for `RectShape`, the centre for
 * `CircleShape`, and shape-dependent for others. `center` is the geometric
 * centre of the bounding box in world space, computed by the renderer from
 * `origin` + `bounds`. Anchors should reference `center` (not `origin`) so
 * their behaviour is uniform across shape kinds.
 */

export interface AnchorShapeRef {
  /** World-space origin of the shape (`(spec.x, spec.y)`). */
  readonly origin: Point;
  /** Local-space axis-aligned bounding box (relative to `origin`). */
  readonly bounds: Rect;
  /** World-space geometric centre of the shape's bounding box. */
  readonly center: Point;
  /**
   * Optional analytical boundary-intersection in shape-local coordinates,
   * relative to the shape's geometric **centre** (not its `origin`).
   * Anchors fall back to a default centred-AABB ray-exit when this is
   * absent. `localFromCenter` is the other endpoint's offset from the
   * shape's centre.
   */
  boundaryIntersect?(localFromCenter: Point): Point | null;
}

export interface AnchorCtx {
  getShape(id: string): AnchorShapeRef | undefined;
}

/**
 * Anchor: a pure function that resolves a `kind: 'shape'` endpoint to a
 * concrete world-space point on the referenced shape.
 *
 * - `endpoint` carries the shape id and any per-call opts.
 * - `fromPoint` is the OTHER endpoint's first-pass world point — used by
 *   `boundary` to project a ray toward it. Anchors that don't need it
 *   (`center`) ignore it.
 * - The returned `Endpoint` may include an outward `tangent` hint; routers
 *   that respect it (`orthogonal`, `er`, …) prefer it over heuristics.
 */

export type IAnchor = (
  endpoint: { readonly shapeId: string; readonly opts?: Readonly<Record<string, unknown>> },
  fromPoint: Point,
  ctx: AnchorCtx,
) => Endpoint;

export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  /** Intermediate user-supplied points the router must respect. Optional. */
  readonly waypoints?: ReadonlyArray<Point>;
  /** Registered router kind. Default `'straight'`. */
  readonly router?: string;
  /** Per-router options forwarded to the router fn's `opts` parameter. */
  readonly routerOpts?: Readonly<Record<string, unknown>>;
  /** Registered pathStyle kind. Default `'normal'`. */
  readonly pathStyle?: string;
  /** Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter. */
  readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
  /** Optional shape spec painted at the source endpoint, oriented along the path tangent. */
  readonly sourceMarker?: MarkerShapeSpec;
  /** Optional shape spec painted at the target endpoint, oriented along the path tangent. */
  readonly targetMarker?: MarkerShapeSpec;
  readonly stroke?: ShapeStroke;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

// ─── Host info (renderer → primitive) ──────────────────────────────────────

/**
 * Information a `Shape` instance receives at construction. The renderer hands
 * shapes the surface to attach to plus the registries that fill resolution
 * needs (`textureRegistry` for image fills).
 */
