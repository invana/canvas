/**
 * `Camera` — pan/zoom/projection facade over a `pixi-viewport` `Viewport`.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.camera) and
 * §2.6 (camera input is a Behaviour, not a hard-coded gesture).
 *
 * **Design notes**
 *
 * - The Camera owns no input gestures — those live in opt-in camera-input
 *   `Behaviour`s (proposal §2.6). They configure the camera's zoom inputs
 *   through {@link Camera.configureInput}, which keeps the `pixi-viewport`
 *   plugin vocabulary inside this class (`docs/renderer-split-design.md` §9,
 *   P5). The raw `viewport` accessor survives for the pan plugin until P6
 *   moves the binding into the renderer package.
 * - All transform math delegates to the underlying `Viewport`. Position/scale
 *   on the Viewport `Container` is the single source of truth, so Camera
 *   methods and Viewport plugins stay in sync automatically.
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

import type { Viewport } from 'pixi-viewport';
import { select, type CanvasEventBus, type CanvasStore } from '@invana/canvas-store';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A modifier key a camera input gesture can be gated on. Named semantically
 * rather than as key codes so the contract survives the renderer swap — the
 * mapping to `pixi-viewport`'s `keyToPress` codes lives in {@link Camera}.
 */
export type CameraInputModifier = 'control' | 'shift' | 'alt' | 'meta';

/** Wheel-zoom input configuration — see {@link Camera.configureInput}. */
export interface WheelInputOptions {
  /** Zoom fraction per wheel tick. Default `0.1` (10%). */
  percent?: number;
  /** Smooth-scroll frame count; `false` = instant snap. Default `false`. */
  smooth?: false | number;
  /**
   * Require this modifier to be held for the wheel to zoom, leaving plain
   * scroll to the page. `null` / omitted = no modifier.
   */
  modifier?: CameraInputModifier | null;
  /** Treat a two-finger trackpad pinch as zoom rather than scroll. Default `true`. */
  trackpadPinch?: boolean;
}

/** Pinch-zoom input configuration — see {@link Camera.configureInput}. */
export interface PinchInputOptions {
  /** Suppress the implicit pan that accompanies a pinch. Default `false`. */
  noDrag?: boolean;
  /** Zoom speed multiplier. Default `0.1`. */
  percent?: number;
}

/**
 * Patch for {@link Camera.configureInput}. An omitted key leaves that input
 * untouched; `null` removes it.
 */
export interface CameraInputConfig {
  wheel?: WheelInputOptions | null;
  pinch?: PinchInputOptions | null;
}

/** Semantic modifier → the `pixi-viewport` key codes for that physical key. */
const MODIFIER_KEYS: Record<CameraInputModifier, string[]> = {
  control: ['ControlLeft', 'ControlRight'],
  shift: ['ShiftLeft', 'ShiftRight'],
  alt: ['AltLeft', 'AltRight'],
  meta: ['MetaLeft', 'MetaRight'],
};

export interface CameraOptions {
  /**
   * The `Viewport` instance the camera transforms. Created by `Canvas` and
   * attached to `app.stage` as the world root. Camera mutates its
   * `position` / `scale` directly via Viewport's typed methods.
   */
  viewport: Viewport;
  /** Initial viewport size in CSS pixels. Mirrors the Viewport's own `screenWidth`/`screenHeight` for projection math. */
  screenWidth: number;
  screenHeight: number;
  /** Optional bus for `input:camera:zoom` / `input:camera:pan` events. */
  bus?: CanvasEventBus;
  /**
   * Optional kernel store. When present, the camera keeps
   * `store.view.interaction.camera` (the abstract `{x,y,zoom}` transform) in sync
   * with the pixi viewport **both ways** — gestures/mutators push into the store,
   * and external `actions.camera.*` writes apply to the viewport.
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
   * The underlying `pixi-viewport` `Viewport`. Public for engine internals
   * (camera-input behaviours that need `viewport.drag()` / `viewport.snap()`
   * / `viewport.animate()` etc.). Domain code should go through Camera's
   * typed methods (`pan`, `setZoom`, `toWorld`, ...) rather than touching
   * Viewport directly.
   */
  readonly viewport: Viewport;

  private readonly bus?: CanvasEventBus;

  private _screenWidth: number;
  private _screenHeight: number;
  private readonly _minScale: number;
  private readonly _maxScale: number;

