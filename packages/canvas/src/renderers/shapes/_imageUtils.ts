/**
 * Shared helpers for image-bearing shapes.
 * Used by `ImageShape`, `ImageCircleShape`, `ImageRectShape`.
 * Internal — not exported from the package.
 */

import { Assets, Sprite, Texture } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { ShapeHostInfo } from '../types';

/** Resolve a url/texture spec to a pixi Texture. Kicks off async load if not yet cached. */
export function resolveImageTexture(
  spec: { url?: string; texture?: Texture },
  host: ShapeHostInfo,
  onLoaded: (tex: Texture) => void,
): Texture {
  if (spec.url) {
    const cached = host.textureRegistry?.get(spec.url) ?? Assets.get<Texture>(spec.url);
    if (cached) return cached;
    // Not in registry or pixi cache yet — start async load and render placeholder
    host.textureRegistry?.load(spec.url).then(onLoaded).catch(() => {});
    return Texture.EMPTY;
  }
  if (spec.texture) return spec.texture;
  throw new Error('Image shape: provide either url or texture');
}

/** Acquire a sprite from the pool (if url + pool available) or create a new one. */
export function acquireSprite(
  url: string | undefined,
  texture: Texture,
  host: ShapeHostInfo,
): Sprite {
  if (url && host.spritePool) return host.spritePool.acquire(url, texture);
  const s = new Sprite(texture);
  s.anchor.set(0.5, 0.5);
  return s;
}

/** Remove a sprite from its parent and return it to the pool (or destroy it). */
export function releaseSprite(
  url: string | undefined,
  sprite: Sprite,
  parent: Container,
  host: ShapeHostInfo,
): void {
  parent.removeChild(sprite);
  if (url && host.spritePool) {
    host.spritePool.release(url, sprite);
  } else {
    sprite.destroy({ texture: false });
  }
}
