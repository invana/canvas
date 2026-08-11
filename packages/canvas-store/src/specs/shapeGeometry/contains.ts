/**
 * Pure geometric containment, per spec kind — the engine's hit-test narrow
 * phase with no GPU in it.
 *
 * ## Why this exists
 *
 * Picking used to ask the backend: `bodyGfx.containsPoint(...)`, i.e. pixi
 * walked the instructions it had recorded while painting. That made the answer
 * depend on a display object existing, so picking could not be tested headlessly
 * and would have left the engine with the renderer under the P6 extraction
 * (`docs/renderer-split-design.md` §5 — "geometry answers must not require the
 * backend"). Here the answer comes from the spec alone, so every backend agrees
 * by construction.
 *
 * ## Matching pixi
 *
 * `Graphics.containsPoint` is a **union over painted instructions**: a `fill`
 * instruction answers `shape.contains`, a `stroke` instruction answers
 * `shape.strokeContains`. Two consequences are reproduced here deliberately:
 *
 * 1. **A shape with no silhouette fill is hollow.** No fill was painted, so only
 *    the stroke band answers `true` — clicking the middle of an outline-only
 *    contour misses it, exactly as it does today.
 * 2. **The stroke widens the region by its alignment split**: `'center'`
 *    (default) puts half the width outside and half inside, `'outside'` puts all
 *    of it outside, `'inside'` all of it inside. That mirrors pixi's
 *    `outerWidth = (1 - alignment) * width`.
 *
 * Coordinates are **shape-local** — `(0, 0)` is the shape's own origin (centre
 * for circle / ellipse / polygon / star / arc, top-left for rect / tabbed-rect /
 * composite), i.e. the caller has already subtracted `spec.x` / `spec.y` and
 * divided out any renderer-applied scale.
 */

import type {
  ArcSpec,
  BaseShapeSpec,
  CircleSpec,
  CompositeRootSpec,
  CompositeSpec,
  EllipseSpec,
  PathSpec,
  PolygonSpec,
  RectSpec,
  RegularPolygonSpec,
  StarSpec,
  TabbedRectSpec,
} from '../shape';
import { hasSilhouetteFill, type ShapeStroke } from '../style';
import {
  compositeRootOffset,
  resolveCompositeRoot,
  verticesOfRegularPolygon,
  verticesOfStar,
  type LocalSpec,
} from './bounds';
import {
  distanceToSegmentSq,
  polygonContainsInflated,
} from './polygonMath';
import { tabbedRectOutline } from './tabbedRect';

const TAU = Math.PI * 2;

/**
 * How far a stroke pushes the hit region past the silhouette (`outer`) and how
 * far it reaches back inside it (`inner`).
 *
 * Mirrors pixi's split: `outer = (1 - alignment) * width`, `inner = width -
 * outer`, with the engine's `'inside' | 'center' | 'outside'` mapping to
 * pixi's `1 | 0.5 | 0` alignment. A missing or non-positive width paints
 * nothing, so it widens nothing.
 */
export function strokeBandOf(stroke: ShapeStroke | undefined): {
  outer: number;
  inner: number;
} {
  const width = stroke?.width ?? (stroke ? 1 : 0);
  if (!stroke || width <= 0) return { outer: 0, inner: 0 };
  const alignment = stroke.alignment === 'inside' ? 1 : stroke.alignment === 'outside' ? 0 : 0.5;
  const outer = (1 - alignment) * width;
  return { outer, inner: width - outer };
}

// ─── Per-kind containment ──────────────────────────────────────────────────
//
// Each takes a `pad`: positive grows the silhouette, negative erodes it. That
// one parameter expresses both halves of the stroke band, so the fill-less
// "hollow" case is `grown && !eroded` rather than a second family of functions.

export function containsCircle(
  spec: LocalSpec<CircleSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  const r = spec.radius + pad;
  if (r <= 0) return false;
  return localX * localX + localY * localY <= r * r;
}

