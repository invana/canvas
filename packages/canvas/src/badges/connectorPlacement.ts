/**
 * Pure placement math for connector-hosted badges. Given a router-resolved
 * `Path` and the badge's local-space AABB, resolve the world-space `(x, y)`
 * (plus optional rotation) so that a chosen point on the badge's AABB lands
 * on a chosen anchor along the path — `'start'` / `'middle'` / `'end'` or
 * an arbitrary arc-length `t ∈ [0, 1]`.
 *
 * No Pixi imports. The math mirrors {@link LabelConnectorDecoration} so
 * connector badges and connector labels share the same arc-length walk.
 */

import type { Path } from '../specs';
import type { BadgeOptions, ConnectorBadgePlacement } from './types';
import { samplePathAt } from '../connectors/pathSampling';
import { originToBadgeLocal } from './placement';
import type { Rect } from '../specs';

/**
 * Map a {@link ConnectorBadgePlacement} to an arc-length parameter `t ∈
 * [0, 1]`. Numbers outside the closed unit interval are clamped.
 */
export function resolveConnectorT(placement: ConnectorBadgePlacement): number {
  if (typeof placement === 'number') {
    if (placement <= 0) return 0;
    if (placement >= 1) return 1;
    return placement;
  }
  switch (placement) {
    case 'start':
      return 0;
    case 'middle':
      return 0.5;
    case 'end':
      return 1;
  }
}

/**
 * Resolve the badge spec's `(x, y)` (and optional `rotation`) so that the
 * chosen origin point on the badge's local AABB lands at the path-anchor
 * defined by `options.placement`. The origin defaults to `'center'` for
 * connector hosts (badge centres on the path point); shape-style mirror
 * defaults don't apply here because the path has no "outside edge".
 *
 * The returned `rotation` is `0` unless {@link BadgeOptions.autoRotate} is
 * `true`. When auto-rotating with `keepUpright !== false` (the default),
 * tangents whose angle exceeds `±90°` are flipped by `π` so the badge's
 * top edge keeps facing the viewer.
 */
/**
 * Per-endpoint extra clearance added to the auto-shift when
 * {@link BadgeOptions.placement} is `'start'` or `'end'`. The renderer
 * passes the source / target marker length here (so the badge clears the
 * arrowhead, not just the trimmed path endpoint) plus a small visual gap.
 *
 * Numeric placements (`0`, `1`, raw `t`) ignore this — they're the "raw
 * arc-length" escape hatch.
 */
export interface ConnectorBadgeEndpointClearance {
  readonly source: number;
  readonly target: number;
}

/** Default pixel gap inserted between an endpoint-anchored badge and the
 *  endpoint shape's silhouette (or, when a marker is present, the marker's
 *  far tip). Tunable by callers via the `clearance` parameter — this is
 *  just the engine-side floor when the renderer doesn't know better. */
export const DEFAULT_ENDPOINT_BADGE_GAP_PX = 8;

export function resolveConnectorBadgePosition(
  path: Path,
  badgeLocalBounds: Rect,
  options: BadgeOptions,
  clearance: ConnectorBadgeEndpointClearance = { source: 0, target: 0 },
): { x: number; y: number; rotation: number } {
  const placement = options.placement as ConnectorBadgePlacement;
  const t = resolveConnectorT(placement);
  const sample = samplePathAt(path, t);

  let baseX = sample.point.x;
  let baseY = sample.point.y;

  // Endpoint-clearance for the named `'start'` / `'end'` placements.
  //
  // The routed path stops at the source / target shape's *silhouette*, so a
  // badge centred on `t=0` or `t=1` would half-overlap the endpoint shape.
  // For the named placements we treat that overlap as a bug: shift the
  // badge tangentially by its own tangent-aligned half-extent so its
  // line-facing edge kisses the silhouette from outside, leaving the
  // endpoint shape un-occluded.
  //
  // Numeric placement (`0`, `1`, or any `t ∈ [0,1]`) keeps the raw
  // arc-length contract — use `placement: 0` / `placement: 1` when you
  // explicitly want a badge anchored at the silhouette point.
  if (placement === 'start' || placement === 'end') {
    // L1-norm projection of the badge's local half-extents onto the
    // tangent. Conservative for axis-aligned badges; exact when the badge
    // is rotated to align with the tangent (autoRotate).
    const halfTangentExtent =
      Math.abs(sample.tangent.x) * (badgeLocalBounds.width / 2) +
      Math.abs(sample.tangent.y) * (badgeLocalBounds.height / 2);
    // Per-endpoint extra clearance — marker length + a visual gap so the
    // arrowhead doesn't end up tucked under the badge. The renderer
    // computes these from `markerInsetFor(...)` + the engine-default gap.
    const extra = placement === 'start' ? clearance.source : clearance.target;
    // `'start'` at t=0: tangent points *forward* (toward target). Pushing
    // forward moves the badge off the source silhouette toward the line.
    // `'end'` at t=1: tangent still points forward (continuing past target).
    // Pushing backward moves the badge off the target silhouette toward
    // the line.
    const dir = placement === 'start' ? 1 : -1;
    const totalShift = (halfTangentExtent + extra) * dir;
    baseX += sample.tangent.x * totalShift;
    baseY += sample.tangent.y * totalShift;
  }

  // Tangent-space `pathOffset` — additional shift along the tangent on top
  // of any endpoint-clearance, so users can fine-tune.
  const pathOffset = options.pathOffset ?? 0;
  if (pathOffset !== 0) {
    baseX += sample.tangent.x * pathOffset;
    baseY += sample.tangent.y * pathOffset;
  }

  // Rotation — atan2 of the tangent vector. `keepUpright` flips the badge
  // by π when the tangent points "downwards" so text decorations stay
  // readable on every edge orientation.
  let rotation = 0;
  if (options.autoRotate === true) {
    let theta = Math.atan2(sample.tangent.y, sample.tangent.x);
    if (options.keepUpright !== false) {
      if (theta > Math.PI / 2) theta -= Math.PI;
      else if (theta < -Math.PI / 2) theta += Math.PI;
    }
    rotation = theta;
  }

  // Connector hosts default `origin` to `'center'` (badge sits *on* the
  // path point); shape-style mirror defaults have no analog here. Reuse
  // {@link originToBadgeLocal} — passing `'top'` as a sentinel placement
  // is fine because the function only consults `placement` when the
  // origin is omitted, and we always supply `'center'` as the fallback.
  const originLocal = originToBadgeLocal(
    badgeLocalBounds,
    'top',
    options.origin ?? 'center',
  );

  // Screen-space offset applied after rotation so the badge keeps its
  // intended offset relative to the path's local frame.
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  let rotatedOffsetX = offsetX;
  let rotatedOffsetY = offsetY;
  if (rotation !== 0 && (offsetX !== 0 || offsetY !== 0)) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    rotatedOffsetX = offsetX * cos - offsetY * sin;
    rotatedOffsetY = offsetX * sin + offsetY * cos;
  }

  return {
    x: baseX + rotatedOffsetX - originLocal.x,
    y: baseY + rotatedOffsetY - originLocal.y,
    rotation,
  };
}
