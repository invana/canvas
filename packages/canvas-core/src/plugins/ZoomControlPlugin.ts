/**
 * Zoom Control Plugin
 * 
 * Enables zooming with mouse wheel, pinch gestures, and programmatic controls.
 * Supports zoom constraints and smooth animations.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'zoom-control',
 *       options: {
 *         wheelSensitivity: 0.001,
 *         minZoom: 0.1,
 *         maxZoom: 10
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import { FederatedWheelEvent } from 'pixi.js';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { Viewport } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export interface ZoomControlOptions {
  /** Mouse wheel zoom sensitivity */
  wheelSensitivity?: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Enable pinch zoom on touch devices */
  enablePinch?: boolean;
  /** Zoom toward cursor position */
  zoomToCursor?: boolean;
}

/**
 * Zoom Control Plugin
 * Handles viewport zooming via mouse wheel and touch gestures
 */
export class ZoomControlPlugin implements CanvasPlugin {
  readonly id = 'zoom-control';
  readonly name = 'Zoom Control';
  readonly layerGroups = [];

  private _viewport: Viewport | null = null;
  private _options: Required<ZoomControlOptions>;

  constructor(options: ZoomControlOptions = {}) {
    this._options = {
      wheelSensitivity: options.wheelSensitivity ?? 0.001,
      minZoom: options.minZoom ?? 0.1,
      maxZoom: options.maxZoom ?? 10,
      enablePinch: options.enablePinch ?? true,
      zoomToCursor: options.zoomToCursor ?? true,
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for ZoomControlPlugin');
    }

    // Attach wheel event listener
    this._viewport.on('wheel', this.onWheel);

    // TODO: Add pinch gesture support for touch devices
    if (this._options.enablePinch) {
      // Will be implemented when touch support is added
    }
  }

  /**
   * Handle mouse wheel zoom
   */
  private onWheel = (event: FederatedWheelEvent): void => {
    event.preventDefault();

    const delta = -event.deltaY;
    const currentZoom = this._viewport!.zoom;

    // Calculate new zoom level
    const zoomFactor = 1 + delta * this._options.wheelSensitivity;
    let newZoom = currentZoom * zoomFactor;

    // Clamp zoom level
    newZoom = Math.max(this._options.minZoom, Math.min(this._options.maxZoom, newZoom));

    if (this._options.zoomToCursor) {
      // Zoom toward cursor position
      const globalPos = event.global;
      this._viewport!.zoomTo(newZoom, globalPos.x, globalPos.y);
    } else {
      // Zoom toward center
      this._viewport!.zoomTo(newZoom);
    }
  };

  /**
   * Programmatically set zoom level
   */
  zoomTo(level: number, centerX?: number, centerY?: number): void {
    if (!this._viewport) return;

    const clampedZoom = Math.max(
      this._options.minZoom,
      Math.min(this._options.maxZoom, level)
    );

    this._viewport.zoomTo(clampedZoom, centerX, centerY);
  }

  /**
   * Zoom by a factor
   */
  zoomBy(factor: number, centerX?: number, centerY?: number): void {
    if (!this._viewport) return;

    const currentZoom = this._viewport.zoom;
    this.zoomTo(currentZoom * factor, centerX, centerY);
  }

  /**
   * Zoom in
   */
  zoomIn(factor: number = 1.2): void {
    this.zoomBy(factor);
  }

  /**
   * Zoom out
   */
  zoomOut(factor: number = 0.8): void {
    this.zoomBy(factor);
  }

  /**
   * Reset zoom to 1
   */
  resetZoom(): void {
    this.zoomTo(1);
  }

  /**
   * Get current zoom level
   */
  get zoom(): number {
    return this._viewport?.zoom ?? 1;
  }

  /**
   * Get current options
   */
  get options(): Readonly<Required<ZoomControlOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<ZoomControlOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    if (this._viewport) {
      this._viewport.off('wheel', this.onWheel);
    }

    this._viewport = null;
  }
}

// Auto-register plugin
PluginRegistry.register('zoom-control', ZoomControlPlugin);
