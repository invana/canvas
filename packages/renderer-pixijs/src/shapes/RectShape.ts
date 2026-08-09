import type { Graphics } from 'pixi.js';
import { boundsOfRect, containsRect, scaleRect } from '@invana/canvas';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import type {
  Point,
  Rect,
  RectSpec,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Axis-aligned rectangle with optional `cornerRadius`. Anchored at its
 * top-left corner in shape-local space; `(spec.x, spec.y)` is the world
 * position of that corner. A "square" is just `RectShape` with
 * `width === height` and no `cornerRadius`.
 */
export class RectShape extends ShapeBase<RectSpec> {
  static readonly kind = 'rect';

  constructor(spec: RectSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: RectSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;
    const w0 = Math.max(0, spec.width - baseInset * 2);
    const h0 = Math.max(0, spec.height - baseInset * 2);
    const cr0 = Math.max(0, (spec.cornerRadius ?? 0) - baseInset);

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleRectOutline(baseInset, baseInset, w0, h0, cr0), {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true,
      });
      return;
    }

    const trace = (extra = 0) => {
      const i = baseInset + extra;
      const w = Math.max(0, spec.width - i * 2);
      const h = Math.max(0, spec.height - i * 2);
      const cr = Math.max(0, (spec.cornerRadius ?? 0) - i);
      if (cr > 0) g.roundRect(i, i, w, h, cr);
      else g.rect(i, i, w, h);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }

  bounds(): Rect {
    return RectShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<RectSpec, 'x' | 'y'>): Rect {
    return boundsOfRect(spec);
  }

  static scaleSpec(spec: Omit<RectSpec, 'x' | 'y'>, factor: number): Partial<RectSpec> {
    return scaleRect(spec, factor);
  }

  /** Rounded corners are honoured — the fillet is cut out of the box, not ignored. */
  contains(localX: number, localY: number): boolean {
    return containsRect(this.spec, localX, localY);
  }

  /**
   * Silhouette-aware ray exit. For `cornerRadius > 0` the AABB face isn't
   * the actual outline — the rendered rect rounds inward at each corner.
   * Take the AABB exit first; if it falls in one of the four corner zones
   * (within `R` of a corner in both axes), re-cast the ray against that
   * corner's quarter-circle so the returned point sits on the visible
   * silhouette. For sharp rects this is unchanged from the AABB fallback.
   */
  override boundaryIntersect(localFromCenter: Point): Point | null {
    const cr = this.spec.cornerRadius ?? 0;
    if (cr <= 0) return super.boundaryIntersect(localFromCenter);

    const halfW = this.spec.width / 2;
    const halfH = this.spec.height / 2;
    const R = Math.min(cr, halfW, halfH);

    const aabb = super.boundaryIntersect(localFromCenter);
    if (!aabb) return null;

    const onRight = aabb.x >  halfW - R;
    const onLeft  = aabb.x < -halfW + R;
    const onTop   = aabb.y < -halfH + R;
    const onBot   = aabb.y >  halfH - R;
    let cornerX: number;
    let cornerY: number;
    if (onRight && onTop)      { cornerX =  halfW - R; cornerY = -halfH + R; }
    else if (onRight && onBot) { cornerX =  halfW - R; cornerY =  halfH - R; }
    else if (onLeft  && onTop) { cornerX = -halfW + R; cornerY = -halfH + R; }
    else if (onLeft  && onBot) { cornerX = -halfW + R; cornerY =  halfH - R; }
    else return aabb;

    const len = Math.hypot(localFromCenter.x, localFromCenter.y);
    if (len === 0) return aabb;
    const ux = localFromCenter.x / len;
    const uy = localFromCenter.y / len;
    // Solve |t·(ux,uy) − C|² = R² with unit direction → quadratic in t:
    //   t² − 2·dot·t + (Cx² + Cy² − R²) = 0
    // The rect interior in a corner zone is inside the arc circle (the
    // arc centre sits inside the body), so the ray exits the rect where
    // it crosses *out* of the circle — the larger positive root.
    const dot = ux * cornerX + uy * cornerY;
    const c = cornerX * cornerX + cornerY * cornerY - R * R;
    const disc = dot * dot - c;
    if (disc < 0) return aabb;
    const t = dot + Math.sqrt(disc);
    return { x: ux * t, y: uy * t };
  }

  static paintInto(
    g: Graphics,
    spec: Omit<RectSpec, 'x' | 'y'>,
    anchor: Point,
    _angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const cr = spec.cornerRadius ?? 0;
    const x = anchor.x - spec.width / 2;
    const y = anchor.y - spec.height / 2;
    if (cr > 0) g.roundRect(x, y, spec.width, spec.height, cr);
    else g.rect(x, y, spec.width, spec.height);
    applyMarkerFill(g, spec.fill, style);
  }
}

/**
 * Densify the rect outline into a polyline. For `cornerRadius > 0` each
 * corner arc is sampled with vertex count proportional to the radius
 * (~1 vertex per 2 px of arc, min 4). Output traverses clockwise from the
 * top-left corner (or, with rounded corners, from the start of the top
 * edge — the post-corner point on the top).
 */
function sampleRectOutline(
  x: number,
  y: number,
  w: number,
  h: number,
  cr: number,
): Point[] {
  if (w <= 0 || h <= 0) return [];
  const r = Math.min(cr, w / 2, h / 2);
  if (r <= 0) {
    return [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
  }

  const arcSteps = Math.max(4, Math.ceil((Math.PI * 0.5 * r) / 2));
  const out: Point[] = [];
  // Quadrant centres (clockwise from top-left).
  const corners: ReadonlyArray<{ cx: number; cy: number; a0: number }> = [
    { cx: x + r,       cy: y + r,       a0: Math.PI },          // TL: π → 1.5π
    { cx: x + w - r,   cy: y + r,       a0: Math.PI * 1.5 },    // TR: 1.5π → 2π
    { cx: x + w - r,   cy: y + h - r,   a0: 0 },                // BR: 0 → 0.5π
    { cx: x + r,       cy: y + h - r,   a0: Math.PI * 0.5 },    // BL: 0.5π → π
  ];
  for (const c of corners) {
    for (let i = 0; i <= arcSteps; i++) {
      const t = i / arcSteps;
      const a = c.a0 + t * (Math.PI * 0.5);
      out.push({ x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r });
    }
  }
  return out;
}
