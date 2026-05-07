/**
 * `CircleShape` — built-in primitive registered as kind `'circle'`.
 *
 * Convention: the spec's `(x, y)` is the **center** of the circle. The shape's
 * local-space bounding box is centred at the origin (`{ x: -r, y: -r,
 * width: 2r, height: 2r }`), and the renderer's hit index translates by
 * `(spec.x, spec.y)` to land the bbox in world coordinates.
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseShapeSpec, IShape, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

export interface CircleShapeSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly r: number;
  /** Solid fill color. Omit for an outline-only circle. */
  readonly fill?: number;
  readonly fillAlpha?: number;
  /** Stroke color. Omit (or set `strokeWidth: 0`) for a fill-only circle. */
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class CircleShape implements IShape<CircleShapeSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private currentR = 0;

  constructor(spec: CircleShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = `shape:circle:${spec.kind}`;
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: CircleShapeSpec): void {
    this.currentR = spec.r;
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    g.circle(0, 0, spec.r);
    if (spec.fill !== undefined) {
      g.fill({ color: spec.fill, alpha: spec.fillAlpha ?? 1 });
    }
    if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
      g.stroke({
        color: spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: spec.strokeAlpha ?? 1,
      });
    }
  }

  bounds(): Rect {
    const r = this.currentR;
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }

  contains(localX: number, localY: number): boolean {
    const r = this.currentR;
    return localX * localX + localY * localY <= r * r;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Paint a `CircleShapeSpec` into a caller-supplied `Graphics`, anchored
   * at `anchor`. Rotation is irrelevant for a circle (rotation-symmetric)
   * so `_angleRad` is ignored. `style.color` / `style.alpha`, when supplied,
   * override `spec.fill` / `spec.fillAlpha` (used by decorations to tint
   * markers).
   */
  static paintInto(
    g: Graphics,
    spec: Omit<CircleShapeSpec, 'x' | 'y'>,
    anchor: Point,
    _angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    g.circle(anchor.x, anchor.y, spec.r);
    const fillColor = style?.color ?? spec.fill;
    if (fillColor !== undefined) {
      g.fill({ color: fillColor, alpha: style?.alpha ?? spec.fillAlpha ?? 1 });
    }
    if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
      g.stroke({
        color: style?.color ?? spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: style?.alpha ?? spec.strokeAlpha ?? 1,
      });
    }
  }
}
