import type { IPathStyle, PathCommand } from '../../../../specs';

type Pt = { readonly x: number; readonly y: number };

/** Below this distance (world units) two points are the same point. */
const COINCIDENT = 0.5;

/**
 * A piecewise cubic Bézier read from its **control points** — the curve a
 * layout engine computed, drawn as it computed it.
 *
 * Pair with `router: 'straight'`, which yields
 * `[sourceAnchor, ...waypoints, targetAnchor]`. The waypoints are read as a
 * Bézier chain `P0, C1, C2, P1, C1, C2, P2, …, Pn` — `3k + 1` points, every
 * third one on the curve. That is how ELK's `SPLINES` edge routing reports a
 * section: start point, bend points (always `3k − 1` of them), end point. The
 * chain is drawn as is, so the curve keeps the clearance from nodes the engine
 * routed it for — unlike `smooth`, which interpolates *through* points and can
 * overshoot.
 *
 * The anchors join the chain with a straight leg when they don't sit on its
 * ends. With the default `boundary` anchor aiming at the first / last waypoint,
 * and ELK's section ends on the node border, the legs are zero-length and are
 * left out.
 *
 * Waypoints that don't form a chain (wrong count, or none) are drawn as a
 * polyline through them — the same as `normal` — so a misconfigured edge stays
 * visible and connected.
 */
export const splinePathStyle: IPathStyle = (polyline) => {
  if (polyline.length < 2) return [];
  const source = polyline[0]!;
  const target = polyline[polyline.length - 1]!;
  const chain = polyline.slice(1, -1);

  if (chain.length < 4 || (chain.length - 1) % 3 !== 0) {
    return polyline.map((p, i): PathCommand =>
      i === 0 ? { kind: 'M', x: p.x, y: p.y } : { kind: 'L', x: p.x, y: p.y },
    );
  }

  const first = chain[0]!;
  const last = chain[chain.length - 1]!;
  const out: PathCommand[] = [{ kind: 'M', x: source.x, y: source.y }];
  if (!coincident(source, first)) out.push({ kind: 'L', x: first.x, y: first.y });
  for (let i = 1; i + 2 < chain.length; i += 3) {
    const c1 = chain[i]!;
    const c2 = chain[i + 1]!;
    const p = chain[i + 2]!;
    out.push({ kind: 'C', c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, x: p.x, y: p.y });
  }
  if (!coincident(last, target)) out.push({ kind: 'L', x: target.x, y: target.y });
  return out;
};

function coincident(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) < COINCIDENT && Math.abs(a.y - b.y) < COINCIDENT;
}
