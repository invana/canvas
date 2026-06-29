import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import type {
  ArcSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

const TAU = Math.PI * 2;
/** Target angular step between sampled outline vertices for AABB / dashed-stroke
 *  fallback paths — ~3° gives a smooth silhouette at typical zoom levels. */
const ARC_SAMPLE_STEP = Math.PI / 60;

/**
 * Annular sector centred at `(spec.x, spec.y)` between two radii
 * (`innerR`, `outerR`) and two angles (`startAngle`, `endAngle`). Angles are
 * in radians with the standard screen convention — `0` points along `+x`
 * (3 o'clock) and increasing values sweep clockwise on screen (because the
 * canvas y-axis grows downward). For a d3-style sunburst projection, subtract
 * `π/2` from d3's `x0`/`x1` to align "0 = 12 o'clock" with this convention.
 *
 * Degenerate shapes:
 * - `innerR === 0` → pie slice (no inner cut-out).
 * - `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
 * - `endAngle - startAngle >= 2π` and `innerR === 0` → full disk; prefer
 *   `CircleShape` for that case unless you need the arc spec for animation.
 *
 * The silhouette is traced with Pixi's native `arc()` for smoothness; bounds,
 * containment, and dashed-stroke fall back to a discretised polyline sampled
 * at `ARC_SAMPLE_STEP`.
 */
export class ArcShape extends ShapeBase<ArcSpec> {
  static readonly kind = 'arc';

  constructor(spec: ArcSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: ArcSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;
    // Inset shrinks the silhouette uniformly along its inward normal — for an
    // annular sector that means growing the inner radius and shrinking the
    // outer. The angle endpoints don't move; the wedge gets narrower radially.
    if (spec.endAngle <= spec.startAngle) return;
    const innerR0 = Math.max(0, spec.innerR + baseInset);
    const outerR0 = Math.max(innerR0, spec.outerR - baseInset);
    if (outerR0 <= 0) return;

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleArcOutline(innerR0, outerR0, spec.startAngle, spec.endAngle), {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true,
      });
      return;
    }

    const trace = (extra = 0): void => {
      const i = baseInset + extra;
      const inner = Math.max(0, spec.innerR + i);
      const outer = Math.max(inner, spec.outerR - i);
      if (outer <= 0) return;
      traceArc(g, inner, outer, spec.startAngle, spec.endAngle);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return ArcShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<ArcSpec, 'x' | 'y'>): Rect {
    return arcBounds(spec.innerR, spec.outerR, spec.startAngle, spec.endAngle);
  }

  static scaleSpec(spec: Omit<ArcSpec, 'x' | 'y'>, factor: number): Partial<ArcSpec> {
    return { innerR: spec.innerR * factor, outerR: spec.outerR * factor };
  }

  /**
   * Visual centre of an annular sector — half-angle direction, midradius
   * distance. Used by inset-content labels (`placement: 'center'`); good
   * enough for visual centring without the (more expensive) area-weighted
   * centroid integral.
   */
  override visualCenter(): Point {
    const a0 = this.spec.startAngle;
    const a1 = this.spec.endAngle;
    if (a1 <= a0) return { x: 0, y: 0 };
    const mid = (a0 + a1) / 2;
    const r = (this.spec.innerR + this.spec.outerR) / 2;
    return { x: Math.cos(mid) * r, y: Math.sin(mid) * r };
  }

  contains(localX: number, localY: number): boolean {
    return pointInArc(
      localX,
      localY,
      this.spec.innerR,
      this.spec.outerR,
      this.spec.startAngle,
      this.spec.endAngle,
    );
  }
}

// ─── Geometry helpers ──────────────────────────────────────────────────────

/** Trace the silhouette of an annular sector using Pixi's native arc() so the
 *  rendered curve stays smooth at any zoom (unlike a polyline approximation). */
