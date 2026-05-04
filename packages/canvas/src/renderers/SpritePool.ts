/**
 * `SpritePool` — object pool for `Sprite` instances.
 *
 * At 500k nodes, allocating and destroying a `Sprite` per add/remove
 * creates significant GC pressure. This pool recycles `Sprite` objects: a
 * released sprite is reset to neutral defaults and returned to the pool;
 * the next `acquire` for the same URL hands it back out without a heap
 * allocation.
 *
 * Sprites are keyed by the shape's `url` so a recycled sprite already carries
 * the right texture — only position/size updates are needed.
 *
 * Internal to `ShapesRenderer`. Not exported from `@invana/canvas`.
 */

import { Sprite, type Texture } from 'pixi.js';

export class SpritePool {
  private readonly pools = new Map<string, Sprite[]>();

  /**
   * Acquire a sprite for the given URL/texture pair.
   *
   * Pool hit: resets a recycled sprite and returns it (no allocation).
   * Pool miss: creates a new `Sprite` with anchor `(0.5, 0.5)`.
   */
  acquire(url: string, texture: Texture): Sprite {
    const pool = this.pools.get(url);
    if (pool && pool.length > 0) {
      const sprite = pool.pop()!;
      sprite.texture = texture;
      sprite.visible = true;
      sprite.alpha = 1;
      sprite.tint = 0xffffff;
      sprite.scale.set(1, 1);
      return sprite;
    }
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    return sprite;
  }

  /**
   * Return a sprite to the pool. The caller must detach the sprite from its
   * parent before calling this (e.g. `gfx.removeChild(sprite)`). The sprite
   * is hidden in the pool to guard against accidental double-use.
   */
  release(url: string, sprite: Sprite): void {
    sprite.visible = false;
    sprite.removeFromParent();
    let pool = this.pools.get(url);
    if (!pool) {
      pool = [];
      this.pools.set(url, pool);
    }
    pool.push(sprite);
  }

  /** Destroy all pooled sprites. Called from `ShapesRenderer.destroy()`. */
  destroy(): void {
    for (const pool of this.pools.values()) {
      for (const sprite of pool) sprite.destroy();
    }
    this.pools.clear();
  }
}
