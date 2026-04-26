// ── TextureRegistry ───────────────────────────────────────────────────────────
// Shared texture store — all shapes with the same key reference one GPU texture.
// Must be populated before setData() if any shapes use TextureFill or IconFill.

import { Assets, Texture } from 'pixi.js';

/**
 * `TextureRegistry` is a shared, static GPU texture store.
 *
 * @remarks
 * All shapes that use `fill: { type: 'texture', src: key }` or
 * `fill: { type: 'icon', src: key }` read from this registry.
 * Textures are loaded via PixiJS `Assets.load` and stored by a
 * developer-chosen string key.
 *
 * Populate the registry **before** calling `ShapePlugin.setData()` for
 * any shapes that reference textures:
 *
 * ```ts
 * await ShapePlugin.registerTexture('avatar:user', '/icons/user.png');
 * shapes.setData([{ id: 'n1', type: 'circle', fill: { type: 'icon', src: 'avatar:user' } }]);
 * ```
 */
export class TextureRegistry {
  private static _map = new Map<string, Texture>();
  private static _pending = new Map<string, Promise<Texture>>();

  /**
   * Pre-load and register a texture under a key.
   * Safe to call multiple times with the same key — resolves immediately on repeat.
   */
  static async register(key: string, url: string): Promise<void> {
    if (TextureRegistry._map.has(key)) return;

    if (!TextureRegistry._pending.has(key)) {
      const p = Assets.load<Texture>(url).then((tex) => {
        TextureRegistry._map.set(key, tex);
        TextureRegistry._pending.delete(key);
        return tex;
      });
      TextureRegistry._pending.set(key, p);
    }

    await TextureRegistry._pending.get(key)!;
  }

  /** Get a registered texture synchronously. Returns null if not yet loaded. */
  static get(key: string): Texture | null {
    return TextureRegistry._map.get(key) ?? null;
  }

  static has(key: string): boolean {
    return TextureRegistry._map.has(key);
  }

  static unregister(key: string): void {
    TextureRegistry._map.delete(key);
  }
}
