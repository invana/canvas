import type { Point, Bounds } from '../types/canvas.js';

/**
 * Options for animated camera transitions.
 * All fields are optional — omit any axis or scale to keep it unchanged.
 */
export interface CameraAnimationOptions {
  /** Target world-space X position to pan to */
  x?: number;
  /** Target world-space Y position to pan to */
  y?: number;
  /** Target zoom scale (1.0 = 100%) */
  scale?: number;
  /** Animation duration in milliseconds (default: 300) */
  duration?: number;
  /** Easing function name, e.g. `'linear'`, `'easeInOut'` (default: `'easeInOut'`) */
  ease?: string;
}

/**
 * CameraAPI — the only camera interface exposed publicly.
 * Concrete implementation wraps pixi-viewport internally.
 *
 * Access via `canvas.camera`.
 *
 * @example
 * ```ts
 * canvas.camera.panTo(100, 200);
 * canvas.camera.zoom(1.5);
 * canvas.camera.fitContent(50);
 * ```
 */
export interface CameraAPI {
  /** Current world-space X position of the camera (top-left corner of viewport) */
  readonly x: number;
  /** Current world-space Y position of the camera (top-left corner of viewport) */
  readonly y: number;
  /** Current zoom scale. `1.0` = 100%, `2.0` = 200% (zoomed in) */
  readonly scale: number;

  /**
   * Pan the camera by a relative offset.
   * @param deltaX - Horizontal offset in world-space pixels
   * @param deltaY - Vertical offset in world-space pixels
   */
  pan(deltaX: number, deltaY: number): void;

  /**
   * Pan the camera so the given world-space point is centered in the viewport.
   * @param worldX - Target world-space X
   * @param worldY - Target world-space Y
   */
  panTo(worldX: number, worldY: number): void;

  /**
   * Set zoom scale relative to the current zoom.
   * @param scale - Multiplier applied to the current zoom level
   */
  zoom(scale: number): void;

  /**
   * Set an absolute zoom level, optionally around a screen-space center point.
   * @param scale - Absolute zoom (1.0 = 100%)
   * @param center - Screen-space point to zoom around (defaults to viewport center)
   */
  zoomTo(scale: number, center?: Point): void;

  /**
   * Fit all visible content into the viewport.
   * @param padding - Extra padding around the content bounds in world-space pixels
   */
  fitContent(padding?: number): void;

  /**
   * Convert screen-space coordinates to world-space coordinates.
   * @param screenX - X relative to the canvas element
   * @param screenY - Y relative to the canvas element
   */
  toWorld(screenX: number, screenY: number): Point;

  /**
   * Convert world-space coordinates to screen-space coordinates.
   * @param worldX - X in world space
   * @param worldY - Y in world space
   */
  toScreen(worldX: number, worldY: number): Point;

  /** Reset camera to origin at scale 1.0 */
  reset(): void;

  /**
   * Animate the camera to a target position and/or scale.
   * @param options - Target state and animation parameters
   */
  animate(options: CameraAnimationOptions): void;

  /** Get the current world-space bounding box visible in the viewport */
  getBounds(): Bounds;
}
