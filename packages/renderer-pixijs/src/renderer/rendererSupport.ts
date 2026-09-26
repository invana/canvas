// Renderer backend capability detection.
//
// PixiJS picks WebGPU-first and falls back to WebGL only where there is *no*
// WebGPU at all. WebKit (desktop Safari and, since they're all WebKit under the
// hood, every iOS browser) is the broken middle case: `navigator.gpu` is present
// and the adapter resolves, so PixiJS selects WebGPU and then crashes at
// *render* time inside shader-program setup:
//
//   TypeError: null is not an object (evaluating 'program.layout[groupIndex]')
//
// That is past `Application.init()`, so no try/catch around init sees it. The
// renderer's render guard recovers by tearing the canvas down and rebuilding it
// on WebGL — but a host with work in flight on the first canvas (a layout, a
// camera fit) then runs it against a destroyed one. So WebGPU is not *selected*
// on WebKit: {@link canUseWebGPU} excludes it, and the engine resolves the
// preference up front in `Canvas.init()` via {@link resolveRenderPreference}.
// Revisit when a current Safari renders PixiJS WebGPU cleanly.

// The preference vocabulary is declared once, by the renderer contract in
// `@invana/canvas-core`. Re-exported (not re-declared) so this backend and the
// engine cannot drift apart: a third independent copy of the union is exactly
// how `'canvas'` came to be silently rewritten to `'webgl'` at the seam.
import type { RenderPreference } from '@invana/canvas-core';

export type { RenderPreference };

/**
 * Whether the WebGPU API surface is present (`navigator.gpu`). Cheap and
 * synchronous. This is the signal {@link canUseWebGPU} gates on.
 */
export function hasWebGPUApi(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/** {@link hasWebGL}'s answer, probed once per page. */
let webglProbe: boolean | null = null;

/**
 * Whether a WebGL (`webgl2`/`webgl`) context can be created — the floor for
 * rendering. If this is false and WebGPU is unusable too, the canvas can't
 * initialise on this browser at all.
 *
 * **Probed once, and the probe's context is released.** Answering means creating
 * a real context, and browsers cap live contexts (~16 in Chrome) by evicting the
 * oldest — a live canvas's own among them. A consumer calling this from a React
 * render (a capability notice) used to create one per render. The answer cannot
 * change within a page, so it is memoised.
 */
export function hasWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  if (typeof document === 'undefined') return false;
  try {
    const el = document.createElement('canvas');
    const gl = (el.getContext('webgl2') ||
      el.getContext('webgl') ||
      el.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    webglProbe = !!gl;
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}

/**
 * Whether the browser is WebKit-based (desktop Safari + all iOS browsers), where
 * PixiJS's WebGPU renderer crashes at render time (see module header). UA
 * sniffing is unavoidable: the failure surfaces only while rendering and the
 * WebGPU adapter resolves, so there's nothing to feature-detect up front.
 * Chromium (`Chrome`/`CriOS`/`Edg`/`OPR`) and Firefox (`Firefox`/`FxiOS`) — which
 * carry `Safari` in their UA strings — are excluded.
 */
function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)) return false;
  return /Safari/.test(ua) || /iPhone|iPad|iPod/.test(ua);
}

/**
 * Whether WebGPU can actually be used for rendering here: the API is present
 * *and* the browser isn't WebKit (see {@link isWebKit}). This is what consumers
 * should gate a "use WebGPU" toggle on, not raw `navigator.gpu` presence.
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
