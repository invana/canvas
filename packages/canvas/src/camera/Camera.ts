/**
 * `Camera` — pan/zoom/projection facade over a `pixi-viewport` `Viewport`.
 *
 * Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.camera) and
 * §2.6 (camera input is a Behaviour, not a hard-coded gesture).
 *
 * **Design notes**
 *
 * - The Camera owns no input gestures — those live in opt-in camera-input
 *   `Behaviour`s (proposal §2.6) which reach for `viewport.drag()`,
 *   `viewport.wheel()`, etc. via the `viewport` accessor on this class.
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
import type { CanvasEventBus } from '../events/CanvasEventBus';

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
  /** Optional bus for `camera:zoom` / `camera:pan` events. */
  bus?: CanvasEventBus;
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

  constructor(opts: CameraOptions) {
    this.viewport = opts.viewport;
    this.bus = opts.bus;
    this._screenWidth = opts.screenWidth;
    this._screenHeight = opts.screenHeight;
    this._minScale = opts.minScale ?? 0.01;
    this._maxScale = opts.maxScale ?? 100;

    const initialScale = this.clampScale(opts.initialScale ?? 1);
    this.viewport.scale.set(initialScale);
    this.viewport.position.set(opts.initialX ?? 0, opts.initialY ?? 0);
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
    this.bus?.emit('camera:pan', { x, y });
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
    this.bus?.emit('camera:zoom', {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2,
    });
    this.bus?.emit('camera:pan', { x: this.x, y: this.y });
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
    this.bus?.emit('camera:zoom', { scale: nextScale, centerX, centerY });
    this.bus?.emit('camera:pan', { x: this.x, y: this.y });
  }

  /**
   * Fit a world-space rectangle into the viewport. Scales so the whole rect
   * is visible (limited by the smaller axis), centres it. `padding` is in
   * screen pixels around the rect.
   */
  fitContent(worldRect: Rect, padding = 24): void {
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

    this.bus?.emit('camera:zoom', {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2,
    });
    this.bus?.emit('camera:pan', { x: tx, y: ty });
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

  // ─── Internal ────────────────────────────────────────────────────────────

  /**
   * Advance viewport plugins that animate over time (decelerate, snap, etc.).
   * Called by `Canvas.tickOnce()` every frame. No-op until a camera-input
   * behaviour enables a plugin that uses `update()`.
   */
  tick(dt: number): void {
    this.viewport.update(dt);
  }

  private clampScale(scale: number): number {
    if (scale < this._minScale) return this._minScale;
    if (scale > this._maxScale) return this._maxScale;
    return scale;
  }
}
