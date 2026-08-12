import type { IPathStyle, PathCommand } from '@invana/canvas-store';

interface BumpRadialOpts {
  /**
   * Polar origin (centre of the polar coordinate system) in world units.
   * Source / target angles are measured from this point. Default `(0, 0)`.
   *
   * Set this when your radial layout is centred somewhere other than the
   * world origin — e.g. an offset hierarchy, a sub-tree positioned beside
   * a sibling cluster.
   */
  readonly origin?: { readonly x: number; readonly y: number };
}

/**
 * Single cubic Bézier from the first to the last polyline point with control
 * points placed on the **midradius circle** at the source and target angles.
 *
 * This is the same curve `d3.linkRadial()` produces, ported to operate on
 * cartesian polyline endpoints (we recover the polar coordinates from the
 * configured origin). It gives a tree edge that:
 *  - leaves the source tangent to the radius (radially outward / inward),
 *  - sweeps through the midradius arc between the two angles,
 *  - arrives at the target tangent to the radius.
 *
 * The result reads correctly in any orientation — it doesn't bulge sideways
 * the way an axis-aligned `bezier` does on near-vertical edges. Pair with
 * `router: 'straight'`; intermediate polyline waypoints are ignored (a
 * router that produces extra points doesn't compose meaningfully with a
 * polar curve).
 *
 * Edge cases:
 *  - Co-linear with the origin (`r0` or `r1` is zero, or both angles equal):
 *    falls back to a straight line, since a polar curve isn't defined.
 *  - Polyline shorter than two points: returns `[]` (matches other styles).
 */
export const bumpRadialPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const origin = (opts as BumpRadialOpts | undefined)?.origin ?? { x: 0, y: 0 };

  const s = polyline[0]!;
  const t = polyline[polyline.length - 1]!;
  const sxRel = s.x - origin.x;
  const syRel = s.y - origin.y;
  const txRel = t.x - origin.x;
  const tyRel = t.y - origin.y;

  const r0 = Math.hypot(sxRel, syRel);
  const r1 = Math.hypot(txRel, tyRel);

  // Degenerate cases — emit a straight segment. A polar curve would either
  // collapse to zero or NaN.
  if (r0 === 0 || r1 === 0) {
    return [
      { kind: 'M', x: s.x, y: s.y },
      { kind: 'L', x: t.x, y: t.y },
    ];
  }

  const a0 = Math.atan2(syRel, sxRel);
  const a1 = Math.atan2(tyRel, txRel);
  const rMid = (r0 + r1) / 2;

  const c1x = origin.x + rMid * Math.cos(a0);
  const c1y = origin.y + rMid * Math.sin(a0);
  const c2x = origin.x + rMid * Math.cos(a1);
  const c2y = origin.y + rMid * Math.sin(a1);

  const out: PathCommand[] = [
    { kind: 'M', x: s.x, y: s.y },
    { kind: 'C', c1x, c1y, c2x, c2y, x: t.x, y: t.y },
  ];
  return out;
};
