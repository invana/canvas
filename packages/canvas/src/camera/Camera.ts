/**
 * `Camera` — the engine's pan/zoom/projection facade.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.camera) and
 * §2.6 (camera input is a Behaviour, not a hard-coded gesture).
 *
 * **Design notes**
 *
 * - **No backend type crosses this class.** The concrete viewport lives behind
 *   {@link ICameraBinding} — `PixiViewportBinding` today, an orthographic
 *   three.js camera later. Camera owns the *semantics* (clamping, anchored zoom,
 *   fit-to-rect, bus events, store sync); the binding owns the realisation
 *   (`docs/renderer-split-design.md` §9, P5/P6).
 * - The Camera owns no input gestures — those live in opt-in camera-input
 *   `Behaviour`s (proposal §2.6). They configure inputs through
 *   {@link Camera.configureInput} / {@link Camera.setDragSuspended} /
 *   {@link Camera.onDragStart}, described semantically (`percent`, `modifier`),
 *   so a behaviour never names a plugin.
 * - The **binding is the single source of truth** for the transform: Camera
 *   reads it back rather than caching, so a gesture driven inside the backend
 *   and a programmatic `pan()` can't drift apart.
 * - Coordinate model (uniform scale, no rotation):
 *
 *     screen.x = world.x * scale + tx
 *     screen.y = world.y * scale + ty
 *     world.x  = (screen.x - tx) / scale
 *     world.y  = (screen.y - ty) / scale
 *
 *   We deliberately keep `scale.x === scale.y` (no anisotropic zoom) and no
 *   rotation. Both are enforceable as needed.
 *
 * - Events are emitted on the canvas-wide `CanvasEventBus`:
 *   `camera:zoom`, `camera:pan`. They flow through the tap channel so
 *   telemetry sees every camera change.
 */

import { select, type CanvasEventBus, type CanvasStore } from '@invana/canvas-store';
import type { Point, Rect } from '../specs/geometry';
import type {
  CameraInputConfig,
  CameraTransformValue,
  ICameraBinding,
} from './ICameraBinding';

export type { Point, Rect };
export type {
  CameraInputConfig,
  CameraInputModifier,
  DragInputOptions,
  PinchInputOptions,
  WheelInputOptions,
} from './ICameraBinding';

/** An absolute camera transform — world (0,0) at `(x, y)` screen px, uniform `zoom`. */
export type CameraTransform = CameraTransformValue;

export interface CameraOptions {
  /**
   * The renderer's viewport, behind the pixi-free {@link ICameraBinding} seam.
   * Created by the renderer (`Canvas` wires `PixiViewportBinding` today).
   */
  binding: ICameraBinding;
  /** Initial viewport size in CSS pixels. Mirrors the binding's own screen size for projection math. */
  screenWidth: number;
  screenHeight: number;
  /** Optional bus for `input:camera:zoom` / `input:camera:pan` events. */
  bus?: CanvasEventBus;
  /**
   * Optional kernel store. When present, the camera keeps
   * `store.view.interaction.camera` (the abstract `{x,y,zoom}` transform) in sync
   * with the binding **both ways** — gestures/mutators push into the store,
   * and external `actions.camera.*` writes apply to the binding.
   */
  store?: CanvasStore;
  /** Initial uniform scale. Default 1. */
  initialScale?: number;
  /** Initial world-container offset (= where world (0,0) lives in screen pixels). Default (0,0). */
  initialX?: number;
  initialY?: number;
  /** Min / max zoom clamp. Defaults: 0.01 .. 100. */
  minScale?: number;
  maxScale?: number;
}

export class Camera {
  /**
   * The renderer's viewport, behind the pixi-free binding seam. **Private** —
   * nothing outside this class reaches the backend, which is what lets P6 move
   * the realisation into `@invana/renderer-pixijs` without a public break.
   */
  private readonly binding: ICameraBinding;

  private readonly bus?: CanvasEventBus;

  private _screenWidth: number;
  private _screenHeight: number;
  private readonly _minScale: number;
  private readonly _maxScale: number;

  /** Kernel store (optional) — the home of the abstract `interaction.camera` transform. */
  private readonly store?: CanvasStore;
  /** Re-entrancy guard so binding↔store sync never ping-pongs. */
  private _syncing = false;
  /** Unsubscribe for the `interaction.camera` slice subscription. */
  private _offStoreCam?: () => void;
  /** Unsubscribe for the binding's backend-driven transform reports. */
  private _offBindingChange?: () => void;
  /** Whether drag-panning is currently yielded to another gesture owner. */
  private _dragSuspended = false;

