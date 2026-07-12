import type { D3ForceLayoutFields, D3ForceLayoutOptions } from './types';

/**
 * Map a `D3ForceLayoutOptions`-shaped patch to the flat
 * {@link D3ForceLayoutFields}. The nested force groups (`link` / `charge` /
 * `center` / `collide`) are read out into prefixed scalar fields;
 * `collide.radius` is only surfaced when it's a constant (function radii are
 * out of scope).
 */
export function optionsToForm(o: D3ForceLayoutOptions = {}): D3ForceLayoutFields {
  return {
    animate: o.animate,
    reheatAlpha: o.reheatAlpha,
    alpha: o.alpha,
    alphaMin: o.alphaMin,
    alphaDecay: o.alphaDecay,
    alphaTarget: o.alphaTarget,
    velocityDecay: o.velocityDecay,
    linkDistance: o.link?.distance,
    linkStrength: o.link?.strength,
    linkIterations: o.link?.iterations,
    chargeStrength: o.charge?.strength,
    chargeTheta: o.charge?.theta,
    chargeDistanceMin: o.charge?.distanceMin,
    chargeDistanceMax: o.charge?.distanceMax,
    centerX: o.center?.x,
    centerY: o.center?.y,
    centerStrength: o.center?.strength,
    collideRadius: typeof o.collide?.radius === 'number' ? o.collide.radius : undefined,
    collideStrength: o.collide?.strength,
    collideIterations: o.collide?.iterations,
    clusterStrength: o.cluster?.strength,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3ForceLayoutOptions} patch. Only fields the form set are included, and
 * each nested force group is reassembled only when at least one of its members
 * is set — so the result is safe to spread over the layout's current options.
 */
export function formToOptions(f: D3ForceLayoutFields): D3ForceLayoutOptions {
  const out: D3ForceLayoutOptions = {};
  if (f.animate !== undefined) out.animate = f.animate;
  if (f.reheatAlpha !== undefined) out.reheatAlpha = f.reheatAlpha;
  if (f.alpha !== undefined) out.alpha = f.alpha;
  if (f.alphaMin !== undefined) out.alphaMin = f.alphaMin;
  if (f.alphaDecay !== undefined) out.alphaDecay = f.alphaDecay;
  if (f.alphaTarget !== undefined) out.alphaTarget = f.alphaTarget;
  if (f.velocityDecay !== undefined) out.velocityDecay = f.velocityDecay;

  if (f.linkDistance !== undefined || f.linkStrength !== undefined || f.linkIterations !== undefined) {
    out.link = {
      ...(f.linkDistance !== undefined ? { distance: f.linkDistance } : {}),
      ...(f.linkStrength !== undefined ? { strength: f.linkStrength } : {}),
      ...(f.linkIterations !== undefined ? { iterations: f.linkIterations } : {}),
    };
  }

  if (
    f.chargeStrength !== undefined ||
    f.chargeTheta !== undefined ||
    f.chargeDistanceMin !== undefined ||
    f.chargeDistanceMax !== undefined
  ) {
    out.charge = {
      ...(f.chargeStrength !== undefined ? { strength: f.chargeStrength } : {}),
      ...(f.chargeTheta !== undefined ? { theta: f.chargeTheta } : {}),
      ...(f.chargeDistanceMin !== undefined ? { distanceMin: f.chargeDistanceMin } : {}),
      ...(f.chargeDistanceMax !== undefined ? { distanceMax: f.chargeDistanceMax } : {}),
    };
  }

  if (f.centerX !== undefined || f.centerY !== undefined || f.centerStrength !== undefined) {
    out.center = {
      ...(f.centerX !== undefined ? { x: f.centerX } : {}),
      ...(f.centerY !== undefined ? { y: f.centerY } : {}),
      ...(f.centerStrength !== undefined ? { strength: f.centerStrength } : {}),
    };
  }

  if (f.collideRadius !== undefined || f.collideStrength !== undefined || f.collideIterations !== undefined) {
    out.collide = {
      ...(f.collideRadius !== undefined ? { radius: f.collideRadius } : {}),
      ...(f.collideStrength !== undefined ? { strength: f.collideStrength } : {}),
      ...(f.collideIterations !== undefined ? { iterations: f.collideIterations } : {}),
    };
  }

  // A set strength enables clustering; empty leaves `cluster` undefined (off).
  if (f.clusterStrength !== undefined) {
    out.cluster = { strength: f.clusterStrength };
  }

  return out;
}
