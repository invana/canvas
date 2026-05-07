/**
 * `ImageCircleShape` — image projected onto a circle via texture fill.
 * Registered as kind `'image-circle'`.
 *
 * A single `Graphics` object draws the circle with `g.fill({ texture, matrix })`,
 * so the circle geometry IS the clip mask — no separate Sprite or mask display object.
 * An optional stroke is drawn on the same Graphics pass.
 *
 * Spec `(x, y)` is the center of the circle. The Graphics container is positioned
 * there; geometry is emitted at `(0, 0)` in local space.
 *
 * Texture source: `url` (resolved via `ShapeHostInfo.textureRegistry`) or raw
 * `texture` (caller-owned, lifecycle stays with caller).
 */

import { Graphics, type Texture } from 'pixi.js';
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';
import type { FillFit } from '../../draw/types';
import { drawCircle } from '../../draw/shapes/circle';
import { resolveImageTexture } from './_imageUtils';

export interface ImageCircleShapeSpec extends BaseShapeSpec {
  readonly kind: 'image-circle';
  readonly texture?: Texture;
  readonly url?: string;
  /** Radius of the circle. The image is sized according to `fillFit`. */
  readonly r: number;
  /** How the image fills the circle's bounding box. Default `'cover'`. */
  readonly fillFit?: FillFit;
  /** Optional border color drawn around the circle. */
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class ImageCircleShape implements IShape<ImageCircleShapeSpec> {
  readonly gfx: Graphics;
  private texture: Texture;
  private currentSpec: ImageCircleShapeSpec;
  private readonly host: ShapeHostInfo;

  constructor(spec: ImageCircleShapeSpec, host: ShapeHostInfo) {
    this.host = host;
    this.currentSpec = spec;
    this.gfx = new Graphics();
    this.gfx.label = 'shape:image-circle';
    host.surface.addChild(this.gfx);

    this.texture = resolveImageTexture(spec, host, (tex) => {
      this.texture = tex;
      if (!this.gfx.destroyed) this.redraw();
    });
    this.redraw();
  }

  draw(spec: ImageCircleShapeSpec): void {
    const urlChanged = spec.url !== this.currentSpec.url;
    this.currentSpec = spec;

    if (urlChanged) {
      this.texture = resolveImageTexture(spec, this.host, (tex) => {
        this.texture = tex;
        if (!this.gfx.destroyed) this.redraw();
      });
    }

    this.redraw();
  }

  bounds(): Rect {
    const r = this.currentSpec.r;
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }

  contains(localX: number, localY: number): boolean {
    const r = this.currentSpec.r;
    return localX * localX + localY * localY <= r * r;
  }

  destroy(): void {
    this.gfx.destroy({ texture: false });
  }

  private redraw(): void {
    const spec = this.currentSpec;
    this.gfx.clear();
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;
    drawCircle(this.gfx, {
      kind: 'circle',
      x: 0,
      y: 0,
      r: spec.r,
      fill: this.texture,
      fillFit: spec.fillFit ?? 'cover',
      stroke: spec.stroke,
      strokeWidth: spec.strokeWidth,
      strokeAlpha: spec.strokeAlpha,
    });
  }
}