export function containsEllipse(
  spec: LocalSpec<EllipseSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  // Padding an ellipse by its radii is not a true parallel offset (the exact
  // offset curve isn't an ellipse), but it is precisely what pixi's
  // `Ellipse.strokeContains` does, so picking stays consistent with what the
  // user sees highlighted.
  const rx = spec.radiusX + pad;
  const ry = spec.radiusY + pad;
  if (rx <= 0 || ry <= 0) return false;
  const nx = localX / rx;
  const ny = localY / ry;
  return nx * nx + ny * ny <= 1;
}

export function containsRect(
  spec: LocalSpec<RectSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  const w = spec.width + pad * 2;
  const h = spec.height + pad * 2;
  if (w <= 0 || h <= 0) return false;
  const left = -pad;
  const top = -pad;
  if (localX < left || localX > left + w || localY < top || localY > top + h) return false;

  const r = Math.min(Math.max(0, (spec.cornerRadius ?? 0) + pad), w / 2, h / 2);
  if (r <= 0) return true;
  // Outside the four corner discs = outside the rounded rect. Clamping the
  // point into the inner "core" rectangle finds the nearest corner centre in
  // one step (pixi's `RoundedRectangle.contains` does the same).
  const cx = clamp(localX, left + r, left + w - r);
  const cy = clamp(localY, top + r, top + h - r);
  const dx = localX - cx;
  const dy = localY - cy;
  return dx * dx + dy * dy <= r * r;
}

export function containsPolygon(
  spec: LocalSpec<PolygonSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  return polygonContainsInflated(localX, localY, spec.vertices, pad);
}

export function containsRegularPolygon(
  spec: LocalSpec<RegularPolygonSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  return polygonContainsInflated(localX, localY, verticesOfRegularPolygon(spec), pad);
}

export function containsStar(
  spec: LocalSpec<StarSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  return polygonContainsInflated(localX, localY, verticesOfStar(spec), pad);
}

export function containsTabbedRect(
  spec: LocalSpec<TabbedRectSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  // The outline is already densified through its fillets, so the generic
  // polygon test covers the rounded corners and the re-entrant shoulders alike.
  // The fold line is interior geometry and never part of the silhouette.
  return polygonContainsInflated(localX, localY, tabbedRectOutline(spec, 0), pad);
}

/**
 * An open path is tested against its **run**, not a phantom closed area: only a
 * `closed` (or `smooth`, which implies closed) path has an interior, matching
 * the paint path, which fills only when closed. So an unfilled contour line
 * answers `true` along its stroke and nowhere else.
 *
 * `smooth` paths are approximated by the control polygon rather than the
 * quadratic spline it generates. The spline passes through the segment
 * midpoints and bulges toward each control point, so the two differ by at most
 * half a segment's sagitta — a fraction of a pixel at contour densities.
 */
export function containsPath(
  spec: LocalSpec<PathSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  const closed = spec.closed === true || spec.smooth === true;
  return polygonContainsInflated(localX, localY, spec.points, pad, closed);
}

/**
 * Annular sector, tested analytically rather than against a sampled outline:
 * radius inside `[innerR, outerR]` and angle inside the sweep, each relaxed by
 * `pad`. Outside the sweep the nearest point of the sector lies on one of the
 * two straight radial edges, so the padded test falls back to a distance check
 * against those two segments.
 */
export function containsArc(
  spec: LocalSpec<ArcSpec>,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  const { startAngle: a0, endAngle: a1 } = spec;
  const innerR = Math.max(0, spec.innerR - pad);
  const outerR = spec.outerR + pad;
  if (a1 <= a0 || outerR <= 0) return false;

  const rSq = localX * localX + localY * localY;
  const inRadial = rSq >= innerR * innerR && rSq <= outerR * outerR;
  const inSweep = a1 - a0 >= TAU || angleWithin(Math.atan2(localY, localX), a0, a1);
  if (inSweep && inRadial) {
    if (pad >= 0) return true;
    // Eroding: also stay clear of the two radial edges, or the band along them
    // would be reported as interior.
    return distanceToRadialEdgesSq(spec, localX, localY) > pad * pad;
  }
  if (pad <= 0 || a1 - a0 >= TAU) return false;
  // Outside the sweep but possibly within `pad` of a radial edge.
  return distanceToRadialEdgesSq(spec, localX, localY) <= pad * pad;
}

