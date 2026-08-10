/**
 * `IRenderer` — the drawing backend contract.
 *
 * ## Why this lives in `@invana/canvas` and not the kernel
 *
 * The kernel (`@invana/canvas-store`) is renderer-free and has no spec
 * vocabulary — and this contract is *made of* spec vocabulary: a surface
 * projects `BaseShapeSpec` / `BaseConnectorSpec`, an overlay draws in engine
 * geometry, a camera binding speaks the abstract transform. So the seam belongs
 * to the orchestrator, which owns that vocabulary. The kernel keeps only the two
 * genuinely device-shaped types it already had — {@link RendererBackend} and
 * `RendererInitOptions` — because those are the non-syncable counterpart to
 * `CanvasSceneOptions` and carry no drawing concepts.
 *
 * ## What a renderer actually is here
 *
 * Not a push target. `@invana/canvas` hands out **devices** and the renderer
 * answers with realisations:
 *
 * ```
 * Canvas ──mount()──────────────► stands up the backend + its scene root
 *        ──createSurface(id)────► ISurface   → SpecProjectionTarget (durable content)
 *                                            → IOverlayDevice      (transient gestures)
 *        ──createCameraBinding()► ICameraBinding — Camera drives it
 *        ──tick(dt)─────────────► advance backend animation; the engine owns the only rAF (G3)
 * ```
 *
 * Durable content reaches the backend through {@link SpecProjector}, driven by
 * `specs:flush` from the store — the renderer is a projection of state, not a
 * thing that gets told what to draw (`docs/renderer-split-design.md` §2, §4).
 *
 * ## What is deliberately *not* here
 *
 * - **`applyView` / `applyData`.** An earlier draft of this seam had the
 *   orchestrator pushing view and data deltas at the renderer. P2 replaced that
 *   with spec state + `specs:flush`, so those methods described a flow that no
 *   longer exists. They are gone rather than left as decoration.
 * - **Input.** A renderer emits `input:*` onto the shared `CanvasEventBus`; it
 *   is not a member of this interface. There is exactly one bus, so the seam
 *   stays one-way: devices out, input published on the bus.
 * - **Picking.** Interaction, not drawing (design D5) — `hit/PickingIndex` owns
 *   it, and the renderer only answers `HitGeometrySource`.
 */

import type { RendererBackend, RendererInitOptions } from '@invana/canvas-store';
import type { Camera } from '../camera/Camera';
import type { ICameraBinding } from '../camera/ICameraBinding';
import type { Rect } from '@invana/canvas-store';
import type { IOverlayDevice, OverlaySpace } from './IOverlayDevice';
import type { ISurface, SurfaceOptions, SurfaceSpace } from './ISurface';

/**
 * What a backend can and cannot do. The engine reads this to degrade rather
 * than throw — a spec kind a backend doesn't know is skipped with a
 * `capability:unsupported` event, which is what lets a second backend ship with
 * a subset (`docs/renderer-split-design.md` §4.2).
 */
export interface RendererCapabilities {
  /** How far visual effects go: none, style-level (tint/alpha), or real shaders. */
  readonly effects: 'none' | 'style' | 'shader';
  /** How text is rasterised. Drives which label features are honoured. */
  readonly textMode: 'native' | 'sdf' | 'dom';
  /** Whether {@link IRenderer.extract} is available. */
  readonly rasterExport: boolean;
  /** Whether the backend has a real depth axis (2D backends: `false`). */
  readonly depth: boolean;
  /** Spec kinds this backend can draw. Unknown kinds degrade, never throw. */
  readonly specKinds: readonly string[];
}

/** Where a renderer attaches, and the device knobs for standing it up. */
export interface RendererMountOptions extends RendererInitOptions {
  /**
   * Suppress the browser context menu on the drawing surface, so a right-click
   * can be a canvas gesture. Default `true`.
   */
  suppressBrowserContextMenu?: boolean;
  /** Track the host element's size and resize the surface to match. Default `false`. */
  autoResize?: boolean;
  /** Opaque background (`backgroundAlpha: 1`) rather than a transparent surface. */
  opaque?: boolean;
  /** GPU power hint forwarded to the backend where it has one. */
  powerPreference?: 'high-performance' | 'low-power';
}

export interface IRenderer {
  /**
   * Stand the backend up against a DOM host: create the drawing surface, attach
   * it, and build the scene root. May be async (GPU adapter acquisition); the
   * orchestrator awaits it before creating any surface. {@link backend} and
   * {@link capabilities} are meaningful only once this resolves.
   */
  mount(host: HTMLElement, opts?: RendererMountOptions): Promise<void> | void;

  /**
   * A layer's slice of the renderer — durable spec projection, transient
   * overlays, visibility and paint order. This replaces a layer constructing a
   * backend container for itself.
   */
  createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;

  /**
   * A standalone transient device not owned by any layer — a lasso, a brush
   * rectangle, a drag ghost. Behaviours use this, because a gesture overlay
   * belongs to the gesture rather than to a layer (§3, decision D3).
   */
  createOverlay(label: string, space?: OverlaySpace): IOverlayDevice;

  /**
   * The concrete viewport behind the engine's {@link Camera}. The renderer owns
   * the realisation; `Camera` owns clamping, anchored zoom, fit and the bus /
   * store sync.
   */
  createCameraBinding(): ICameraBinding;

  /**
   * Hand back the engine's `Camera` once it wraps this renderer's binding.
   * Surfaces need it (hit-floor scaling, label-raster priority), so the order is
   * `createCameraBinding` → `new Camera` → `attachCamera` → `createSurface`.
   */
  attachCamera(camera: Camera): void;

  /**
   * World-space bounds of everything drawn, or `null` when nothing is. Used by
   * `area: 'content'` export. The backend answers because only it knows what is
   * actually mounted.
   */
  worldContentBounds(): Rect | null;

  /** The drawing surface, when there is one. `null` on a headless backend. */
  readonly canvasElement: HTMLCanvasElement | null;

  /** Viewport size changed (CSS px). */
  resize(width: number, height: number): void;

  /**
   * Advance backend-owned animation and **present the frame**.
   *
   * The engine owns the only `requestAnimationFrame` (G3) and calls this once
   * per frame, after advancing the camera, flushing data and updating layers. A
   * renderer must **not** schedule frames of its own: two clocks disagree about
   * frame order, and a test can't drive time by hand.
   */
  tick(dtMs: number): void;


  /**
   * Raster capture, capability-gated by {@link RendererCapabilities.rasterExport}
   * (G1). Vector/SVG export is engine-side and spec-driven, so it is *not* here —
   * it works on every backend including headless.
   */
  extract?(opts: {
    /** World-space region to capture. */
    region: Rect;
    /** Output pixels per world unit. */
    resolution: number;
  }): HTMLCanvasElement;

  /** Tear down: release the backend, the DOM surface, and every listener. */
  destroy(): void;

  /** The backend actually resolved at {@link mount} (may differ from the preference). */
  readonly backend: RendererBackend;

  /** What this backend supports. Read after {@link mount}. */
  readonly capabilities: RendererCapabilities;
}
