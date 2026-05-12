import type { Graphics } from 'pixi.js';
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
    const inset = style?.inset ?? 0;
    const w = Math.max(0, spec.width - inset * 2);
    const h = Math.max(0, spec.height - inset * 2);
    const cr = Math.max(0, (spec.cornerRadius ?? 0) - inset);

    if (style?.dashArray) {
      emitDashedStroke(g, sampleRectOutline(inset, inset, w, h, cr), {
        color: style.color ?? 0x000000,
        alpha: style.alpha ?? 1,
        width: style.strokeWidth ?? 1,
        dashArray: style.dashArray,
        dashOffset: style.dashOffset,
        closed: true,
      });
      return;
    }

    const trace = () => {
      if (cr > 0) g.roundRect(inset, inset, w, h, cr);
      else g.rect(inset, inset, w, h);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    trace();
    applyStroke(g, spec, style);
  }

  bounds(): Rect {
    return { x: 0, y: 0, width: this.spec.width, height: this.spec.height };
  }

  contains(localX: number, localY: number): boolean {
    return (
      localX >= 0 && localY >= 0 &&
      localX <= this.spec.width && localY <= this.spec.height
    );
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
