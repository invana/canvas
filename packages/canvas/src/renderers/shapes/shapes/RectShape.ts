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
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';

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
}
