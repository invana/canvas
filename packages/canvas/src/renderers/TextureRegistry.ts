/**
 * `TextureRegistry` — user-facing texture preload and cache.
 *
 * Designed to be created once (e.g. in `GraphLayer.onMount`) and passed to
 * one or more `ShapesRenderer` instances via `ShapesRendererOptions.textureRegistry`.
 * The renderer uses the registry internally when resolving `url`-based
 * `ImageShapeSpec`s — callers never need to reference texture keys directly.
 *
 * If no registry is provided to `ShapesRenderer`, the renderer creates an
 * internal one so that URL-based loading still works (lazy, per shape).
 *
 * Lifecycle:
 *   - Textures loaded via `load` / `preload` / `loadAtlas` are owned by
 *     this registry and destroyed in `destroy()`.
 *   - Textures registered via `register(url, texture)` are external — the
 *     caller owns the lifecycle; `destroy()` does not touch them.
 */

import { Assets, type Texture } from 'pixi.js';

export class TextureRegistry {
  /** Textures we loaded — we own the lifecycle. */
  private readonly owned = new Map<string, Texture>();
  /** Textures registered externally — caller owns the lifecycle. */
  private readonly external = new Map<string, Texture>();

  /** Look up a cached texture by URL or atlas frame name. */
  get(url: string): Texture | undefined {
    return this.owned.get(url) ?? this.external.get(url);
  }

  has(url: string): boolean {
    return this.owned.has(url) || this.external.has(url);
  }

  /**
   * Register a pre-built texture. Useful for programmatically generated or
   * SVG-constructed textures. The caller retains ownership — `destroy()` will
   * not unload this texture.
   */
  register(url: string, texture: Texture): void {
    this.external.set(url, texture);
  }

  /**
   * Load a single URL and cache it. Returns the cached texture on subsequent
   * calls (synchronous fast path). Uses pixi's `Assets` pipeline so the
   * result integrates with the global asset manager.
   *
   * For URLs without a recognised image extension (e.g. picsum.photos,
   * signed CDN URLs, API endpoints) the `loadTextures` parser is explicitly
   * requested so PixiJS doesn't skip loading due to an unknown file type.
   */
  async load(url: string): Promise<Texture> {
    const existing = this.owned.get(url) ?? this.external.get(url);
    if (existing) return existing;
    if (!hasImageExtension(url)) {
      // Pre-register with a parser hint so Assets.load(url) resolves correctly
      Assets.add({ alias: url, src: url, loadParser: 'loadTextures' });
    }
    const texture = await Assets.load<Texture>(url);
    this.owned.set(url, texture);
    return texture;
  }

  /** Batch-preload a list of URLs in parallel. Await before first render to avoid mid-frame async loads. */
  async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.load(url)));
  }

  /**
   * Load a PixiJS spritesheet atlas JSON. After this resolves, individual
   * frame textures are accessible via `get(frameName)` where `frameName`
   * matches the keys declared in the atlas JSON.
   *
   * All 1k-icon atlases packed into a single PNG → one GPU upload, one
   * draw call for every sprite sharing that atlas page.
   */
  async loadAtlas(jsonUrl: string): Promise<void> {
    const result = await Assets.load(jsonUrl);
    if (result && typeof result === 'object' && 'textures' in result) {
      for (const [name, tex] of Object.entries(result.textures as Record<string, Texture>)) {
        this.owned.set(name, tex);
      }
    }
  }

  /**
   * Unload and destroy all textures owned by this registry. External textures
   * (registered via `register`) are not touched. Call when the host Layer
   * unmounts.
   */
  destroy(): void {
    for (const url of this.owned.keys()) {
      Assets.unload(url).catch(() => {});
    }
    this.owned.clear();
    this.external.clear();
  }
}

// ─── Internal helpers ──────────────────────────────────────────────────────

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|$)/i;

/** True when the URL path ends with a recognised image extension. */
function hasImageExtension(url: string): boolean {
  return IMAGE_EXT_RE.test(url);
}