/**
 * A composite is its **root silhouette** (centred in the card box) plus every
 * geometric part painted on top of it. Parts are included because they are
 * painted into the same `Graphics` the backend hit-tests today: a part that
 * pokes outside the root — an accent bar on an unclipped card — is clickable,
 * and stays clickable here.
 *
 * `label` parts are excluded: they are mounted as text children, not painted
 * into the body, so they never contributed a hit region.
 */
export function containsComposite(
  spec: CompositeSpec,
  localX: number,
  localY: number,
  pad = 0,
): boolean {
  const off = compositeRootOffset(spec);
  const root = resolveCompositeRoot(spec);
  if (containsRootSpec(root, localX - off.x, localY - off.y, pad)) return true;

  for (const p of spec.parts) {
    if (p.part === 'rect') {
      if (p.fill === undefined && !p.stroke) continue;
      const box: LocalSpec<RectSpec> = {
        kind: 'rect',
        width: p.width,
        height: p.height,
        ...(p.cornerRadius !== undefined ? { cornerRadius: p.cornerRadius } : {}),
      };
      const half = partHalfStroke(p.stroke);
      if (
        withHollowRule(
          (q) => containsRect(box, localX - p.x, localY - p.y, q),
          p.fill !== undefined,
          pad + half,
          half,
        )
      ) {
        return true;
      }
    } else if (p.part === 'circle') {
      if (p.fill === undefined && !p.stroke) continue;
      const disc: LocalSpec<CircleSpec> = { kind: 'circle', radius: p.radius };
      const half = partHalfStroke(p.stroke);
      if (
        withHollowRule(
          (q) => containsCircle(disc, localX - p.x, localY - p.y, q),
          p.fill !== undefined,
          pad + half,
          half,
        )
      ) {
        return true;
      }
    } else if (p.part === 'line') {
      // Stroke-only geometry: a band of half the stroke width around the run.
      const tol = pad + partHalfStroke(p.stroke);
      if (tol > 0 && distanceToSegmentSq(localX, localY, p.x, p.y, p.x2, p.y2) <= tol * tol) {
        return true;
      }
    } else if (p.part === 'icon' && p.background) {
      // The chip behind the glyph is a filled rect; the glyph itself is a child.
      const chip: LocalSpec<RectSpec> = {
        kind: 'rect',
        width: p.size,
        height: p.size,
        ...(p.background.cornerRadius !== undefined
          ? { cornerRadius: p.background.cornerRadius }
          : {}),
      };
      if (containsRect(chip, localX - p.x, localY - p.y, pad)) return true;
    }
  }
  return false;
}

// ─── Dispatcher ────────────────────────────────────────────────────────────

/**
 * Does `(localX, localY)` fall inside the region this spec paints?
 *
 * `strokeTolerance` overrides the widening the spec's own stroke would imply
 * (both inward and outward). Omit it and the band is derived from
 * `spec.stroke` — width and alignment — which is what the renderer wants: the
 * hit region then tracks whatever the shape actually draws.
 *
 * Returns `undefined` for a kind this module doesn't know. That is not a
 * failure: `registerShape` admits third-party kinds, and the caller falls back
 * to asking the instance (`IShape.getHitArea`). Distinguishing "not contained"
 * from "cannot answer" is the whole point of the `boolean | undefined` return.
 */
export function containsSpec(
  spec: BaseShapeSpec,
  localX: number,
  localY: number,
  strokeTolerance?: number,
): boolean | undefined {
  const fn = CONTAINS[spec.kind];
  if (!fn) return undefined;

  // A composite resolves fill and stroke per borrowed root and per part — its
  // own `stroke` is already folded into the default root — so it owns the
  // hollow rule internally and takes only the caller's extra padding.
  if (spec.kind === 'composite') return fn(spec as never, localX, localY, strokeTolerance ?? 0);

  const band =
    strokeTolerance !== undefined
      ? { outer: strokeTolerance, inner: strokeTolerance }
      : strokeBandOf(spec.stroke);

  return withHollowRule(
    (pad) => fn(spec as never, localX, localY, pad),
    hasSilhouetteFill(spec.fill),
    band.outer,
    band.inner,
  );
}