  /** Kernel store (optional) — the home of the abstract `interaction.camera` transform. */
  private readonly store?: CanvasStore;
  /** Re-entrancy guard so viewport↔store sync never ping-pongs. */
  private _syncing = false;
  /** Unsubscribe for the `interaction.camera` slice subscription. */
  private _offStoreCam?: () => void;

  constructor(opts: CameraOptions) {
    this.viewport = opts.viewport;
    this.bus = opts.bus;
    this.store = opts.store;
    this._screenWidth = opts.screenWidth;
    this._screenHeight = opts.screenHeight;
    this._minScale = opts.minScale ?? 0.01;
    this._maxScale = opts.maxScale ?? 100;

    const initialScale = this.clampScale(opts.initialScale ?? 1);
    this.viewport.scale.set(initialScale);
    this.viewport.position.set(opts.initialX ?? 0, opts.initialY ?? 0);

    // Bridge pixi-viewport's plugin-driven events to the canvas bus. Without
    // this, interactive pan/zoom (drag, wheel, pinch — all driven via
    // `viewport.drag()` / `viewport.wheel()` / etc. inside camera-input
    // behaviours) never reaches `camera:pan` / `camera:zoom` listeners,
    // because plugin-driven mutations bypass Camera's typed mutators.
    // Direct `.position.set` / `.scale.set` calls from this class don't
    // trigger viewport's 'moved' / 'zoomed', so we don't double-emit.
    this.viewport.on('moved', () => {
      this.bus?.emit('input:camera:pan', { x: this.viewport.position.x, y: this.viewport.position.y });
      this.pushToStore();
    });
    this.viewport.on('zoomed', () => {
      this.bus?.emit('input:camera:zoom', {
        scale: this.viewport.scale.x,
        centerX: this._screenWidth / 2,
        centerY: this._screenHeight / 2,
      });
      this.bus?.emit('input:camera:pan', { x: this.viewport.position.x, y: this.viewport.position.y });
      this.pushToStore();
    });

    // Bidirectional bind to `store.view.interaction.camera`: seed it from the
    // initial viewport transform, then apply any external `actions.camera.*` write
    // back onto the viewport (the `_syncing` guard breaks the feedback loop).
    if (this.store) {
      this.pushToStore();
      const cameraSlice = select(this.store.view, (s) => s.interaction.camera);
      this._offStoreCam = cameraSlice.subscribe(() => this.applyFromStore());
    }
  }