function traceArc(
  g: Graphics,
  innerR: number,
  outerR: number,
  a0: number,
  a1: number,
): void {
  const isFullSweep = a1 - a0 >= TAU - 1e-6;

  if (isFullSweep) {
    // Full circle / annulus. Trace the outer disc, then punch the inner disc
    // back out (Pixi uses non-zero fill rule by default → opposite winding
    // creates a hole). When innerR is 0 this degenerates to a plain disc.
    g.moveTo(outerR, 0);
    g.arc(0, 0, outerR, 0, TAU);
    g.closePath();
    if (innerR > 0) {
      g.moveTo(innerR, 0);
      g.arc(0, 0, innerR, 0, TAU, true);
      g.closePath();
    }
    return;
  }

  const cos0 = Math.cos(a0);
  const sin0 = Math.sin(a0);
  const cos1 = Math.cos(a1);
  const sin1 = Math.sin(a1);

  if (innerR <= 0) {
    // Pie slice: origin → outer-start → outer arc → origin.
    g.moveTo(0, 0);
    g.lineTo(outerR * cos0, outerR * sin0);
    g.arc(0, 0, outerR, a0, a1);
    g.lineTo(0, 0);
    g.closePath();
    return;
  }

  // Proper annular sector: inner-start → outer-start → outer arc forward →
  // inner-end → inner arc backward → close.
  g.moveTo(innerR * cos0, innerR * sin0);
  g.lineTo(outerR * cos0, outerR * sin0);
  g.arc(0, 0, outerR, a0, a1);
  g.lineTo(innerR * cos1, innerR * sin1);
  g.arc(0, 0, innerR, a1, a0, true);
  g.closePath();
}

/**
 * Sample the silhouette of an annular sector as a flat closed polyline.
 * Used by the dashed-stroke emitter (which only consumes polylines) and by
 * `applyFill`'s fallback redraw path. Walks the outer arc forward, then the
 * inner arc backward (or back to the origin for pie slices).
 */
function sampleArcOutline(
  innerR: number,
  outerR: number,
  a0: number,
  a1: number,
): Point[] {
  const out: Point[] = [];
  const sweep = a1 - a0;
  if (sweep <= 0 || outerR <= 0) return out;
  const steps = Math.max(2, Math.ceil(sweep / ARC_SAMPLE_STEP));

  // Outer arc, a0 → a1.
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (sweep * i) / steps;
    out.push({ x: Math.cos(a) * outerR, y: Math.sin(a) * outerR });
  }

  if (innerR > 0) {
    // Inner arc, a1 → a0 (reverse) to close the annular sector.
    for (let i = 0; i <= steps; i++) {
      const a = a1 - (sweep * i) / steps;
      out.push({ x: Math.cos(a) * innerR, y: Math.sin(a) * innerR });
    }
  } else {
    // Pie slice: close through the origin.
    out.push({ x: 0, y: 0 });
  }
  return out;
}

/**
 * Axis-aligned bounding box for an annular sector. The extreme points are
 * either on the four sector corners (a0/inner, a0/outer, a1/inner, a1/outer)
 * or at the cardinal angles (0, π/2, π, 3π/2) on the outer radius if those
 * angles fall inside the sweep — those produce the (±outerR, 0) / (0, ±outerR)
 * extents.
 */
function arcBounds(innerR: number, outerR: number, a0: number, a1: number): Rect {
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

  let minX = corners[0]!.x;
  let maxX = minX;
  let minY = corners[0]!.y;
  let maxY = minY;
  for (let i = 1; i < corners.length; i++) {
    const p = corners[i]!;
    if (p.x < minX) minX = p.x;
    else if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    else if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Exact analytical point-in-annular-sector test. Splits the test into a
 * radial check (innerR ≤ r ≤ outerR) and an angular check (θ falls within
 * the sweep, modulo 2π). Cheap and pixel-tight — preferred over a polygon
 * approximation when the sweep is large.
 */
function pointInArc(
  localX: number,
  localY: number,
  innerR: number,
  outerR: number,
  a0: number,
  a1: number,
): boolean {
  const r2 = localX * localX + localY * localY;
  if (r2 < innerR * innerR || r2 > outerR * outerR) return false;
  if (a1 - a0 >= TAU) return true;

  // Bring θ into the same revolution as a0 so the comparison is unambiguous
  // across the 2π wrap (e.g. sweep from 3π/2 to 5π/2 hitting θ ≈ 0.1).
  const theta = Math.atan2(localY, localX);
  let n = Math.ceil((a0 - theta) / TAU);
  if (theta + n * TAU < a0) n++;
  const t = theta + n * TAU;
  return t >= a0 && t <= a1;
}
