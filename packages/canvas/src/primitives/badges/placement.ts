/**
 * Pure placement math for badges. Given the host's world-space AABB and the
 * badge's local-space AABB, resolve the world-space `(x, y)` to put on the
 * badge spec so that a chosen point on the badge's AABB lands at a chosen
 * point on the host's AABB (plus an optional pixel offset).
 *
 * No Pixi imports. Trivially testable.
 *
 * The maths splits cleanly along two axes:
 * 1. **Host anchor** — which point on the host AABB is the target. Driven by
 *    `BadgePlacement` (8 named points around the host).
 * 2. **Badge origin** — which point on the badge AABB lands at that anchor.
 *    Driven by the optional `origin` field. Defaults to the *mirror* of the
 *    placement so the badge sits fully outside the host edge.
 */

import type { Rect } from '../types';
import type { BadgeOptions, BadgePlacement } from './types';

/**
 * Returns the world-space point on `hostBounds` named by `placement`.
 * Edge placements sit at the midpoint of that edge; corner placements at the
 * corner.
 */
export function placementToHostAnchor(
  hostBounds: Rect,
  placement: BadgePlacement,
): { x: number; y: number } {
  const { x, y, width: w, height: h } = hostBounds;
  switch (placement) {
    case 'top':          return { x: x + w / 2, y };
    case 'bottom':       return { x: x + w / 2, y: y + h };
    case 'left':         return { x,             y: y + h / 2 };
    case 'right':        return { x: x + w,     y: y + h / 2 };
    case 'top-left':     return { x,             y };
    case 'top-right':    return { x: x + w,     y };
    case 'bottom-left':  return { x,             y: y + h };
    case 'bottom-right': return { x: x + w,     y: y + h };
  }
}

/**
 * Returns the point on the badge's local AABB that should land at the host
 * anchor, given the chosen origin. The default (omitted origin) is the
 * mirror of `placement` so the badge sits fully outside the host edge.
 */
export function originToBadgeLocal(
  badgeLocalBounds: Rect,
  placement: BadgePlacement,
  origin: BadgeOptions['origin'],
): { x: number; y: number } {
  if (origin === 'center') {
    return {
      x: badgeLocalBounds.x + badgeLocalBounds.width / 2,
      y: badgeLocalBounds.y + badgeLocalBounds.height / 2,
    };
  }
  const point = origin ?? mirrorPlacement(placement);
  // Reuse host-anchor math — it's the same "point on an AABB" computation,
  // just applied to the badge's local AABB instead of the host's world AABB.
  return placementToHostAnchor(badgeLocalBounds, point);
}

/**
 * Mirror of a placement across the host centre. `top-right` ↔ `bottom-left`,
 * `right` ↔ `left`, and so on. Used as the default `origin` so a badge with
 * `placement: 'top-right'` sits with its `bottom-left` corner at the host's
 * top-right corner — i.e. the badge nests fully outside the host edge.
 */
export function mirrorPlacement(p: BadgePlacement): BadgePlacement {
  switch (p) {
    case 'top':          return 'bottom';
    case 'bottom':       return 'top';
    case 'left':         return 'right';
    case 'right':        return 'left';
    case 'top-left':     return 'bottom-right';
    case 'top-right':    return 'bottom-left';
    case 'bottom-left':  return 'top-right';
    case 'bottom-right': return 'top-left';
  }
}

/**
 * Resolve the badge spec's `(x, y)` so that the chosen origin point on the
 * badge AABB lands at the chosen anchor point on the host AABB, plus the
 * caller's pixel offset.
 *
 * The badge spec's `(x, y)` represents the badge's *local-origin* in world
 * space (e.g. circle centre, rect top-left). Local AABB origin is at
 * `(badgeLocalBounds.x, badgeLocalBounds.y)` — for a circle these are
 * negative (`-r, -r`); for a rect they are `(0, 0)`. We compute the badge's
 * `(x, y)` such that the chosen origin point — at
 * `(specX + originLocal.x, specY + originLocal.y)` in world space — equals
 * the host anchor + offset.
 */
export function resolveBadgePosition(
  hostWorldBounds: Rect,
  badgeLocalBounds: Rect,
  options: BadgeOptions,
): { x: number; y: number } {
  const anchor = placementToHostAnchor(hostWorldBounds, options.placement);
  const originLocal = originToBadgeLocal(
    badgeLocalBounds,
    options.placement,
    options.origin,
  );
  return {
    x: anchor.x + (options.offsetX ?? 0) - originLocal.x,
    y: anchor.y + (options.offsetY ?? 0) - originLocal.y,
  };
}
