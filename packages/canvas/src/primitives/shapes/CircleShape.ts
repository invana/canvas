import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyStroke } from '../paint/applyFillStroke';
import type {
  CircleSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Filled / stroked / icon-bearing circle. Centered at `(spec.x, spec.y)`;
 * the silhouette is traced in shape-local space (origin at the center).
 */
export class CircleShape extends ShapeBase<CircleSpec> {
  static readonly kind = 'circle';

  constructor(spec: CircleSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: CircleSpec, style?: ShapePaintStyle): void {
    const r = Math.max(0, spec.radius - (style?.inset ?? 0));
    g.circle(0, 0, r);
    applyFill(g, spec, style, this.host);
    applyStroke(g, spec, style);
  }

  bounds(): Rect {
    const r = this.spec.radius;
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }

  contains(localX: number, localY: number): boolean {
    const r = this.spec.radius;
    return localX * localX + localY * localY <= r * r;
  }

  /**
   * Static paint surface for marker rendering. Connectors call this when
   * a circle is used as a source/target marker (no instantiation, just a
   * paint into someone else's Graphics).
   */
  static paintInto(
    g: Graphics,
    spec: Omit<CircleSpec, 'x' | 'y'>,
    anchor: Point,
    _angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const r = Math.max(0, spec.radius - (style?.inset ?? 0));
    g.circle(anchor.x, anchor.y, r);
    if (style?.fill !== false && style?.color !== undefined) {
      g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    } else if (typeof spec.fill === 'number') {
      g.fill({ color: spec.fill });
    } else if (typeof spec.fill === 'object' && spec.fill?.kind === 'solid') {
      g.fill({ color: spec.fill.color, alpha: spec.fill.alpha ?? 1 });
    }
  }
}
