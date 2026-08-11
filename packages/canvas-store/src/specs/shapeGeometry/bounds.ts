/**
 * Per-kind spec measurement: **bounds**, **uniform scale**, **collapse** and
 * **fit-to-content**, as pure functions of the spec.
 *
 * These four used to live as `static` methods on the renderer-side shape
 * classes. They are not drawing — they are properties of the description, and
 * a layout, an exporter or a headless test needs them with no GPU in the
 * process. The shape classes now delegate here, so there is one implementation
 * per kind (`docs/renderer-split-design.md` §9, P4).
 *
 * Every function takes the spec **without** `x` / `y`: bounds are local, so the
 * world position is the caller's business.
 */

import type { Point, Rect } from '../geometry';
import type {
  ArcSpec,
  CircleSpec,
  CompositeRootSpec,
  CompositeSpec,
  EllipseSpec,
  PathSpec,
  PolygonSpec,
  RectSpec,
  RegularPolygonSpec,
  StarSpec,
} from '../shape';
import {
  polygonBounds,
  regularPolygonVertices,
  starVertices,
} from './polygonMath';

/** A spec of kind `K` with its world position removed — geometry only. */
export type LocalSpec<T> = Omit<T, 'x' | 'y'>;

const TAU = Math.PI * 2;

// ─── circle ────────────────────────────────────────────────────────────────

export function boundsOfCircle(spec: LocalSpec<CircleSpec>): Rect {
  const r = spec.radius;
  return { x: -r, y: -r, width: r * 2, height: r * 2 };
}

export function scaleCircle(
  spec: LocalSpec<CircleSpec>,
  factor: number,
): Partial<CircleSpec> {
  return { radius: spec.radius * factor };
}

// ─── ellipse ───────────────────────────────────────────────────────────────

export function boundsOfEllipse(spec: LocalSpec<EllipseSpec>): Rect {
  return {
    x: -spec.radiusX,
    y: -spec.radiusY,
    width: spec.radiusX * 2,
    height: spec.radiusY * 2,
  };
}

export function scaleEllipse(
  spec: LocalSpec<EllipseSpec>,
  factor: number,
): Partial<EllipseSpec> {
  return { radiusX: spec.radiusX * factor, radiusY: spec.radiusY * factor };
}

// ─── rect ──────────────────────────────────────────────────────────────────

/** Anchored top-left, so the local box starts at the origin. */
export function boundsOfRect(spec: LocalSpec<RectSpec>): Rect {
  return { x: 0, y: 0, width: spec.width, height: spec.height };
}

export function scaleRect(
  spec: LocalSpec<RectSpec>,
  factor: number,
): Partial<RectSpec> {
  return {
    width: spec.width * factor,
    height: spec.height * factor,
    ...(spec.cornerRadius !== undefined ? { cornerRadius: spec.cornerRadius * factor } : {}),
  };
}

// ─── polygon ───────────────────────────────────────────────────────────────

export function boundsOfPolygon(spec: LocalSpec<PolygonSpec>): Rect {
  return polygonBounds(spec.vertices);
}

export function scalePolygon(
  spec: LocalSpec<PolygonSpec>,
  factor: number,
): Partial<PolygonSpec> {
  return { vertices: spec.vertices.map((v) => ({ x: v.x * factor, y: v.y * factor })) };
}

// ─── regular-polygon ───────────────────────────────────────────────────────

/** The n-gon's vertices at its authored size, centred on the origin. */
export function verticesOfRegularPolygon(
  spec: LocalSpec<RegularPolygonSpec>,
): Point[] {
  return regularPolygonVertices(spec.sides, spec.radius, spec.rotation ?? 0);
}

export function boundsOfRegularPolygon(
  spec: LocalSpec<RegularPolygonSpec>,
): Rect {
  return polygonBounds(verticesOfRegularPolygon(spec));
}

export function scaleRegularPolygon(
  spec: LocalSpec<RegularPolygonSpec>,
  factor: number,
): Partial<RegularPolygonSpec> {
  return { radius: spec.radius * factor };
}

// ─── star ──────────────────────────────────────────────────────────────────

/** The star's alternating outer / inner vertices, centred on the origin. */
export function verticesOfStar(spec: LocalSpec<StarSpec>): Point[] {
  return starVertices(spec.points, spec.innerRadius, spec.outerRadius, spec.rotation ?? 0);
}

export function boundsOfStar(spec: LocalSpec<StarSpec>): Rect {
  return polygonBounds(verticesOfStar(spec));
}

export function scaleStar(
  spec: LocalSpec<StarSpec>,
  factor: number,
): Partial<StarSpec> {
  return {
    innerRadius: spec.innerRadius * factor,
    outerRadius: spec.outerRadius * factor,
  };
}

// ─── arc ───────────────────────────────────────────────────────────────────

