/**
 * `ImageShape` — built-in primitive registered as kind `'image'`.
 *
 * Two texture sources:
 *   - `url`     — pipeline resolves via `ShapeHostInfo.textureRegistry`. The
 *                 renderer caches and shares textures by URL so all shapes
 *                 with the same URL share one GPU upload and one draw call.
 *   - `texture` — raw pixi `Texture`; caller owns the lifecycle (existing
 *                 behaviour, fully backwards-compatible).
 *
 * One of `url` or `texture` must be provided. `url` takes priority if both
 * are given.
 *
 * When a `url` is not yet in the registry the shape displays a transparent
 * placeholder and swaps to the real texture once the async load completes.
 *
 * Convention: spec `(x, y)` is the **center** of the image. The underlying
 * `Sprite.anchor` is set to `(0.5, 0.5)` so positioning is consistent with
 * the other shapes.
 *
 * Pool-awareness: when `ShapeHostInfo.spritePool` is present and the shape
 * uses a `url`, sprites are recycled via the pool instead of allocated /
 * GC'd per add/remove. At 500k nodes this eliminates allocation pressure
 * from the hot path.
 */

import { Assets, Container, Sprite, Texture } from 'pixi.js';
import type { BaseShapeSpec, IShape, Rect, ShapeHostInfo } from '../types';

export interface ImageShapeSpec extends BaseShapeSpec {
  readonly kind: 'image';
  /** Raw pixi Texture — caller owns the lifecycle. */
  readonly texture?: Texture;
  /** URL (or atlas frame name) resolved via the registry. Pipeline caches and shares. */
  readonly url?: string;
  readonly width: number;
  readonly height: number;
  /** Multiplicative tint; `0xffffff` for none. Default `0xffffff`. */
  readonly tint?: number;
}

export class ImageShape implements IShape<ImageShapeSpec> {
  readonly gfx: Container;
  private sprite: Sprite;
  private readonly host: ShapeHostInfo;
  /** The url key this sprite is pooled under (undefined when using raw texture). */
  private currentUrl: string | undefined;

  constructor(spec: ImageShapeSpec, host: ShapeHostInfo) {
    this.host = host;
    this.gfx = new Container();
    this.gfx.label = 'shape:image';

    const texture = this.resolveTexture(spec);
    this.currentUrl = spec.url;
    this.sprite = this.acquireSprite(spec.url, texture);
    this.gfx.addChild(this.sprite);
    host.surface.addChild(this.gfx);
  }

  draw(spec: ImageShapeSpec): void {
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const urlChanged = spec.url !== this.currentUrl;
    if (urlChanged) {
      // Release the old sprite and acquire one for the new URL
      this.releaseCurrentSprite();
      const texture = this.resolveTexture(spec);
      this.currentUrl = spec.url;
      this.sprite = this.acquireSprite(spec.url, texture);
      this.gfx.addChild(this.sprite);
    } else if (!spec.url && spec.texture && spec.texture !== this.sprite.texture) {
      // Raw texture swap (no pool involved)
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
    this.releaseCurrentSprite();
    // Container has no remaining children after sprite removal; cascade is safe.
    this.gfx.destroy({ children: true, texture: false });
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /**
   * Resolve the spec to a `Texture`:
   *   1. `url` in registry → synchronous cache hit
   *   2. `url` in pixi global cache → synchronous (already loaded elsewhere)
   *   3. `url` not cached → kick off async load via registry; return `EMPTY` placeholder
   *   4. raw `texture` field → use directly
   */
  private resolveTexture(spec: ImageShapeSpec): Texture {
    if (spec.url) {
      const cached = this.host.textureRegistry?.get(spec.url) ?? Assets.get<Texture>(spec.url);
      if (cached) return cached;
      // Not yet available — start async load and swap sprite when done
      this.host.textureRegistry?.load(spec.url).then((tex) => {
        if (!this.gfx.destroyed) this.sprite.texture = tex;
      }).catch(() => {});
      return Texture.EMPTY;
    }
    if (spec.texture) return spec.texture;
    throw new Error('ImageShape: provide either url or texture');
  }

  /** Acquire a sprite from the pool (if url + pool available) or allocate a new one. */
  private acquireSprite(url: string | undefined, texture: Texture): Sprite {
    if (url && this.host.spritePool) {
      return this.host.spritePool.acquire(url, texture);
    }
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    return sprite;
  }

  /** Remove the current sprite from the scene and either pool or destroy it. */
  private releaseCurrentSprite(): void {
    this.gfx.removeChild(this.sprite);
    if (this.currentUrl && this.host.spritePool) {
      this.host.spritePool.release(this.currentUrl, this.sprite);
    } else {
      // Don't destroy the texture — owned by registry or caller
      this.sprite.destroy({ texture: false });
    }
  }
}
