/**
 * `ImageShape` — built-in primitive registered as kind `'image'`.
 *
 * Accepts a preloaded `Texture`. URL loading is the caller's responsibility
 * (use `Assets.load(url)` from pixi); this keeps the renderer synchronous
 * and predictable. A higher-level convenience helper that takes a string URL
 * can layer on top.
 *
 * Convention: spec `(x, y)` is the **center** of the image. The underlying
 * `Sprite.anchor` is set to `(0.5, 0.5)` so positioning is consistent with
 * the other shapes.
 */

import { Container, Sprite, type Texture } from 'pixi.js';
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';

export interface ImageShapeSpec extends BaseShapeSpec {
  readonly kind: 'image';
  readonly texture: Texture;
  readonly width: number;
  readonly height: number;
  /** Multiplicative tint; `0xffffff` for none. Default `0xffffff`. */
  readonly tint?: number;
}

export class ImageShape implements IShape<ImageShapeSpec> {
  readonly gfx: Container;
  private readonly sprite: Sprite;

  constructor(spec: ImageShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'shape:image';
    this.sprite = new Sprite(spec.texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.gfx.addChild(this.sprite);
    host.surface.addChild(this.gfx);
  }

  draw(spec: ImageShapeSpec): void {
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    if (this.sprite.texture !== spec.texture) {
      this.sprite.texture = spec.texture;
    }
    this.sprite.width = spec.width;
    this.sprite.height = spec.height;
    this.sprite.tint = spec.tint ?? 0xffffff;
  }

  bounds(): Rect {
    const w = this.sprite.width;
    const h = this.sprite.height;
    return { x: -w / 2, y: -h / 2, width: w, height: h };
  }

  destroy(): void {
    // Don't destroy the texture itself — it may be shared / cached by the
    // caller's asset pipeline. Just unparent and dispose of the sprite.
    this.gfx.destroy({ children: true });
  }
}
