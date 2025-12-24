/**
 * Viewport - Camera/pan/zoom management
 */

import type { Container } from 'pixi.js';
import type { Bounds, Point, Size, ViewportConfig, ViewportState } from '../types/index.js';

export class Viewport {
  private _container: Container;
  private _config: Required<ViewportConfig>;
  private _state: ViewportState = { x: 0, y: 0, zoom: 1, rotation: 0 };
  private _size: Size = { width: 800, height: 600 };
  private _changeHandlers: ((state: ViewportState) => void)[] = [];

  constructor(container: Container, config: ViewportConfig = {}) {
    this._container = container;
    this._config = {
      minZoom: config.minZoom ?? 0.1,
      maxZoom: config.maxZoom ?? 10,
      zoomStep: config.zoomStep ?? 0.1,
      panEnabled: config.panEnabled ?? true,
      zoomEnabled: config.zoomEnabled ?? true,
      rotateEnabled: config.rotateEnabled ?? false,
    };
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  configure(config: Partial<ViewportConfig>): void {
    Object.assign(this._config, config);
  }

  get config(): Required<ViewportConfig> {
    return { ...this._config };
  }

  // ============================================================================
  // State
  // ============================================================================

  get state(): ViewportState {
    return { ...this._state };
  }

  get x(): number {
    return this._state.x;
  }

  get y(): number {
    return this._state.y;
  }

  get zoom(): number {
    return this._state.zoom;
  }

  get rotation(): number {
    return this._state.rotation ?? 0;
  }

  // ============================================================================
  // Size
  // ============================================================================

  setSize(width: number, height: number): void {
    this._size = { width, height };
  }

  get size(): Size {
    return { ...this._size };
  }

  get center(): Point {
    return {
      x: this._size.width / 2,
      y: this._size.height / 2,
    };
  }

  // ============================================================================
  // Pan
  // ============================================================================

  panTo(x: number, y: number): void {
    if (!this._config.panEnabled) return;

    const oldState = this._state;
    this._state = { ...this._state, x, y };
    this._applyTransform();
    this._notifyChange(oldState);
  }

  panBy(dx: number, dy: number): void {
    this.panTo(this._state.x + dx, this._state.y + dy);
  }

  // ============================================================================
  // Zoom
  // ============================================================================

  zoomTo(zoom: number, center?: Point): void {
    if (!this._config.zoomEnabled) return;

    const clampedZoom = Math.max(
      this._config.minZoom,
      Math.min(this._config.maxZoom, zoom),
    );

    if (clampedZoom === this._state.zoom) return;

    const oldState = this._state;
    const focalPoint = center ?? this.center;

    // Zoom towards focal point
    const zoomDelta = clampedZoom / this._state.zoom;
    const newX = focalPoint.x - (focalPoint.x - this._state.x) * zoomDelta;
    const newY = focalPoint.y - (focalPoint.y - this._state.y) * zoomDelta;

    this._state = { ...this._state, x: newX, y: newY, zoom: clampedZoom };
    this._applyTransform();
    this._notifyChange(oldState);
  }

  zoomIn(center?: Point): void {
    this.zoomTo(this._state.zoom * (1 + this._config.zoomStep), center);
  }

  zoomOut(center?: Point): void {
    this.zoomTo(this._state.zoom * (1 - this._config.zoomStep), center);
  }

  zoomToFit(bounds: Bounds, padding = 50): void {
    const availableWidth = this._size.width - padding * 2;
    const availableHeight = this._size.height - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const zoom = Math.min(scaleX, scaleY, this._config.maxZoom);

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const oldState = this._state;
    this._state = {
      x: this._size.width / 2 - centerX * zoom,
      y: this._size.height / 2 - centerY * zoom,
      zoom,
      rotation: this._state.rotation,
    };

    this._applyTransform();
    this._notifyChange(oldState);
  }

  resetZoom(): void {
    this.zoomTo(1, this.center);
  }

  // ============================================================================
  // Rotation
  // ============================================================================

  rotateTo(angle: number): void {
    if (!this._config.rotateEnabled) return;

    const oldState = this._state;
    this._state = { ...this._state, rotation: angle };
    this._applyTransform();
    this._notifyChange(oldState);
  }

  rotateBy(delta: number): void {
    this.rotateTo((this._state.rotation ?? 0) + delta);
  }

  // ============================================================================
  // Combined Operations
  // ============================================================================

  setState(state: Partial<ViewportState>): void {
    const oldState = this._state;

    if (state.x !== undefined || state.y !== undefined) {
      if (!this._config.panEnabled) return;
    }
    if (state.zoom !== undefined) {
      if (!this._config.zoomEnabled) return;
      state.zoom = Math.max(
        this._config.minZoom,
        Math.min(this._config.maxZoom, state.zoom),
      );
    }
    if (state.rotation !== undefined && !this._config.rotateEnabled) {
      delete state.rotation;
    }

    this._state = { ...this._state, ...state };
    this._applyTransform();
    this._notifyChange(oldState);
  }

  reset(): void {
    const oldState = this._state;
    this._state = { x: 0, y: 0, zoom: 1, rotation: 0 };
    this._applyTransform();
    this._notifyChange(oldState);
  }

  // ============================================================================
  // Coordinate Conversion
  // ============================================================================

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(point: Point): Point {
    return {
      x: (point.x - this._state.x) / this._state.zoom,
      y: (point.y - this._state.y) / this._state.zoom,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(point: Point): Point {
    return {
      x: point.x * this._state.zoom + this._state.x,
      y: point.y * this._state.zoom + this._state.y,
    };
  }

  /**
   * Get visible world bounds
   */
  getVisibleBounds(): Bounds {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this._size.width,
      y: this._size.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  onChange(handler: (state: ViewportState) => void): () => void {
    this._changeHandlers.push(handler);
    return () => {
      const index = this._changeHandlers.indexOf(handler);
      if (index >= 0) {
        this._changeHandlers.splice(index, 1);
      }
    };
  }

  private _notifyChange(oldState: ViewportState): void {
    if (
      oldState.x === this._state.x &&
      oldState.y === this._state.y &&
      oldState.zoom === this._state.zoom &&
      oldState.rotation === this._state.rotation
    ) {
      return;
    }

    for (const handler of this._changeHandlers) {
      handler(this._state);
    }
  }

  // ============================================================================
  // Private
  // ============================================================================

  private _applyTransform(): void {
    this._container.position.set(this._state.x, this._state.y);
    this._container.scale.set(this._state.zoom);
    this._container.rotation = this._state.rotation ?? 0;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  serialize(): ViewportState {
    return { ...this._state };
  }

  deserialize(state: ViewportState): void {
    this._state = { ...state };
    this._applyTransform();
  }
}
