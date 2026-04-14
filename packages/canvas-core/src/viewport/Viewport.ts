/**
 * Viewport
 * 
 * Manages pan and zoom for the canvas using pixi-viewport.
 * Provides a wrapper around pixi-viewport with a consistent API.
 * 
 * ## Features
 * 
 * - Mouse wheel zoom with configurable sensitivity
 * - Pan via mouse drag with momentum (decelerate)
 * - Pinch-to-zoom on touch devices
 * - Zoom constraints (min/max)
 * - World/screen coordinate conversion
 * - Visible bounds calculation
 * 
 * @example
 * ```typescript
 * const viewport = new Viewport({
 *   width: 800,
 *   height: 600,
 *   minZoom: 0.1,
 *   maxZoom: 5,
 *   events: app.renderer.events,
 * });
 * 
 * // Add content to the viewport
 * viewport.addChild(myContent);
 * 
 * // Pan and zoom programmatically
 * viewport.panTo(100, 200);
 * viewport.zoomTo(1.5);
 * viewport.fitContent();
 * ```
 */

import { Viewport as PixiViewport } from 'pixi-viewport';
import type { EventSystem, Rectangle } from 'pixi.js';

// =============================================================================
// Animation Types
// =============================================================================

/**
 * Animation timing for viewport transitions.
 * - `false`  — instant, no animation
 * - `true`   — default animation ({ duration: 500, easing: 'ease-in' })
 * - object   — custom duration and/or easing
 */
export type ViewportAnimationEffectTiming =
  | boolean
  | {
      /** Duration in milliseconds. Default: 500 */
      duration?: number;
      /** CSS-style easing. Default: 'ease-in' */
      easing?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
    };

interface ResolvedAnimation {
  duration: number;
  easing: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
}

const DEFAULT_ANIMATION: ResolvedAnimation = { duration: 500, easing: 'ease-in' };

export interface ViewportOptions {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Initial zoom level */
  initialZoom?: number;
  /** Initial pan X */
  initialX?: number;
  /** Initial pan Y */
  initialY?: number;
  /** Enable mouse wheel zoom */
  wheelZoom?: boolean;
  /** Enable drag to pan */
  dragPan?: boolean;
  /** Zoom sensitivity (higher = faster zoom) */
  zoomSensitivity?: number;
  /** World width (for clamping) */
  worldWidth?: number;
  /** World height (for clamping) */
  worldHeight?: number;
  /** PixiJS event system - required for pixi-viewport */
  events: EventSystem;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Viewport class wrapping pixi-viewport for pan/zoom functionality.
 * 
 * This extends pixi-viewport directly to provide seamless integration
 * while adding convenience methods matching our API.
 */
export class Viewport extends PixiViewport {
  private _viewWidth: number;
  private _viewHeight: number;
  private _animationFrame: number | null = null;

  constructor(options: ViewportOptions) {
    super({
      screenWidth: options.width,
      screenHeight: options.height,
      worldWidth: options.worldWidth ?? options.width * 10,
      worldHeight: options.worldHeight ?? options.height * 10,
      events: options.events,
      passiveWheel: false,
      stopPropagation: true,
    });

    this._viewWidth = options.width;
    this._viewHeight = options.height;

    // Enable plugins based on options
    if (options.dragPan !== false) {
      this.drag({
        mouseButtons: 'left',
        pressDrag: true,
      });
    }

    if (options.wheelZoom !== false) {
      this.wheel({
        smooth: 3,
        percent: options.zoomSensitivity ?? 0.02,
      });
    }

    // Enable pinch-to-zoom on touch devices
    this.pinch();

    // Add decelerate for smooth panning
    this.decelerate();

    // Always set zoom constraints to prevent losing nodes
    this.clampZoom({
      minScale: options.minZoom ?? 0.02,
      maxScale: options.maxZoom ?? 5,
    });

    // Set initial position and zoom
    if (options.initialZoom !== undefined) {
      this.setZoom(options.initialZoom, true);
    }

    if (options.initialX !== undefined || options.initialY !== undefined) {
      this.moveCenter(
        options.initialX ?? this._viewWidth / 2,
        options.initialY ?? this._viewHeight / 2
      );
    }
  }

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  /** View width in screen pixels */
  get viewWidth(): number {
    return this._viewWidth;
  }

