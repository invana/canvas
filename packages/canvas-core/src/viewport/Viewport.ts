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

  /** Current zoom level - use `scaled` property from pixi-viewport or this alias */
  get zoomLevel(): number {
    return this.scaled;
  }

  set zoomLevel(value: number) {
    this.setZoom(value, true);
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
   * Pan to a specific position
   */
  panTo(x: number, y: number): void {
    this.moveCorner(-x / this.scaled, -y / this.scaled);
  }

  /**
   * Pan by a delta
   */
  panBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
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
   * Fit content within the viewport
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

    // Center on content
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    this.moveCenter(centerX, centerY);
  }

  /**
   * Get the visible world bounds (what's currently on screen)
   */
  getVisibleWorldBounds(): Rectangle {
    return this.getVisibleBounds();
  }

  // =========================================================================
  // COORDINATE CONVERSION
  // These override pixi-viewport methods to return simple objects
  // =========================================================================

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
