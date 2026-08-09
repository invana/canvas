/**
 * `@invana/renderer-pixijs` — the PixiJS drawing backend for `@invana/canvas`.
 *
 * **Everything that touches `pixi.js` in this repo lives here.** The engine
 * orchestrates, `@invana/graph` describes, this package draws.
 *
 * ```ts
 * import { Canvas } from '@invana/canvas';
 * import { PixiRenderer } from '@invana/renderer-pixijs';
 *
 * const canvas = new Canvas();
 * await canvas.init({ container: el, renderer: new PixiRenderer({ events: canvas.events }) });
 * ```
 *
 * `renderer` is optional — omitting it makes `Canvas.init` resolve this package
 * with a lazy `import()`, which is why `@invana/canvas` declares it an
 * **optional peer** rather than a dependency (design D1, §4.6).
 *
 * What is *not* here, deliberately: interaction state, the hit index (picking is
 * interaction, not drawing — D5), connector routing and path styles (geometry
 * answers must not need a backend — §5), and any domain concept. If something
 * here can only be expressed in pixi terms, that is a bug in the contract.
 */

// ─── The renderer contract, realised ─────────────────────────────────────────
export { PixiRenderer, type PixiRendererOptions } from './PixiRenderer';
export { PixiSurface, type PixiSurfaceOptions } from './PixiSurface';
export { PixiOverlayDevice } from './PixiOverlayDevice';
export { PixiViewportBinding } from './PixiViewportBinding';

/**
 * Convenience factory used by `Canvas.init`'s lazy default-backend resolution.
 * Kept as a named export so the dynamic import has a stable entry point.
 */
export { createDefaultRenderer } from './createDefaultRenderer';

// ─── Drawing device + primitives (custom shape / decoration authors) ─────────
export * from './primitivesIndex';

// ─── Assets ──────────────────────────────────────────────────────────────────
export { TextureRegistry } from './textures/TextureRegistry';
export { loadIconFont } from './fonts/loadIconFont';

// ─── Backend capability probing ──────────────────────────────────────────────
export {
  hasWebGPUApi,
  hasWebGL,
  canUseWebGPU,
  resolveRenderPreference,
  bestRenderPreference,
  type RenderPreference,
} from './rendererSupport';