  /** View height in screen pixels */
  get viewHeight(): number {
    return this._viewHeight;
  }

  /** Current zoom level */
  get zoomLevel(): number {
    return this.scaled;
  }

  set zoomLevel(value: number) {
    this.setZoom(value, true);
  }

  /**
   * Raw viewport pan offset X (screen-space position of the world origin).
   * Useful for reading the current animation start state.
   */
  get panX(): number {
    return this.x;
  }

  /**
   * Raw viewport pan offset Y (screen-space position of the world origin).
   * Useful for reading the current animation start state.
   */
  get panY(): number {
    return this.y;
  }

  /** Get current viewport state */
  get state(): ViewportState {
    return {
      x: this.x,
      y: this.y,
      zoom: this.scaled,
    };
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Resize the viewport
   */
  resize(width: number, height: number, worldWidth?: number, worldHeight?: number): void {
    this._viewWidth = width;
    this._viewHeight = height;
    super.resize(width, height, worldWidth, worldHeight);
  }

  /**
   * Pan so that world position (worldX, worldY) is visible at the top-left corner.
   */
  panTo(worldX: number, worldY: number): void {
    this.moveCorner(worldX, worldY);
  }

  /**
   * Pan by a screen-space delta.
   */
  panBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Set the raw viewport transform (pan offset + zoom) in one call.
   * Use this for smooth animation — it bypasses pixi-viewport plugin
   * constraints so the caller is responsible for valid values.
   *
   * panX / panY are the screen-space offsets of the world origin:
   *   panX = screenWidth  / 2 - worldX * zoom  → centers worldX
   *   panY = screenHeight / 2 - worldY * zoom  → centers worldY
   */
  setViewportTransform(panX: number, panY: number, zoom: number): void {
    this.x = panX;
    this.y = panY;
    this.scale.set(zoom);
  }

  /**
   * Fit all world content in the viewport (zoom-to-fit everything).
   * Delegates to the pixi-viewport fitWorld plugin.
   */
  fitWorld(noClamp = false): this {
    return super.fitWorld(noClamp) as this;
  }

  /**
   * Zoom to a specific level, optionally centered on a point
   */
  zoomTo(level: number, centerX?: number, centerY?: number): void {
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom toward the specified screen point
      const worldPoint = this.toWorld(centerX, centerY);
      this.setZoom(level, true);
      // Re-center on the same world point
      const newScreenPoint = this.toScreen(worldPoint.x, worldPoint.y);
      this.x += centerX - newScreenPoint.x;
      this.y += centerY - newScreenPoint.y;
    } else {
      this.setZoom(level, true);
    }
  }

  /**
   * Zoom by a factor
   */
  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    this.zoomTo(this.scaled * factor, centerX, centerY);
  }

  /**
   * Reset to initial view (center, zoom 1)
   */
  reset(): void {
    this.setZoom(1, true);
    this.moveCenter(0, 0);
  }

  /**
   * Center the viewport on a world position
   */
  centerOn(worldX: number, worldY: number): void {
    this.moveCenter(worldX, worldY);
  }

  /**
   * Fit all children (the full scene) within the viewport, optionally with padding.
   * Uses pixi-viewport's getLocalBounds which returns world-space bounds.
   */
  fitContent(padding: number = 50): void {
    const bounds = this.getLocalBounds();
    if (bounds.width === 0 || bounds.height === 0) return;

    const availableWidth = this._viewWidth - padding * 2;
    const availableHeight = this._viewHeight - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const newZoom = Math.min(scaleX, scaleY);

    this.setZoom(newZoom, true);

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    this.moveCenter(centerX, centerY);
  }

