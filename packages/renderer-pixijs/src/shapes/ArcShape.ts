import type { Graphics } from 'pixi.js';
import { boundsOfArc, containsArc, scaleArc } from '@invana/canvas';
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
    return boundsOfArc(spec);
  }

  static scaleSpec(spec: Omit<ArcSpec, 'x' | 'y'>, factor: number): Partial<ArcSpec> {
    return scaleArc(spec, factor);
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
    return containsArc(this.spec, localX, localY);
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