  constructor(opts: CameraOptions) {
    this.binding = opts.binding;
    this.bus = opts.bus;
    this.store = opts.store;
    this._screenWidth = opts.screenWidth;
    this._screenHeight = opts.screenHeight;
    this._minScale = opts.minScale ?? 0.01;
    this._maxScale = opts.maxScale ?? 100;

    this.binding.setTransform({
      x: opts.initialX ?? 0,
      y: opts.initialY ?? 0,
      zoom: this.clampScale(opts.initialScale ?? 1),
    });

    // Bridge backend-driven transform changes to the canvas bus. Without this,
    // interactive pan/zoom (drag, wheel, pinch, momentum — all driven inside the
    // backend) never reaches `camera:pan` / `camera:zoom` listeners, because
    // those mutations bypass Camera's typed mutators. Changes Camera itself
    // makes are not reported back, so there's no double-emit.
    this._offBindingChange = this.binding.onTransformChange((kind) => {
      const t = this.binding.getTransform();
      if (kind === 'zoom') {
        this.bus?.emit('input:camera:zoom', {
          scale: t.zoom,
          centerX: this._screenWidth / 2,
          centerY: this._screenHeight / 2,
        });
      }
      this.bus?.emit('input:camera:pan', { x: t.x, y: t.y });
      this.pushToStore();
    });

    // Bidirectional bind to `store.view.interaction.camera`: seed it from the
    // initial transform, then apply any external `actions.camera.*` write back
    // onto the binding (the `_syncing` guard breaks the feedback loop).
    if (this.store) {
      this.pushToStore();
      const cameraSlice = select(this.store.view, (s) => s.interaction.camera);
      this._offStoreCam = cameraSlice.subscribe(() => this.applyFromStore());
    }
  }

