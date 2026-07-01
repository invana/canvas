/**
 * `RendererInitOptions` — the **adapter-local, non-syncable** init bag handed to a
 * renderer at {@link IRenderer.mount}.
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
export interface RendererInitOptions {
  /**
   * Preferred GPU backend. The renderer may downgrade (e.g. `'webgpu'` → `'webgl'`
   * on browsers whose WebGPU path is unavailable); the resolved value is reported
   * on {@link IRenderer.backend} after mount.
   */
  preference?: 'webgpu' | 'webgl' | 'auto';
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
