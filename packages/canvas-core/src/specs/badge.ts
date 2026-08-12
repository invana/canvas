/**
 * Badge descriptions — small shapes pinned to a host element.
 *
 * Pixi-free by construction: a badge says *what* to pin and *where*, never how
 * it is drawn. Lives in the spec vocabulary so domain packages can describe
 * badges without depending on a drawing backend.
 *
 */

import type { BaseShapeSpec } from './shape';
import type { DecorationSpec, EffectSpec } from './decoration';

/**
 * Anchor point on a host shape's axis-aligned bounding box.
 *
 * - The eight named values address the corners (`top-left`, …,
 *   `bottom-right`) and edge midpoints (`top` / `bottom` / `left` /
 *   `right`).
 * - The `{ x, y }` variant is a **raw world-space point** that bypasses the
 *   host AABB entirely. Use it when the badge needs to anchor at a position
 *   that has no relation to the host's bounds (e.g. an interaction-driven
 *   custom anchor); the badge re-anchors against this point the same way
 *   named placements re-anchor against the host bounds.
 */
export type BadgePlacement = NamedBadgePlacement | { readonly x: number; readonly y: number };

/**
 * The eight named anchor points on a host AABB — corners and edge midpoints.
 * The named-only subset of {@link BadgePlacement}; used by
 * {@link BadgeOptions.origin} (which never accepts a raw point) and by
 * internal mirror-math that only makes sense for the named cases.
 */
export type NamedBadgePlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Anchor point along a connector host's routed path.
 *
 * - `'start'` / `'end'` — anchored *near* the source / target endpoint with
 *   automatic clearance: the badge is shifted tangentially by its own
 *   half-extent so it kisses the endpoint shape's silhouette from outside
 *   rather than half-overlapping it. Use these when you want a badge
 *   visually associated with an endpoint (count chip, status icon).
 * - `'middle'` — exact arc-length midpoint (`t = 0.5`).
 * - A `number` in `[0, 1]` — raw arc-length `t`. **No clearance is
 *   applied** — `placement: 1` literally anchors at the silhouette point,
 *   the "raw" counterpart to `'end'`. Values outside `[0, 1]` are clamped.
 *
 * `'middle'` (not `'center'`) avoids the term clash with
 * {@link BadgeOptions.origin} where `'center'` means "centre the badge on
 * its own AABB". For loop edges (`pathType: 'loop-*'`), `'middle'`
 * naturally lands on the loop apex because the path passes through it at
 * `t ≈ 0.5`.
 */
export type ConnectorBadgePlacement = 'start' | 'middle' | 'end' | number;

/**
 * Shape spec accepted by `BadgeOptions.shape` — every `BaseShapeSpec` field
 * except `x` / `y` (placement supplies those), plus an open index for the
 * kind-specific fields each shape adds (`radius` on `CircleSpec`, `width` /
 * `height` / `cornerRadius` on `RectSpec`, future shape extras).
 *
 * The renderer doesn't validate kind-specific fields here — that happens
 * inside the registered shape's constructor. Keeping this type open avoids
 * enumerating every shape kind in the badge type surface.
 */
export type BadgeShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & {
  readonly [extraField: string]: unknown;
};

/**
 * Options for `PrimitivesRenderer.setBadge`. The `shape` field carries the
 * full shape spec (any kind + fill + stroke + kind-specific fields);
 * placement is interpreted differently depending on the host kind (shape
 * AABB vs. connector path) — see {@link placement}.
 *
 * The path-only fields ({@link pathOffset}, {@link autoRotate},
 * {@link keepUpright}) are ignored when the host is a shape.
 */
export interface BadgeOptions {
  /** The badge plate as a shape spec, sans `x` / `y` (placement provides position). */
  readonly shape: BadgeShapeSpec;

  /**
   * Where the badge attaches to its host.
   *
   * - **Shape host** — one of {@link BadgePlacement}: a named AABB anchor
   *   (corner / edge midpoint) or a raw `{x, y}` world point.
   * - **Connector host** — one of {@link ConnectorBadgePlacement}: `'start'`,
   *   `'middle'`, `'end'`, or an arc-length `t ∈ [0, 1]`.
   *
   * The host kind is resolved at `setBadge` time from the `hostId`; mismatches
   * (a named-AABB placement on a connector host, or `'middle'` on a shape
   * host) throw with a clear error.
   */
  readonly placement: BadgePlacement | ConnectorBadgePlacement;

  /** Pixel offset applied after origin resolution. Default `0` for both. */
  readonly offsetX?: number;
  readonly offsetY?: number;

  /**
   * **Connector hosts only.** Shift the path-anchor along the local tangent
   * direction (positive = forward toward `'end'`, negative = backward toward
   * `'start'`). Useful for nudging a `'middle'`-anchored badge sideways
   * along the line without changing its `t`. Ignored on shape hosts.
   */
  readonly pathOffset?: number;

  /**
   * **Connector hosts only.** When `true`, the badge's `rotation` follows
   * the path tangent at the anchor point — i.e. the badge tilts to read
   * along the line. Default `false`. Ignored on shape hosts.
   */
  readonly autoRotate?: boolean;

  /**
   * **Connector hosts only.** When {@link autoRotate} is `true`, flip the
   * badge by 180° if the tangent points "downwards" so its top edge always
   * faces the viewer (text remains readable on every edge orientation).
   * Default `true`. Ignored on shape hosts.
   */
  readonly keepUpright?: boolean;

  /**
   * Which point of the badge's own AABB lands at the host anchor.
   *
   * - **`undefined`** (default): mirror of `placement`. The badge sits fully
   *   outside the host edge — e.g. `placement: 'top-right'` puts the badge's
   *   bottom-left corner at the host's top-right corner. (When `placement`
   *   is a raw `{x, y}` point with no inherent mirror, the default falls
   *   back to `'center'`.)
   * - **`'center'`**: the badge centres on the anchor and half-overhangs
   *   the host edge (the gray "A" pattern in the reference design).
   * - **A named `BadgePlacement`**: any of the eight points on the badge.
   *   The raw `{x, y}` variant of `BadgePlacement` is not valid here —
   *   origin is always a named point on the badge.
   */
  readonly origin?: NamedBadgePlacement | 'center';

  /**
   * Decorations applied to the badge shape, keyed by slot. Internally each
   * entry becomes a `setDecoration(badgeId, slot, spec)` call, so any
   * registered decoration kind (glow, ring, marching-ants, …) works.
   */
  readonly decorations?: Readonly<Record<string, DecorationSpec>>;

  /**
   * Effects applied to the badge shape, keyed by slot. Internally each entry
   * becomes a `setEffect(badgeId, slot, spec)` call, so any registered shape
   * effect (`shake`, `breathing`, …) modulates the badge's transform / style
   * the same way it would a free-standing shape.
   *
   * Lifecycle parity with `decorations`: replacing the badge via `setBadge`
   * disposes prior effects; removing the host disposes the badge and all its
   * effects.
   */
  readonly effects?: Readonly<Record<string, EffectSpec>>;
}