  /**
   * Push the current transform into `store.view.interaction.camera`. Called from
   * every camera mutation (gesture + programmatic). No-op when the store already
   * matches or a store→binding apply is in flight.
   */
  private pushToStore(): void {
    if (!this.store || this._syncing) return;
    const { x, y, zoom } = this.binding.getTransform();
    const cur = this.store.view.getState().interaction.camera;
    if (cur.x === x && cur.y === y && cur.zoom === zoom) return;
    this._syncing = true;
    try {
      this.store.actions.camera.set({ x, y, zoom });
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Apply `store.view.interaction.camera` onto the binding — realises an external
   * `actions.camera.*` write. No-op when the binding already matches or a
   * binding→store push is in flight.
   */
  private applyFromStore(): void {
    if (!this.store || this._syncing) return;
    const c = this.store.view.getState().interaction.camera;
    const cur = this.binding.getTransform();
    if (cur.x === c.x && cur.y === c.y && cur.zoom === c.zoom) return;
    this._syncing = true;
    try {
      this.binding.setTransform({ x: c.x, y: c.y, zoom: this.clampScale(c.zoom) });
    } finally {
      this._syncing = false;
    }
  }

  // ─── Read accessors ──────────────────────────────────────────────────────

  /** Current uniform scale. */
  get scale(): number {
    return this.binding.getTransform().zoom;
  }

  /** Current world-container x in screen pixels. (Where world (0,0) sits.) */
  get x(): number {
    return this.binding.getTransform().x;
  }

  get y(): number {
    return this.binding.getTransform().y;
  }

  get screenWidth(): number {
    return this._screenWidth;
  }

  get screenHeight(): number {
    return this._screenHeight;
  }

  // ─── Mutators ────────────────────────────────────────────────────────────

  /**
   * Set absolute world-container offset. `(x, y)` is where world (0,0) lives
   * in screen pixels. Most consumers want `pan(dx, dy)` instead.
   */
  setPosition(x: number, y: number): void {
    const cur = this.binding.getTransform();
    if (x === cur.x && y === cur.y) return;
    this.binding.setTransform({ x, y, zoom: cur.zoom });
    this.bus?.emit('input:camera:pan', { x, y });
    this.pushToStore();
  }

  /** Pan by `(dx, dy)` screen pixels. */
  pan(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    this.setPosition(this.x + dx, this.y + dy);
  }

  /**
   * Write an absolute `{ x, y, zoom }` transform in one step — the seam for a
   * layer mirroring an **external** camera authority (a MapLibre basemap, a
   * remote collaborator's viewport, a replayed session).
   *
   * Unlike `setZoom` + `setPosition`, this re-anchors nothing: the transform
   * lands exactly as given, because the external authority has already solved
   * for it and any re-anchoring here would desync the two views. `zoom` is
   * emitted only when it actually changed — most mirrored gestures are pan-only
   * and the `input:camera:zoom` listeners are O(N) over their tracked elements.
   *
   * @param t      The transform to apply.
   * @param opts.clamp  Apply the camera's min/max zoom clamp. Default `true`.
   *   Pass `false` when mirroring an authority with its own scale range — a web
   *   mercator basemap runs to `2 ** 22`, far past the camera's default ceiling
   *   of 100, and clamping would silently peg the canvas away from the map.
   */
  setTransform(t: CameraTransform, opts?: { clamp?: boolean }): void {
    const zoom = opts?.clamp === false ? t.zoom : this.clampScale(t.zoom);
    const cur = this.binding.getTransform();
    const zoomChanged = zoom !== cur.zoom;
    if (!zoomChanged && t.x === cur.x && t.y === cur.y) return;

    this.binding.setTransform({ x: t.x, y: t.y, zoom });

    if (zoomChanged) {
      this.bus?.emit('input:camera:zoom', {
        scale: zoom,
        centerX: this._screenWidth / 2,
        centerY: this._screenHeight / 2,
      });
    }
    this.bus?.emit('input:camera:pan', { x: t.x, y: t.y });
    this.pushToStore();
  }

  /**
   * Set absolute scale, anchored at the viewport centre. The world point at
   * the centre stays put. For zoom-around-an-arbitrary-point semantics use
   * `zoomAt`.
   */
  setZoom(scale: number): void {
    const next = this.clampScale(scale);
    if (next === this.scale) return;
    this.binding.zoomToCentre(next);
    this.bus?.emit('input:camera:zoom', {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2,
    });
    this.bus?.emit('input:camera:pan', { x: this.x, y: this.y });
    this.pushToStore();
  }

  /**
   * Multiply scale by `factor`, holding the world point under the screen
   * cursor `(centerX, centerY)` in place. Default centre = viewport centre.
   *
   * Bindings offer only centre-anchored zoom, so the arbitrary-anchor math is
   * done here: project the anchor to world, change scale, then translate so the
   * same world point lands at the same screen point.
   */
  zoomAt(
    factor: number,
    centerX: number = this._screenWidth / 2,
    centerY: number = this._screenHeight / 2,
  ): void {
    const before = this.toWorld(centerX, centerY);
    const nextScale = this.clampScale(this.scale * factor);
    if (nextScale === this.scale) return;
    this.binding.setTransform({
      x: centerX - before.x * nextScale,
      y: centerY - before.y * nextScale,
      zoom: nextScale,
    });
    this.bus?.emit('input:camera:zoom', { scale: nextScale, centerX, centerY });
    this.bus?.emit('input:camera:pan', { x: this.x, y: this.y });
    this.pushToStore();
  }

  /**
   * Fit a world-space rectangle into the viewport. Scales so the whole rect
   * is visible (limited by the smaller axis), centres it. `padding` is in
   * screen pixels around the rect.
   */
  fitContent(worldRect: Rect | null | undefined, padding = 24): void {
    // `null` means "nothing to measure" — an empty graph, or a layer whose
    // renderer hasn't mounted. Fitting to a zero rect would produce a nonsense
    // camera, so the honest response is to leave the view alone. Accepting it
    // here keeps the null-check out of every call site
    // (`docs/renderer-split-design.md` D3).
    if (!worldRect) return;
    const availW = Math.max(1, this._screenWidth - padding * 2);
    const availH = Math.max(1, this._screenHeight - padding * 2);
    const scaleX = availW / Math.max(1, worldRect.width);
    const scaleY = availH / Math.max(1, worldRect.height);
    const next = this.clampScale(Math.min(scaleX, scaleY));

    const cx = worldRect.x + worldRect.width / 2;
    const cy = worldRect.y + worldRect.height / 2;
    const tx = this._screenWidth / 2 - cx * next;
    const ty = this._screenHeight / 2 - cy * next;

    this.binding.setTransform({ x: tx, y: ty, zoom: next });

    this.bus?.emit('input:camera:zoom', {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2,
    });
    this.bus?.emit('input:camera:pan', { x: tx, y: ty });
    this.pushToStore();
  }

  /**
   * Centre the viewport on a world-space point — pan so `(worldX, worldY)`
   * maps to the screen centre, keeping the current zoom. The pan-only
   * counterpart to {@link fitContent}: use it for "focus" / "go to" actions
   * that should locate a target without rescaling the view.
   */
  centerOn(worldX: number, worldY: number): void {
    const scale = this.scale;
    const tx = this._screenWidth / 2 - worldX * scale;
    const ty = this._screenHeight / 2 - worldY * scale;
    this.binding.setTransform({ x: tx, y: ty, zoom: scale });
    this.bus?.emit('input:camera:pan', { x: tx, y: ty });
    this.pushToStore();
  }

  /** Update on viewport resize. Forwarded so the binding's own math stays correct. */
  resize(screenWidth: number, screenHeight: number): void {
    this._screenWidth = screenWidth;
    this._screenHeight = screenHeight;
    this.binding.resize(screenWidth, screenHeight);
  }

  // ─── Projection ──────────────────────────────────────────────────────────

  /** Screen → world. */
  toWorld(screenX: number, screenY: number): Point {
    return this.binding.toWorld(screenX, screenY);
  }

  /** World → screen. */
  toScreen(worldX: number, worldY: number): Point {
    return this.binding.toScreen(worldX, worldY);
  }

  /**
   * The world-space rectangle currently visible. Used by viewport culling
   * (per `decorations-plan.md` §11.6) and minimap layers.
   */
  getVisibleBounds(): Rect {
    return this.binding.getVisibleBounds();
  }

  // ─── Input configuration ─────────────────────────────────────────────────

  /**
   * Configure the camera's own pan / zoom inputs. This is the seam camera-input
   * behaviours use instead of naming a backend plugin: the options are described
   * semantically (`percent`, `modifier`) and the realisation lives in the
   * binding, so `DragPanBehaviour` / `WheelZoomBehaviour` / `PinchZoomBehaviour`
   * survive the renderer swap unchanged.
   *
   * Patch semantics — an omitted key is left alone, `null` removes that input:
   *
   * ```ts
   * camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
   * camera.configureInput({ wheel: null });   // wheel zoom off, pinch untouched
   * ```
   *
   * Re-configuring an already-installed input replaces it, because the
   * underlying inputs read their config only at install time.
   */
  configureInput(config: CameraInputConfig): void {
    if (config.drag !== undefined) this._dragSuspended = false;
    this.binding.configureInput(config);
  }

  /**
   * Suspend / restore drag-panning without tearing the input down. This is how
   * gesture arbitration yields the camera: while another behaviour owns the
   * pointer (a node drag, a lasso, a resize) panning is suspended, and it
   * resumes when that gesture releases.
   *
   * Momentum is deliberately left running, so an in-flight glide finishes as it
   * always has. Edge-triggered — restoring resets the underlying input, so a
   * repeated call in the same state is a no-op.
   */
  setDragSuspended(suspended: boolean): void {
    if (suspended === this._dragSuspended) return;
    this._dragSuspended = suspended;
    this.binding.setDragSuspended(suspended);
  }

  /**
   * Subscribe to the start of a drag-pan gesture — fired once the pointer has
   * actually moved enough to pan. `DragPanBehaviour` uses it as the cursor
   * fallback for the `space` modifier, which can't be read off a pointer event.
   *
   * @returns an unsubscribe function.
   */
  onDragStart(fn: () => void): () => void {
    return this.binding.onDragStart(fn);
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  /**
   * Advance time-based input animation (momentum, snap). Called by
   * `Canvas.tickOnce()` every frame — the engine owns the only clock (G3).
   * No-op until a camera-input behaviour enables an input that animates.
   */
  tick(dt: number): void {
    this.binding.tick(dt);
  }

  /** Tear down subscriptions. Called by `Canvas.destroy`. */
  dispose(): void {
    this._offStoreCam?.();
    this._offStoreCam = undefined;
    this._offBindingChange?.();
    this._offBindingChange = undefined;
  }

  private clampScale(scale: number): number {
    if (scale < this._minScale) return this._minScale;
    if (scale > this._maxScale) return this._maxScale;
    return scale;
  }
}
