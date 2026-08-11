// Renderer backend capability detection.
//
// We trust WebGPU API presence (`navigator.gpu`) as the signal that WebGPU is
// usable, mirroring PixiJS's own `isWebGPUSupported()`. If the API is there, we
// let PixiJS select WebGPU.
//
// History: there used to be an extra WebKit (desktop Safari + all iOS browsers)
// guard here. Older WebKit advertised a working WebGPU adapter but then crashed
// at *render* time inside shader-program setup:
//
//   TypeError: null is not an object (evaluating 'program.layout[groupIndex]')
//
// Because that failure is at render time (not during `Application.init()`), it
// couldn't be caught with a try/catch around init. We've since removed the guard
// to let Safari use WebGPU where it works. If the render-time crash resurfaces on
// a current Safari + PixiJS, reintroduce a WebKit exclusion in {@link canUseWebGPU}
// (the engine resolves the preference up front in `Canvas.init()` via
// {@link resolveRenderPreference}, so the gate belongs there).

/** Preferred PixiJS render backend. Mirrors `CanvasOptions.preference`. */
export type RenderPreference = 'webgpu' | 'webgl' | 'canvas';

/**
 * Whether the WebGPU API surface is present (`navigator.gpu`). Cheap and
 * synchronous. This is the signal {@link canUseWebGPU} gates on.
 */
export function hasWebGPUApi(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Whether a WebGL (`webgl2`/`webgl`) context can be created — the floor for
 * rendering. If this is false and WebGPU is unusable too, the canvas can't
 * initialise on this browser at all.
 */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const el = document.createElement('canvas');
    return !!(
      el.getContext('webgl2') ||
      el.getContext('webgl') ||
      (el.getContext('experimental-webgl') as RenderingContext | null)
    );
  } catch {
    return false;
  }
}

/**
 * Whether WebGPU can be used for rendering here. Currently equivalent to
 * {@link hasWebGPUApi} — we trust API presence and let PixiJS select WebGPU. This
 * is the gate consumers should hang a "use WebGPU" toggle on; if a browser-specific
 * exclusion ever needs to come back (see module header), add it here so every
 * consumer and {@link resolveRenderPreference} pick it up at once.
 */
export function canUseWebGPU(): boolean {
  return hasWebGPUApi();
}

/**
 * Resolve the backend the engine will actually request from PixiJS. Downgrades a
 * `'webgpu'` preference to `'webgl'` when WebGPU isn't usable ({@link canUseWebGPU}),
 * so we never hand PixiJS a backend that will crash at render time. `'webgl'` and
 * `'canvas'` pass through unchanged. Applied by `Canvas.init()`; the resolved
 * backend is reported on the `renderer:initialised` event.
 */
export function resolveRenderPreference(pref: RenderPreference): RenderPreference {
  if (pref === 'webgpu' && !canUseWebGPU()) return 'webgl';
  return pref;
}

/**
 * The most performant backend this browser can actually render with: WebGPU when
 * usable ({@link canUseWebGPU}), else WebGL when a context is available
 * ({@link hasWebGL}), else `'canvas'` as a last resort. Use it to default a
 * canvas / a backend picker to the fastest option the device supports, rather
 * than hard-coding `'webgpu'` and relying on downgrade.
 */
export function bestRenderPreference(): RenderPreference {
  if (canUseWebGPU()) return 'webgpu';
  if (hasWebGL()) return 'webgl';
  return 'canvas';
}
