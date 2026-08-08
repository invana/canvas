import type { IPathStyle, PathCommand } from '../../specs';

interface BundleOpts {
  /**
   * Bundling tension in `[0, 1]`. `0` collapses the curve to a straight chord
   * between the endpoints (the B-spline through the lerp line is linear);
   * `1` is a strict open cubic B-spline through every polyline point;
   * intermediate values β-blend each control point toward the chord per
   * `P_i' = β·P_i + (1 - β)·lerp(P_0, P_{n-1}, i/(n-1))`. Default `0.85`,
   * matching d3-shape's `curveBundle` default and the Observable
   * Hierarchical Edge Bundling example.
   */
  readonly beta?: number;
}

const DEFAULT_BETA = 0.85;

/**
 * Hierarchical-edge-bundling curve through the polyline, emitted as cubic
 * Béziers. This is the d3-shape `curveBundle.beta(β)` shape: an open cubic
 * B-spline driven by control points that are β-blended toward the straight
 * line from `P_0` to `P_{n-1}`.
 *
 * Pair with `router: 'straight'` and feed the hierarchy-ancestor sequence as
 * `waypoints` on the connector spec (per-edge layout output); the router will
 * pass `[source, ...waypoints, target]` through unchanged, and this pathStyle
 * sees the full sequence.
 *
 * Reference: d3-shape `src/curve/bundle.js` + `src/curve/basis.js`.
 */
export const bundlePathStyle: IPathStyle = (polyline, opts) => {
  const n = polyline.length;
  if (n < 2) return [];

  const p0 = polyline[0]!;
  const pn = polyline[n - 1]!;

  // 2 points = no interior to bundle — straight line.
  if (n === 2) {
    return [
      { kind: 'M', x: p0.x, y: p0.y },
      { kind: 'L', x: pn.x, y: pn.y },
    ];
  }

  const beta = clamp01((opts as BundleOpts | undefined)?.beta ?? DEFAULT_BETA);
  const dx = pn.x - p0.x;
  const dy = pn.y - p0.y;
  const inv = 1 / (n - 1);

  // β-blend each control point toward the straight chord. β=1 leaves the
  // polyline untouched (strict B-spline); β=0 maps every point onto the
  // chord (the B-spline through collinear points is linear).
  const bx: number[] = new Array(n);
  const by: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i * inv;
    const pi = polyline[i]!;
    bx[i] = beta * pi.x + (1 - beta) * (p0.x + t * dx);
    by[i] = beta * pi.y + (1 - beta) * (p0.y + t * dy);
  }

  // Open cubic B-spline emitted as Bézier segments. Matches d3.Basis.lineEnd
  // semantics: a `moveTo(B0)`, a `lineTo((5·B0 + B1)/6)` to anchor the first
  // segment, then for each `i ≥ 2` a Bézier from the running pen to the
  // averaged knot `(B_{i-2} + 4·B_{i-1} + B_i)/6` using the standard
  // B-spline-to-Bézier conversion, and finally a closing Bézier into
  // `(B_{n-2} + 5·B_{n-1})/6` plus a `lineTo(B_{n-1})` so the curve actually
  // terminates at the last input point rather than at the averaged knot.
  const out: PathCommand[] = [];
  out.push({ kind: 'M', x: bx[0]!, y: by[0]! });
  out.push({
    kind: 'L',
    x: (5 * bx[0]! + bx[1]!) / 6,
    y: (5 * by[0]! + by[1]!) / 6,
  });

  for (let i = 2; i < n; i++) {
    const x0 = bx[i - 2]!;
    const y0 = by[i - 2]!;
    const x1 = bx[i - 1]!;
    const y1 = by[i - 1]!;
    const x = bx[i]!;
    const y = by[i]!;
    out.push({
      kind: 'C',
      c1x: (2 * x0 + x1) / 3,
      c1y: (2 * y0 + y1) / 3,
      c2x: (x0 + 2 * x1) / 3,
      c2y: (y0 + 2 * y1) / 3,
      x: (x0 + 4 * x1 + x) / 6,
      y: (y0 + 4 * y1 + y) / 6,
    });
  }

  const xN1 = bx[n - 2]!;
  const yN1 = by[n - 2]!;
  const xN = bx[n - 1]!;
  const yN = by[n - 1]!;
  out.push({
    kind: 'C',
    c1x: (2 * xN1 + xN) / 3,
    c1y: (2 * yN1 + yN) / 3,
    c2x: (xN1 + 2 * xN) / 3,
    c2y: (yN1 + 2 * yN) / 3,
    x: (xN1 + 5 * xN) / 6,
    y: (yN1 + 5 * yN) / 6,
  });
  out.push({ kind: 'L', x: xN, y: yN });

  return out;
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
