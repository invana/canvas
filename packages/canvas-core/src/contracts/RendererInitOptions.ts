/**
 * `RendererInitOptions` — the **adapter-local, non-syncable** init bag handed to a
 * renderer at `IRenderer.mount` (the interface lives in `@invana/canvas`).
 *
 * These are deliberately the device/backend knobs that {@link CanvasSceneOptions}
 * (`view/CanvasView.ts`) leaves out on purpose — they belong to the renderer
 * adapter, not the syncable `view.definition`. Where the split falls:
 *
 * - **Syncable scene config** (background, zoom clamp, world bounds, default mode)
 *   → `view.definition.canvas` ({@link CanvasSceneOptions}) — converges in a CRDT.
 * - **Device / init options** (which GPU backend, antialias, DPR, canvas size) →
 *   **here** — per-client, never synced, only meaningful at mount.
 *
 * A concrete renderer (e.g. `@invana/renderer-pixijs`) may widen this with its own
 * backend-specific fields; the kernel types only the portable subset.
 */
/**
 * Preferred drawing backend, in descending order of capability:
 *
 * - `'webgpu'` — the fastest path where the browser supports it.
 * - `'webgl'` — the universal fallback; opt out of WebGPU entirely by asking for it.
 * - `'canvas'` — the 2D-context renderer of last resort (no GPU context at all).
 *
 * **This is the single declaration of the preference vocabulary.** The engine's
 * `CanvasOptions.preference` and each backend's own preference type alias *this*,
 * so the seam between them cannot silently diverge — it did once, and a
 * `'canvas'` request was quietly downgraded to WebGL for it. Omit the option
 * entirely to let the backend choose (the documented default); there is no
 * separate `'auto'` spelling of that.
 */
export type RenderPreference = 'webgpu' | 'webgl' | 'canvas';

export interface RendererInitOptions {
  /**
   * Preferred GPU backend ({@link RenderPreference}). The renderer may downgrade
   * (e.g. `'webgpu'` → `'webgl'` on browsers whose WebGPU path is unavailable);
   * the resolved value is reported on `IRenderer.backend` after mount. Omit to
   * let the backend choose.
   */
  preference?: RenderPreference;
  /** Enable multisample antialiasing. */
  antialias?: boolean;
  /** Device-pixel-ratio / resolution override. Defaults to the display DPR. */
  resolution?: number;
  /**
   * Initial drawing-surface size in CSS pixels. Omit to fill (and track) the host
   * element's client box.
   */
  width?: number;
  height?: number;
  /**
   * Initial clear colour (`0xRRGGBB`) applied before the first frame. The ongoing
   * scene background is the syncable {@link CanvasSceneOptions.backgroundColor};
   * this is only the pre-mount clear.
   */
  background?: number;
}
