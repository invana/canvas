/**
 * `ImageRectShape` — image projected onto a rectangle (optionally rounded) via texture fill.
 * Registered as kind `'image-rect'`.
 *
 * A single `Graphics` object draws the rect/roundRect with `g.fill({ texture, matrix })`,
 * so the rect geometry IS the clip mask — no separate Sprite or mask display object.
 * An optional stroke is drawn on the same Graphics pass.
 *
 * Spec `(x, y)` is the center of the rectangle. The Graphics container is positioned
 * there; geometry is emitted at `(0, 0)` in local space.
 *
 * Texture source: `url` (resolved via `ShapeHostInfo.textureRegistry`) or raw
 * `texture` (caller-owned, lifecycle stays with caller).
 */

import { Graphics, type Texture } from 'pixi.js';
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';
import type { FillFit } from '../../draw/types';
import { drawRect } from '../../draw/shapes/rect';
import { resolveImageTexture } from './_imageUtils';

export interface ImageRectShapeSpec extends BaseShapeSpec {
  readonly kind: 'image-rect';
  readonly texture?: Texture;
  readonly url?: string;
  readonly width: number;
  readonly height: number;
  /** Corner radius for the clip mask. `0` = sharp corners. Default `0`. */
  readonly cornerRadius?: number;
  /** How the image fills the rectangle's bounding box. Default `'cover'`. */
  readonly fillFit?: FillFit;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class ImageRectShape implements IShape<ImageRectShapeSpec> {
  readonly gfx: Graphics;
  private texture: Texture;
  private currentSpec: ImageRectShapeSpec;
  private readonly host: ShapeHostInfo;

  constructor(spec: ImageRectShapeSpec, host: ShapeHostInfo) {
    this.host = host;
    this.currentSpec = spec;
    this.gfx = new Graphics();
    this.gfx.label = 'shape:image-rect';
    host.surface.addChild(this.gfx);

    this.texture = resolveImageTexture(spec, host, (tex) => {
      this.texture = tex;
      if (!this.gfx.destroyed) this.redraw();
    });
    this.redraw();
  }

  draw(spec: ImageRectShapeSpec): void {
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
    const { width, height } = this.currentSpec;
    return { x: -width / 2, y: -height / 2, width, height };
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
    drawRect(this.gfx, {
      kind: 'rect',
      x: 0,
      y: 0,
      width: spec.width,
      height: spec.height,
      cornerRadius: spec.cornerRadius,
      fill: this.texture,
      fillFit: spec.fillFit ?? 'cover',
      stroke: spec.stroke,
      strokeWidth: spec.strokeWidth,
      strokeAlpha: spec.strokeAlpha,
    });
  }
}
