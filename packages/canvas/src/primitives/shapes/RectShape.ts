import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyStroke } from '../paint/applyFillStroke';
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

    if (cr > 0) g.roundRect(inset, inset, w, h, cr);
    else g.rect(inset, inset, w, h);

    applyFill(g, spec, style, this.host);
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
    if (style?.fill !== false && style?.color !== undefined) {
      g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    } else if (typeof spec.fill === 'number') {
      g.fill({ color: spec.fill });
    } else if (typeof spec.fill === 'object' && spec.fill?.kind === 'solid') {
      g.fill({ color: spec.fill.color, alpha: spec.fill.alpha ?? 1 });
    }
  }
}
