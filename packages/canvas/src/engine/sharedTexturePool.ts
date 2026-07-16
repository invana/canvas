import { GlobalResourceRegistry, TexturePool } from 'pixi.js';

/**
 * Owns the lifetime of pixi's **global** `TexturePool` so it isn't torn down
 * out from under a live canvas.
 *
 * ## The problem
 *
 * pixi shares a single `TexturePool` across every `Application`/renderer on the
 * page, registered with `GlobalResourceRegistry`. Destroying *any* renderer runs
 * `AbstractRenderer.destroy()` → `GlobalResourceRegistry.release()` →
 * `TexturePool.clear()`, which empties the shared pool. If another canvas is
 * still alive and mid-frame, its next pooled-texture return (filters, masks,
 * `cacheAsTexture`, text all use the pool) throws
 * `Cannot read properties of undefined (reading 'push')` — the pool's bucket was
 * yanked away while its `textureUid → bucket` lookup still pointed at it.
 *
 * This bites any overlapping-lifetime scenario: several canvases on one page
 * (destroying one clears the pool under the others) or navigation/remount (the
 * outgoing canvas's destroy races the incoming canvas's first render). A lone
 * canvas never hits it. Still unfixed as of pixi 8.19.0.
 *
 * ## The fix
 *
 * The bug is one of *ownership*: a per-renderer `destroy()` should not clear a
 * pool shared by other renderers. So we take the shared `TexturePool` out of
 * `GlobalResourceRegistry` (via its public `unregister`) while any canvas is
 * alive — a renderer teardown then leaves the pool intact for its siblings — and
 * ref-count live canvases so we clear the pool ourselves, once, when the **last**
 * one is destroyed (nothing is rendering then, so there's no bucket to yank).
 * Surviving canvases keep their pooled textures too, avoiding needless
 * reallocation churn on every sibling teardown.
 *
 * Uses only pixi's public API (`GlobalResourceRegistry`, `TexturePool`) — no
 * monkey-patching, no reaching into pool internals. Call {@link acquireSharedTexturePool}
 * before a renderer spins up and {@link releaseSharedTexturePool} after it tears
 * down; the two must be balanced per canvas.
 */

/** Number of canvases currently holding the shared pool detached from pixi's registry. */
let liveCanvasCount = 0;

/**
 * Register interest in the shared `TexturePool` for a canvas that's about to
 * create a renderer. The first caller detaches the pool from pixi's
 * `GlobalResourceRegistry` so no subsequent renderer `destroy()` can clear it
 * while canvases are alive. Balanced by {@link releaseSharedTexturePool}.
 */
export function acquireSharedTexturePool(): void {
  if (liveCanvasCount === 0) {
    // `unregister` is a Set delete — idempotent and safe if pixi never
    // registered it (e.g. a future version that fixes this upstream).
    GlobalResourceRegistry.unregister(TexturePool);
  }
  liveCanvasCount++;
}

/**
 * Release a canvas's interest in the shared `TexturePool` after its renderer has
 * been destroyed. When the **last** live canvas releases, we clear the pool
 * ourselves — freeing its GPU textures now that nothing can be rendering — the
 * cleanup pixi's per-renderer teardown would otherwise have done unsafely.
 * Balanced against {@link acquireSharedTexturePool}.
 */
export function releaseSharedTexturePool(): void {
  if (liveCanvasCount === 0) return;
  liveCanvasCount--;
  if (liveCanvasCount === 0) {
    TexturePool.clear(true);
  }
}