/**
 * Kinds this module can answer for. Keyed by the same string the shape registry
 * uses, so a kind is answerable here exactly when the engine ships geometry for
 * it — third-party kinds are absent by design (see {@link containsSpec}).
 */
const CONTAINS: Record<
  string,
  (spec: never, x: number, y: number, pad: number) => boolean
> = {
  circle: containsCircle as never,
  ellipse: containsEllipse as never,
  rect: containsRect as never,
  'tabbed-rect': containsTabbedRect as never,
  polygon: containsPolygon as never,
  'regular-polygon': containsRegularPolygon as never,
  star: containsStar as never,
  arc: containsArc as never,
  path: containsPath as never,
  composite: containsComposite as never,
};

// ─── Internals ─────────────────────────────────────────────────────────────

/** Containment against whichever shape a composite borrows for its silhouette. */
function containsRootSpec(
  root: CompositeRootSpec,
  x: number,
  y: number,
  pad: number,
): boolean {
  const band = strokeBandOf(root.stroke);
  const test = (p: number): boolean => {
    switch (root.kind) {
      case 'circle':
        return containsCircle(root, x, y, p);
      case 'ellipse':
        return containsEllipse(root, x, y, p);
      case 'polygon':
        return containsPolygon(root, x, y, p);
      case 'regular-polygon':
        return containsRegularPolygon(root, x, y, p);
      case 'star':
        return containsStar(root, x, y, p);
      case 'arc':
        return containsArc(root, x, y, p);
      default:
        return containsRect(root, x, y, p);
    }
  };
  return withHollowRule(test, hasSilhouetteFill(root.fill), pad + band.outer, band.inner);
}

/**
 * Apply the fill-less **hollow** rule to a padded containment test: filled
 * geometry answers for its whole grown silhouette; unfilled geometry answers
 * only inside the stroke band, i.e. grown-by-`outer` minus eroded-by-`inner`.
 */
function withHollowRule(
  test: (pad: number) => boolean,
  filled: boolean,
  outer: number,
  inner: number,
): boolean {
  if (filled) return test(outer);
  if (outer <= 0 && inner <= 0) return false;
  return test(outer) && !test(-inner);
}

/**
 * Half-width of a composite part's stroke — the distance it reaches past the
 * traced path. Parts are stroked with the backend's default centred alignment,
 * so half the width falls outside; an absent stroke reaches nowhere.
 */
function partHalfStroke(stroke: { readonly width?: number } | undefined): number {
  if (!stroke) return 0;
  return Math.max(0, stroke.width ?? 1) / 2;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Is `theta` inside `[a0, a1]`, allowing for sweeps that wrap past 2π? */
function angleWithin(theta: number, a0: number, a1: number): boolean {
  // Bring θ into the same revolution as a0 so the comparison is unambiguous
  // across the 2π wrap (e.g. a sweep from 3π/2 to 5π/2 hitting θ ≈ 0.1).
  let n = Math.ceil((a0 - theta) / TAU);
  if (theta + n * TAU < a0) n++;
  const t = theta + n * TAU;
  return t >= a0 && t <= a1;
}

/** Squared distance to the sector's two straight radial edges. */
function distanceToRadialEdgesSq(
  spec: LocalSpec<ArcSpec>,
  x: number,
  y: number,
): number {
  const edge = (a: number): number => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return distanceToSegmentSq(
      x,
      y,
      c * spec.innerR,
      s * spec.innerR,
      c * spec.outerR,
      s * spec.outerR,
    );
  };
  return Math.min(edge(spec.startAngle), edge(spec.endAngle));
}