/**
 * Axis-aligned bounding box for an annular sector. The extreme points are
 * either on the four sector corners (a0/inner, a0/outer, a1/inner, a1/outer)
 * or at the cardinal angles (0, π/2, π, 3π/2) on the outer radius if those
 * angles fall inside the sweep — those produce the (±outerR, 0) / (0, ±outerR)
 * extents.
 */
export function boundsOfArc(spec: LocalSpec<ArcSpec>): Rect {
  const { innerR, outerR, startAngle: a0, endAngle: a1 } = spec;
  if (a1 <= a0 || outerR <= 0) return { x: 0, y: 0, width: 0, height: 0 };

  // Corners always contribute.
  const corners: Point[] = [
    { x: Math.cos(a0) * innerR, y: Math.sin(a0) * innerR },
    { x: Math.cos(a0) * outerR, y: Math.sin(a0) * outerR },
    { x: Math.cos(a1) * innerR, y: Math.sin(a1) * innerR },
    { x: Math.cos(a1) * outerR, y: Math.sin(a1) * outerR },
  ];

  // Add the cardinal-angle extents on the outer radius if the sweep crosses
  // them. Normalise everything into a single circle's worth of revolutions so
  // sweeps that wrap past 2π still pick up all four cardinals.
  const sweep = a1 - a0;
  for (const k of [0, 1, 2, 3]) {
    const cardinal = (k * Math.PI) / 2;
    // First multiple of 2π that lands `cardinal` at or after a0.
    let n = Math.ceil((a0 - cardinal) / TAU);
    if (cardinal + n * TAU < a0) n++;
    const angle = cardinal + n * TAU;
    if (angle <= a1 || sweep >= TAU) {
      corners.push({ x: Math.cos(angle) * outerR, y: Math.sin(angle) * outerR });
    }
  }

  return polygonBounds(corners);
}

export function scaleArc(
  spec: LocalSpec<ArcSpec>,
  factor: number,
): Partial<ArcSpec> {
  return { innerR: spec.innerR * factor, outerR: spec.outerR * factor };
}

// ─── path ──────────────────────────────────────────────────────────────────

export function boundsOfPath(spec: LocalSpec<PathSpec>): Rect {
  return polygonBounds(spec.points);
}

export function scalePath(
  spec: LocalSpec<PathSpec>,
  factor: number,
): Partial<PathSpec> {
  return { points: spec.points.map((p) => ({ x: p.x * factor, y: p.y * factor })) };
}

// ─── composite ─────────────────────────────────────────────────────────────

/**
 * The composite's silhouette fills its declared box (like a rect), whatever
 * root shape it borrows — the root is centred and sized to that box. Layouts
 * (ELK et al.) read node dimensions through this; without it every card falls
 * back to the layout's default size and they overlap.
 */
export function boundsOfComposite(
  spec: Pick<CompositeSpec, 'width' | 'height'>,
): Rect {
  return { x: 0, y: 0, width: spec.width, height: spec.height };
}

/**
 * The composite's effective root spec: the explicit
 * {@link CompositeSpec.root}, or the default rounded rect built from
 * `cornerRadius` + the inherited `fill` / `stroke`.
 */
export function resolveCompositeRoot(spec: CompositeSpec): CompositeRootSpec {
  if (spec.root) return spec.root;
  return {
    kind: 'rect',
    x: 0,
    y: 0,
    width: spec.width,
    height: spec.height,
    ...(spec.cornerRadius !== undefined ? { cornerRadius: spec.cornerRadius } : {}),
    ...(spec.fill !== undefined ? { fill: spec.fill } : {}),
    ...(spec.stroke !== undefined ? { stroke: spec.stroke } : {}),
  };
}

/** Local bounds of whichever shape a composite borrows for its silhouette. */
export function boundsOfCompositeRoot(root: CompositeRootSpec): Rect {
  switch (root.kind) {
    case 'circle':
      return boundsOfCircle(root);
    case 'ellipse':
      return boundsOfEllipse(root);
    case 'polygon':
      return boundsOfPolygon(root);
    case 'regular-polygon':
      return boundsOfRegularPolygon(root);
    case 'star':
      return boundsOfStar(root);
    case 'arc':
      return boundsOfArc(root);
    default:
      return boundsOfRect(root);
  }
}

/**
 * Translation from the composite's top-left origin to the borrowed root's own
 * local origin — the offset that centres the root in the `width × height` box.
 *
 * Origin-agnostic by construction: it works off the root's *bounding-box*
 * centre, so a rect (top-left origin) and a circle (centred origin) both land
 * in the middle of the card. The renderer applies exactly this before tracing
 * the root, which is why hit-testing has to apply it too.
 */
export function compositeRootOffset(spec: CompositeSpec): Point {
  const b = boundsOfCompositeRoot(resolveCompositeRoot(spec));
  return {
    x: spec.width / 2 - (b.x + b.width / 2),
    y: spec.height / 2 - (b.y + b.height / 2),
  };
}
