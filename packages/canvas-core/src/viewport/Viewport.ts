/**
 * Viewport
 * 
 * Manages pan and zoom for the canvas.
 * Wraps content in a container that handles transformations.
 * 
 * ## Features
 * 
 * - Mouse wheel zoom with configurable sensitivity
 * - Pan via mouse drag
 * - Keyboard shortcuts (fit, reset, etc.)
 * - Zoom constraints (min/max)
 * - Smooth animations
 * 
 * @example
 * ```typescript
 * const viewport = new Viewport({
 *   width: 800,
 *   height: 600,
 *   minZoom: 0.1,
 *   maxZoom: 5,
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

import { Container, FederatedPointerEvent } from 'pixi.js';

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
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export class Viewport extends Container {
  private _viewWidth: number;
  private _viewHeight: number;
  private _minZoom: number;
  private _maxZoom: number;
  private _zoomSensitivity: number;
  private _wheelZoomEnabled: boolean;
  private _dragPanEnabled: boolean;

  private _isDragging: boolean = false;
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;
  private _dragStartPosX: number = 0;
  private _dragStartPosY: number = 0;

  /** The content container - add children here */
  public readonly content: Container;

  constructor(options: ViewportOptions) {
    super();

    this._viewWidth = options.width;
    this._viewHeight = options.height;
    this._minZoom = options.minZoom ?? 0.1;
    this._maxZoom = options.maxZoom ?? 10;
    this._zoomSensitivity = options.zoomSensitivity ?? 0.001;
    this._wheelZoomEnabled = options.wheelZoom ?? true;
    this._dragPanEnabled = options.dragPan ?? true;

    // Create content container
    this.content = new Container();
    this.content.x = options.initialX ?? this._viewWidth / 2;
    this.content.y = options.initialY ?? this._viewHeight / 2;
    this.content.scale.set(options.initialZoom ?? 1);
    this.addChild(this.content);

    // Make viewport interactive
    this.eventMode = 'static';
    this.hitArea = { contains: () => true }; // Catch all events

    this.setupEventListeners();
  }

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get viewWidth(): number {
    return this._viewWidth;
  }

  get viewHeight(): number {
    return this._viewHeight;
  }

  get zoom(): number {
    return this.content.scale.x;
  }

  set zoom(value: number) {
    this.zoomTo(value);
  }

  get panX(): number {
    return this.content.x;
  }

  get panY(): number {
    return this.content.y;
  }

  get state(): ViewportState {
    return {
      x: this.content.x,
      y: this.content.y,
      zoom: this.zoom,
    };
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Resize the viewport
   */
  resize(width: number, height: number): void {
    this._viewWidth = width;
    this._viewHeight = height;
  }

  /**
   * Pan to a specific position (content container position)
   */
  panTo(x: number, y: number): void {
    this.content.x = x;
    this.content.y = y;
  }

  /**
   * Pan by a delta
   */
  panBy(dx: number, dy: number): void {
    this.content.x += dx;
    this.content.y += dy;
  }

  /**
   * Zoom to a specific level
   */
  zoomTo(level: number, centerX?: number, centerY?: number): void {
    const clampedZoom = Math.max(this._minZoom, Math.min(this._maxZoom, level));
    
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom toward the specified point
      const oldZoom = this.zoom;
      const worldX = (centerX - this.content.x) / oldZoom;
      const worldY = (centerY - this.content.y) / oldZoom;

      this.content.scale.set(clampedZoom);

      this.content.x = centerX - worldX * clampedZoom;
      this.content.y = centerY - worldY * clampedZoom;
    } else {
      // Zoom toward viewport center
      this.zoomTo(clampedZoom, this._viewWidth / 2, this._viewHeight / 2);
    }
  }

  /**
   * Zoom by a factor
   */
  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    this.zoomTo(this.zoom * factor, centerX, centerY);
  }

  /**
   * Reset to initial view (center, zoom 1)
   */
  reset(): void {
    this.content.x = this._viewWidth / 2;
    this.content.y = this._viewHeight / 2;
    this.content.scale.set(1);
  }

  /**
   * Center the viewport on a world position
   */
  centerOn(worldX: number, worldY: number): void {
    this.content.x = this._viewWidth / 2 - worldX * this.zoom;
    this.content.y = this._viewHeight / 2 - worldY * this.zoom;
  }

  /**
   * Fit content within the viewport
   */
  fitContent(padding: number = 50): void {
    const bounds = this.content.getLocalBounds();
    if (bounds.width === 0 || bounds.height === 0) return;

    const scaleX = (this._viewWidth - padding * 2) / bounds.width;
    const scaleY = (this._viewHeight - padding * 2) / bounds.height;
    const newZoom = Math.max(this._minZoom, Math.min(this._maxZoom, Math.min(scaleX, scaleY)));

    this.content.scale.set(newZoom);

    // Center content
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    this.centerOn(centerX, centerY);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  toWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.content.x) / this.zoom,
      y: (screenY - this.content.y) / this.zoom,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  toScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom + this.content.x,
      y: worldY * this.zoom + this.content.y,
    };
  }

  // =========================================================================
  // EVENT HANDLING
  // =========================================================================

  private setupEventListeners(): void {
    // Mouse wheel zoom
    this.on('wheel', this.onWheel, this);

    // Drag to pan
    this.on('pointerdown', this.onDragStart, this);
    this.on('pointermove', this.onDragMove, this);
    this.on('pointerup', this.onDragEnd, this);
    this.on('pointerupoutside', this.onDragEnd, this);
  }

  private onWheel(e: WheelEvent): void {
    if (!this._wheelZoomEnabled) return;

    e.preventDefault();

    const delta = -e.deltaY * this._zoomSensitivity;
    const factor = 1 + delta;

    // Get mouse position relative to viewport
    const rect = (e.target as HTMLElement)?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.zoomBy(factor, mouseX, mouseY);
  }

  private onDragStart(e: FederatedPointerEvent): void {
    if (!this._dragPanEnabled) return;

    // Don't pan if the event was already handled by a child (node/edge)
    if (e.defaultPrevented) return;

    // Only pan on middle mouse button or when left-click on empty space
    const isPanButton = e.button === 1 || (e.button === 0 && !e.shiftKey);
    if (!isPanButton) return;
    
    // Check if the target is the viewport itself (not a node/edge)
    // If target is not this viewport or its content, skip pan
    const target = e.target;
    if (target !== this && target !== this.content) {
      return;
    }

    this._isDragging = true;
    this._dragStartX = e.globalX;
    this._dragStartY = e.globalY;
    this._dragStartPosX = this.content.x;
    this._dragStartPosY = this.content.y;

    this.cursor = 'grabbing';
  }

  private onDragMove(e: FederatedPointerEvent): void {
    if (!this._isDragging) return;

    const dx = e.globalX - this._dragStartX;
    const dy = e.globalY - this._dragStartY;

    this.content.x = this._dragStartPosX + dx;
    this.content.y = this._dragStartPosY + dy;
  }

  private onDragEnd(_e: FederatedPointerEvent): void {
    this._isDragging = false;
    this.cursor = 'default';
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Remove all event listeners
   */
  destroy(): void {
    this.off('wheel', this.onWheel, this);
    this.off('pointerdown', this.onDragStart, this);
    this.off('pointermove', this.onDragMove, this);
    this.off('pointerup', this.onDragEnd, this);
    this.off('pointerupoutside', this.onDragEnd, this);
    super.destroy({ children: true });
  }
}