  /**
   * Push the current viewport transform into `store.view.interaction.camera`.
   * Called from every camera mutation (gesture + programmatic). No-op when the
   * store already matches or a store→viewport apply is in flight.
   */
  private pushToStore(): void {
    if (!this.store || this._syncing) return;
    const x = this.viewport.position.x;
    const y = this.viewport.position.y;
    const zoom = this.viewport.scale.x;
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
   * Apply `store.view.interaction.camera` onto the viewport — realises an external
   * `actions.camera.*` write. No-op when the viewport already matches or a
   * viewport→store push is in flight. `position.set`/`scale.set` don't fire the
   * viewport's `moved`/`zoomed`, so this doesn't re-enter.
   */
  private applyFromStore(): void {
    if (!this.store || this._syncing) return;
    const c = this.store.view.getState().interaction.camera;
    if (
      this.viewport.position.x === c.x &&
      this.viewport.position.y === c.y &&
      this.viewport.scale.x === c.zoom
    ) {
      return;
    }
    this._syncing = true;
    try {
      this.viewport.scale.set(this.clampScale(c.zoom));
      this.viewport.position.set(c.x, c.y);
    } finally {
      this._syncing = false;
    }
  }

  // ─── Read accessors ──────────────────────────────────────────────────────

  /** Current uniform scale. */
  get scale(): number {
    return this.viewport.scale.x;
  }

  /** Current world-container x in screen pixels. (Where world (0,0) sits.) */
  get x(): number {
    return this.viewport.position.x;
  }

  get y(): number {
    return this.viewport.position.y;
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
    if (x === this.x && y === this.y) return;
    this.viewport.position.set(x, y);
    this.bus?.emit('input:camera:pan', { x, y });
    this.pushToStore();
  }

  /** Pan by `(dx, dy)` screen pixels. */
  pan(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    this.setPosition(this.x + dx, this.y + dy);
  }

  /**
   * Set absolute scale, anchored at the viewport centre. The world point at
   * the centre stays put. For zoom-around-an-arbitrary-point semantics use
   * `zoomAt`.
   */
  setZoom(scale: number): void {
    const next = this.clampScale(scale);
    if (next === this.scale) return;
    // `setZoom(scale, true)` keeps the world centre under the screen centre.
    this.viewport.setZoom(next, true);
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
   * Viewport has no built-in arbitrary-anchor zoom, so we do the math here:
   * project the anchor to world, change scale, then translate so the same
   * world point lands at the same screen point.
   */
  zoomAt(
    factor: number,
    centerX: number = this._screenWidth / 2,
    centerY: number = this._screenHeight / 2,
  ): void {
    const before = this.toWorld(centerX, centerY);
    const nextScale = this.clampScale(this.scale * factor);
    if (nextScale === this.scale) return;
    this.viewport.scale.set(nextScale);
    this.viewport.position.set(
      centerX - before.x * nextScale,
      centerY - before.y * nextScale,
    );
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

    this.viewport.scale.set(next);
    this.viewport.position.set(tx, ty);

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
    const scale = this.viewport.scale.x;
    const tx = this._screenWidth / 2 - worldX * scale;
    const ty = this._screenHeight / 2 - worldY * scale;
    this.viewport.position.set(tx, ty);
    this.bus?.emit('input:camera:pan', { x: tx, y: ty });
    this.pushToStore();
  }

  /** Update on viewport resize. Forwards to Viewport so its hit-area + plugin math stays correct. */
  resize(screenWidth: number, screenHeight: number): void {
    this._screenWidth = screenWidth;
    this._screenHeight = screenHeight;
    this.viewport.resize(screenWidth, screenHeight);
  }

  // ─── Projection ──────────────────────────────────────────────────────────

  /** Screen → world. */
  toWorld(screenX: number, screenY: number): Point {
    const p = this.viewport.toWorld<Point>(screenX, screenY);
    return { x: p.x, y: p.y };
  }

  /** World → screen. */
  toScreen(worldX: number, worldY: number): Point {
    const p = this.viewport.toScreen<Point>(worldX, worldY);
    return { x: p.x, y: p.y };
  }

  /**
   * The world-space rectangle currently visible. Used by viewport culling
   * (per `decorations-plan.md` §11.6) and minimap layers.
   */
  getVisibleBounds(): Rect {
    const r = this.viewport.getVisibleBounds();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }

  // ─── Input configuration ─────────────────────────────────────────────────

  /**
   * Configure the camera's own zoom inputs. This is the seam camera-input
   * behaviours use instead of reaching for `viewport.wheel()` / `viewport.pinch()`:
   * the options are described semantically (`percent`, `modifier`) and the
   * `pixi-viewport` realisation stays here, so P6 can move it into the renderer
   * package without touching `WheelZoomBehaviour` / `PinchZoomBehaviour`.
   *
   * Patch semantics — an omitted key is left alone, `null` removes that input:
   *
   * ```ts
   * camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
   * camera.configureInput({ wheel: null });   // wheel zoom off, pinch untouched
   * ```
   *
   * Re-configuring an already-installed input replaces it, because the
   * underlying plugins read their config only at install time.
   */
  configureInput(config: CameraInputConfig): void {
    if (config.wheel !== undefined) {
      this.viewport.plugins.remove('wheel');
      const w = config.wheel;
      if (w) {
        const modifier = w.modifier ?? null;
        this.viewport.wheel({
          percent: w.percent ?? 0.1,
          smooth: w.smooth ?? false,
          keyToPress: modifier ? MODIFIER_KEYS[modifier] : undefined,
          trackpadPinch: w.trackpadPinch ?? true,
        });
      }
    }
    if (config.pinch !== undefined) {
      this.viewport.plugins.remove('pinch');
      const p = config.pinch;
      if (p) {
        this.viewport.pinch({ noDrag: p.noDrag ?? false, percent: p.percent ?? 0.1 });
      }
    }
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  /**
   * Advance viewport plugins that animate over time (decelerate, snap, etc.).
   * Called by `Canvas.tickOnce()` every frame. No-op until a camera-input
   * behaviour enables a plugin that uses `update()`.
   */
  tick(dt: number): void {
    this.viewport.update(dt);
  }

  /** Tear down the store subscription. Called by `Canvas.destroy`. */
  dispose(): void {
    this._offStoreCam?.();
    this._offStoreCam = undefined;
  }

  private clampScale(scale: number): number {
    if (scale < this._minScale) return this._minScale;
    if (scale > this._maxScale) return this._maxScale;
    return scale;
  }
}
