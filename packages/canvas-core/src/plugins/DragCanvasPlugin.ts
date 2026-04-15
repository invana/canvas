/**
 * Drag Canvas Plugin
 * 
 * Enables panning of the viewport/canvas by dragging.
 * Supports different mouse buttons and touch gestures.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'drag-canvas',
 *       options: {
 *         mouseButton: 'left',
 *         requireModifier: false
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { ICanvasPointerEvent } from '../types';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { Viewport } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export interface DragCanvasOptions {
  /** Which mouse button triggers canvas drag */
  mouseButton?: 'left' | 'middle' | 'right' | 'any';
  /** Require modifier key (shift/ctrl/alt) for left-click drag */
  requireModifier?: boolean;
  /** Cursor style when dragging */
  dragCursor?: string;
  /** Cursor style when hovering */
  hoverCursor?: string;
}

/**
 * Drag Canvas Plugin
 * Handles viewport panning via mouse drag
 */
export class DragCanvasPlugin implements CanvasPlugin {
  readonly id = 'drag-canvas';
  readonly name = 'Drag Canvas';
  getLayers() {
    return [];
  }

  private _viewport: Viewport | null = null;
  private _canvas: Canvas | null = null;
  private _options: Required<DragCanvasOptions>;
  
  private _isDragging = false;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _viewportStartX = 0;
  private _viewportStartY = 0;
  private _originalCursor: string = 'default';

  constructor(options: DragCanvasOptions = {}) {
    this._options = {
      mouseButton: options.mouseButton ?? 'middle',
      requireModifier: options.requireModifier ?? false,
      dragCursor: options.dragCursor ?? 'grabbing',
      hoverCursor: options.hoverCursor ?? 'grab',
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for DragCanvasPlugin');
    }

    // Store original cursor
    this._originalCursor = this._viewport.getCursor();

    // Attach event listeners
    this._viewport.eventMode = 'static';
    this._viewport.on('pointerdown', this.onPointerDown);
    this._viewport.on('globalpointermove', this.onPointerMove);
    this._viewport.on('pointerup', this.onPointerUp);
    this._viewport.on('pointerupoutside', this.onPointerUp);

    // Set hover cursor
    if (this._options.mouseButton !== 'left' || !this._options.requireModifier) {
      this._viewport.setCursor(this._options.hoverCursor);
    }
  }

  /**
   * Check if the pointer event should trigger canvas drag
   */
  private shouldStartDrag(event: ICanvasPointerEvent): boolean {
    // Check mouse button
    switch (this._options.mouseButton) {
      case 'left':
        if (event.button !== 0) return false;
        // If requireModifier is true, check for modifier keys
        if (this._options.requireModifier) {
          return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
        }
        return true;
      
      case 'middle':
        return event.button === 1;
      
      case 'right':
        return event.button === 2;
      
      case 'any':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Handle pointer down (start canvas drag)
   */
  private onPointerDown = (event: ICanvasPointerEvent): void => {
    // Don't drag if clicking on a node or other interactive element
    if (event.target !== this._viewport) {
      return;
    }

    if (!this.shouldStartDrag(event)) {
      return;
    }

    // Prevent context menu on right-click
    if (event.button === 2) {
      event.preventDefault();
    }

    this._isDragging = true;
    this._dragStartX = event.global.x;
    this._dragStartY = event.global.y;
    this._viewportStartX = this._viewport!.x;
    this._viewportStartY = this._viewport!.y;

    // Change cursor
    this._viewport!.setCursor(this._options.dragCursor);

    // Stop propagation
    event.stopPropagation();
  };

  /**
   * Handle pointer move (dragging canvas)
   */
  private onPointerMove = (event: ICanvasPointerEvent): void => {
    if (!this._isDragging) return;

    const dx = event.global.x - this._dragStartX;
    const dy = event.global.y - this._dragStartY;

    // Update viewport position
    this._viewport!.x = this._viewportStartX + dx;
    this._viewport!.y = this._viewportStartY + dy;

    this._canvas?.events.emit('viewport:panned', { x: this._viewport!.x, y: this._viewport!.y });
  };

  /**
   * Handle pointer up (end canvas drag)
   */
  private onPointerUp = (): void => {
    if (!this._isDragging) return;

    this._isDragging = false;

    // Restore cursor
    this._viewport!.setCursor(this._options.hoverCursor);
  };

  /**
   * Get current options
   */
  get options(): Readonly<Required<DragCanvasOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<DragCanvasOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    if (this._viewport) {
      this._viewport.off('pointerdown', this.onPointerDown);
      this._viewport.off('globalpointermove', this.onPointerMove);
      this._viewport.off('pointerup', this.onPointerUp);
      this._viewport.off('pointerupoutside', this.onPointerUp);
      
      // Restore original cursor
      this._viewport.setCursor(this._originalCursor);
    }

    this._viewport = null;
    this._canvas = null;
    this._isDragging = false;
  }
}

// Auto-register plugin
PluginRegistry.register('drag-canvas', DragCanvasPlugin);
