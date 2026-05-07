/**
 * `RectShape` — built-in primitive registered as kind `'rect'`.
 *
 * Convention: the spec's `(x, y)` is the **center** of the rectangle (matches
 * `CircleShape` so connectors / decorations / hit-testing all use one
 * "(x, y) means center" rule across primitives). Local-space bounds are
 * `{ x: -w/2, y: -h/2, width, height }`.
 *
 * Supports rounded corners via `cornerRadius` (default `0`).
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseShapeSpec, IShape, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

export interface RectShapeSpec extends BaseShapeSpec {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  /** Optional rounded corners. Default `0` (sharp corners). */
  readonly cornerRadius?: number;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class RectShape implements IShape<RectShapeSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private currentW = 0;
  private currentH = 0;

  constructor(_spec: RectShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = `shape:rect`;
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: RectShapeSpec): void {
    this.currentW = spec.width;
    this.currentH = spec.height;
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    const halfW = spec.width / 2;
    const halfH = spec.height / 2;
    const radius = spec.cornerRadius ?? 0;

    g.clear();
    if (radius > 0) {
      g.roundRect(-halfW, -halfH, spec.width, spec.height, radius);
    } else {
      g.rect(-halfW, -halfH, spec.width, spec.height);
    }
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
    return {
      x: -this.currentW / 2,
      y: -this.currentH / 2,
      width: this.currentW,
      height: this.currentH,
    };
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Paint a `RectShapeSpec` into a caller-supplied `Graphics` as a rotated
   * polygon (Pixi v8's `g.rect` is axis-aligned only). Rounded corners are
   * not preserved through rotation — rotated-marker callers requesting
   * `cornerRadius > 0` get sharp corners. `style` overrides spec colour/alpha.
   */
  static paintInto(
    g: Graphics,
    spec: Omit<RectShapeSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const halfW = spec.width / 2;
    const halfH = spec.height / 2;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const corners: Point[] = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ].map((p) => ({
      x: anchor.x + p.x * cos - p.y * sin,
      y: anchor.y + p.x * sin + p.y * cos,
    }));
    g.poly(corners);
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