  /**
   * Fit a specific world-space bounding box in the viewport with padding.
   * Useful for focusing on a subset of content (e.g. selected elements).
   *
   * @param bounds   - World-space bounding box { x, y, width, height }
   * @param padding  - Padding in screen pixels around the bounds (default 50)
   * @param animation - Optional animation timing (default: instant)
   */
  fitBounds(
    bounds: { x: number; y: number; width: number; height: number },
    padding: number = 50,
    animation?: ViewportAnimationEffectTiming,
  ): void {
    if (bounds.width === 0 && bounds.height === 0) return;

    const safeWidth  = Math.max(bounds.width,  1);
    const safeHeight = Math.max(bounds.height, 1);
    const targetZoom = Math.min(
      (this._viewWidth  - padding * 2) / safeWidth,
      (this._viewHeight - padding * 2) / safeHeight,
    );
    const centerX = bounds.x + bounds.width  / 2;
    const centerY = bounds.y + bounds.height / 2;
    const targetX = this._viewWidth  / 2 - centerX * targetZoom;
    const targetY = this._viewHeight / 2 - centerY * targetZoom;

    this._animateTo(targetX, targetY, targetZoom, animation);
  }

  /**
   * Center the viewport on a world-space point, keeping the current zoom level.
   * Optionally animated.
   *
   * @param worldX    - World X coordinate to center on
   * @param worldY    - World Y coordinate to center on
   * @param animation - Optional animation timing (default: instant)
   */
  centerOnWorld(
    worldX: number,
    worldY: number,
    animation?: ViewportAnimationEffectTiming,
  ): void {
    const zoom    = this.scaled;
    const targetX = this._viewWidth  / 2 - worldX * zoom;
    const targetY = this._viewHeight / 2 - worldY * zoom;
    this._animateTo(targetX, targetY, zoom, animation);
  }

  // =========================================================================
  // ANIMATION INTERNALS
  // =========================================================================

  /**
   * Animate (or instantly jump) the viewport to the given raw pan + zoom values.
   *
   * panX / panY are the screen-space position of the world origin:
   *   panX = viewWidth  / 2 - worldX * zoom  → centers worldX
   *   panY = viewHeight / 2 - worldY * zoom  → centers worldY
   */
  private _animateTo(
    targetX: number,
    targetY: number,
    targetZoom: number,
    animation?: ViewportAnimationEffectTiming,
  ): void {
    if (this._animationFrame !== null) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    const anim = this._resolveAnimation(animation);

    if (anim === false) {
      this.setViewportTransform(targetX, targetY, targetZoom);
      return;
    }

    const startTime = performance.now();
    const startX    = this.x;
    const startY    = this.y;
    const startZoom = this.scaled;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / anim.duration, 1);
      const t        = this._applyEasing(progress, anim.easing);

      this.setViewportTransform(
        startX    + (targetX    - startX)    * t,
        startY    + (targetY    - startY)    * t,
        startZoom + (targetZoom - startZoom) * t,
      );

      this._animationFrame = progress < 1 ? requestAnimationFrame(tick) : null;
    };

    this._animationFrame = requestAnimationFrame(tick);
  }

  /** Resolve ViewportAnimationEffectTiming to a concrete config or false. */
  private _resolveAnimation(
    animation: ViewportAnimationEffectTiming | undefined,
  ): ResolvedAnimation | false {
    if (animation === false) return false;
    if (animation === true || animation === undefined) return { ...DEFAULT_ANIMATION };
    return {
      duration: animation.duration ?? DEFAULT_ANIMATION.duration,
      easing:   animation.easing   ?? DEFAULT_ANIMATION.easing,
    };
  }

  /** Apply a CSS-compatible easing to a linear progress value in [0, 1]. */
  private _applyEasing(t: number, easing: ResolvedAnimation['easing']): number {
    switch (easing) {
      case 'linear':    return t;
      case 'ease-in':   return t * t * t;
      case 'ease-out':  return 1 - Math.pow(1 - t, 3);
      case 'ease-in-out':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default: return t;
    }
  }

  // =========================================================================
  // COORDINATE CONVERSION
  // These override pixi-viewport methods to return simple objects
  // =========================================================================

  /**
   * Get the currently visible world-space bounds (what is on screen right now).
   */
  getVisibleWorldBounds(): Rectangle {
    return this.getVisibleBounds();
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const point = super.toWorld(screenX, screenY);
    return { x: point.x, y: point.y };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const point = super.toScreen(worldX, worldY);
    return { x: point.x, y: point.y };
  }
}
