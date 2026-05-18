/**
 * Badge type surface.
 *
 * A badge is a regular shape registered as a "follower" of a host shape — its
 * `(x, y)` is computed from the host's AABB + a placement anchor. Because a
 * badge is just a shape under the hood (registered with id
 * `${hostId}:${slot}`), it picks up every existing capability for free:
 * any registered shape kind as a plate, any `ShapeFillLayer` as content
 * (solid / image / glyph / svg / svg-url), and any registered decoration
 * via `setDecoration` on the badge id.
 *
 * See `badges-plan.md` at the repo root for the full design rationale.
 */

import type { BaseShapeSpec, DecorationSpec } from '../types';

/**
 * Eight anchor points around a host shape's axis-aligned bounding box.
 * Edge anchors (`top` / `bottom` / `left` / `right`) sit at the midpoint of
 * that edge; corner anchors sit at the corner.
 */
export type BadgePlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

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
 * placement-only concerns (where the badge sits, what part of it lands at
 * the host anchor, any nested decorations) are the four extra fields.
 */
export interface BadgeOptions {
  /** The badge plate as a shape spec, sans `x` / `y` (placement provides position). */
  readonly shape: BadgeShapeSpec;

  /** Anchor point on the host AABB. */
  readonly placement: BadgePlacement;

  /** Pixel offset applied after origin resolution. Default `0` for both. */
  readonly offsetX?: number;
  readonly offsetY?: number;

  /**
   * Which point of the badge's own AABB lands at the host anchor.
   *
   * - **`undefined`** (default): mirror of `placement`. The badge sits fully
   *   outside the host edge — e.g. `placement: 'top-right'` puts the badge's
   *   bottom-left corner at the host's top-right corner.
   * - **`'center'`**: the badge centres on the anchor and half-overhangs
   *   the host edge (the gray "A" pattern in the reference design).
   * - **An explicit `BadgePlacement`**: any of the eight points on the badge.
   */
  readonly origin?: BadgePlacement | 'center';

  /**
   * Decorations applied to the badge shape, keyed by slot. Internally each
   * entry becomes a `setDecoration(badgeId, slot, spec)` call, so any
   * registered decoration kind (glow, ring, marching-ants, …) works.
   */
  readonly decorations?: Readonly<Record<string, DecorationSpec>>;
}
