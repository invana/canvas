/**
 * `EllipseShape` — built-in primitive registered as kind `'ellipse'`.
 *
 * Convention: spec `(x, y)` is the center; `(rx, ry)` are the half-axes.
 * Local-space bounds are `{ x: -rx, y: -ry, width: 2rx, height: 2ry }`.
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseShapeSpec, IShape, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

export interface EllipseShapeSpec extends BaseShapeSpec {
  readonly kind: 'ellipse';
  readonly rx: number;
  readonly ry: number;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class EllipseShape implements IShape<EllipseShapeSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private currentRx = 0;
  private currentRy = 0;

  constructor(_spec: EllipseShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'shape:ellipse';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: EllipseShapeSpec): void {
    this.currentRx = spec.rx;
    this.currentRy = spec.ry;
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    g.ellipse(0, 0, spec.rx, spec.ry);
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
      x: -this.currentRx,
      y: -this.currentRy,
      width: this.currentRx * 2,
      height: this.currentRy * 2,
    };
  }

  contains(localX: number, localY: number): boolean {
    const rx = this.currentRx;
    const ry = this.currentRy;
    if (rx === 0 || ry === 0) return false;
    const nx = localX / rx;
    const ny = localY / ry;
    return nx * nx + ny * ny <= 1;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Paint an `EllipseShapeSpec` into a caller-supplied `Graphics`, anchored
   * at `anchor` and rotated by `angleRad`. Pixi v8's `g.ellipse` is
   * axis-aligned, so rotation is applied by sampling the ellipse outline as
   * a 32-segment polygon. `style` overrides spec colour/alpha.
   */
  static paintInto(
    g: Graphics,
    spec: Omit<EllipseShapeSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const segments = 32;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const points: Point[] = new Array(segments);
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const lx = Math.cos(t) * spec.rx;
      const ly = Math.sin(t) * spec.ry;
      points[i] = {
        x: anchor.x + lx * cos - ly * sin,
        y: anchor.y + lx * sin + ly * cos,
      };
    }
    g.poly(points);
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
