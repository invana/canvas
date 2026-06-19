// Renderer backend capability detection.
//
// PixiJS picks WebGPU-first and "falls back to WebGL automatically" — but that
// fallback only covers browsers with *no* WebGPU at all. WebKit (desktop Safari
// and, since they're all WebKit under the hood, every iOS browser) is the broken
// middle case: it advertises a working WebGPU adapter — `navigator.gpu` is
// present and `requestAdapter()` resolves — so PixiJS selects WebGPU and only
// then crashes, at *render* time, inside shader-program setup:
//
//   TypeError: null is not an object (evaluating 'program.layout[groupIndex]')
//
// Because the failure is at render time (not during `Application.init()`), it
// can't be caught with a try/catch around init, and PixiJS's own
// `isWebGPUSupported()` returns `true` there. The only reliable fix is to not
// *select* WebGPU on WebKit — see {@link resolveRenderPreference}, which the
// engine applies in `Canvas.init()`. Revisit the WebKit guard if/when a future
// Safari renders PixiJS WebGPU cleanly.

/** Preferred PixiJS render backend. Mirrors `CanvasOptions.preference`. */
export type RenderPreference = 'webgpu' | 'webgl' | 'canvas';

/**
 * Whether the WebGPU API surface is present (`navigator.gpu`). Cheap and
 * synchronous, but presence doesn't guarantee a usable renderer — see
 * {@link canUseWebGPU}, which also excludes WebKit.
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
 * Whether the browser is WebKit-based (desktop Safari + all iOS browsers), where
 * PixiJS's WebGPU renderer crashes at render time (see module header). UA
 * sniffing is unavoidable: the failure surfaces only while rendering and the
 * WebGPU adapter resolves, so there's nothing to feature-detect up front.
 * Chromium (`Chrome`/`CriOS`/`Edg`/`OPR`) and Firefox (`Firefox`/`FxiOS`) — which
 * carry `Safari` in their UA strings — are excluded.
 */
export function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)) return false;
  return /Safari/.test(ua) || /iPhone|iPad|iPod/.test(ua);
}

/**
 * Whether WebGPU can actually be used for rendering here: the API is present
 * *and* the browser isn't WebKit (where PixiJS WebGPU is broken — see
 * {@link isWebKit}). This is what consumers should gate a "use WebGPU" toggle on,
 * not raw `navigator.gpu` presence.
 */
export function canUseWebGPU(): boolean {
  return hasWebGPUApi() && !isWebKit();
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
