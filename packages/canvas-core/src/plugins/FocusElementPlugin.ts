/**
 * Focus Element Plugin
 * 
 * Enables focusing the camera on selected elements with smooth animation.
 * Automatically fits selected elements in viewport.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'focus-element',
 *       options: {
 *         duration: 500,
 *         padding: 50
 *       }
 *     }
 *   ]
 * });
 * 
 * // Focus on element
 * const focusPlugin = canvas.getPlugin<FocusElementPlugin>('focus-element');
 * focusPlugin?.focusElement(node);
 * ```
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import type { EdgeShapeBase } from '../elements/edges/EdgeShapeBase';
import type { Viewport } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export type FocusableElement = NodeShapeBase | EdgeShapeBase;

export interface FocusElementOptions {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Padding around focused element(s) */
  padding?: number;
  /** Easing function for animation */
  easing?: 'linear' | 'easeInOut' | 'easeOut';
}

/**
 * Focus Element Plugin
 * Handles camera focus on elements with smooth animation
 */
export class FocusElementPlugin implements CanvasPlugin {
  readonly id = 'focus-element';
  readonly name = 'Focus Element';
  readonly layerGroups = [];

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<FocusElementOptions>;
  
  private _animationFrame: number | null = null;

  constructor(options: FocusElementOptions = {}) {
    this._options = {
      duration: options.duration ?? 500,
      padding: options.padding ?? 50,
      easing: options.easing ?? 'easeInOut',
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for FocusElementPlugin');
    }
  }

  /**
   * Focus on a single element
   */
  focusElement(element: FocusableElement): void {
    this.focusElements([element]);
  }

  /**
   * Focus on multiple elements
   */
  focusElements(elements: FocusableElement[]): void {
    if (elements.length === 0) return;

    // Calculate bounding box of all elements
    const bounds = this.calculateBounds(elements);
    
    // Fit to bounds
    this.fitToBounds(bounds);
  }

  /**
   * Focus on selected elements (requires ClickSelectPlugin)
   */
  focusSelected(): void {
    if (!this._canvas) return;

    // Try to get ClickSelectPlugin
    const selectPlugin = this._canvas.getPlugin('click-select') as any;
    if (!selectPlugin) {
      console.warn('ClickSelectPlugin not found. Cannot focus on selected elements.');
      return;
    }

    const selected = selectPlugin.getSelected?.();
    if (selected && selected.length > 0) {
      this.focusElements(selected);
    }
  }

  /**
   * Calculate bounding box for elements
   */
  private calculateBounds(elements: FocusableElement[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      // Get element bounds
      const bounds = element.getBounds();
      
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Fit viewport to bounds with animation
   */
  private fitToBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    if (!this._viewport) return;

    const viewportWidth = this._viewport.viewWidth;
    const viewportHeight = this._viewport.viewHeight;

    // Calculate zoom to fit bounds
    const padding = this._options.padding * 2;
    const scaleX = viewportWidth / (bounds.width + padding);
    const scaleY = viewportHeight / (bounds.height + padding);
    const targetZoom = Math.min(scaleX, scaleY);

    // Calculate center position
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Calculate target viewport position
    const targetX = viewportWidth / 2 - centerX * targetZoom;
    const targetY = viewportHeight / 2 - centerY * targetZoom;

    // Animate to target
    this.animateToPosition(targetX, targetY, targetZoom);
  }

  /**
   * Animate viewport to position and zoom
   */
  private animateToPosition(targetX: number, targetY: number, targetZoom: number): void {
    if (!this._viewport) return;

    // Cancel any existing animation
    if (this._animationFrame !== null) {
      cancelAnimationFrame(this._animationFrame);
    }

    const startTime = performance.now();
    const startX = this._viewport.content.x;
    const startY = this._viewport.content.y;
    const startZoom = this._viewport.zoom;

    const animate = (currentTime: number) => {
      if (!this._viewport) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this._options.duration, 1);
      
      // Apply easing
      const easedProgress = this.applyEasing(progress);

      // Interpolate values
      const currentX = startX + (targetX - startX) * easedProgress;
      const currentY = startY + (targetY - startY) * easedProgress;
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

      // Update viewport
      this._viewport.content.x = currentX;
      this._viewport.content.y = currentY;
      this._viewport.content.scale.set(currentZoom);

      // Continue animation
      if (progress < 1) {
        this._animationFrame = requestAnimationFrame(animate);
      } else {
        this._animationFrame = null;
      }
    };

    this._animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number): number {
    switch (this._options.easing) {
      case 'linear':
        return t;
      
      case 'easeOut':
        return 1 - Math.pow(1 - t, 3);
      
      case 'easeInOut':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      default:
        return t;
    }
  }

  /**
   * Fit all content in viewport
   */
  fitContent(): void {
    if (!this._canvas) return;

    const nodes = this._canvas.renderer.getNodes();
    if (nodes.length > 0) {
      this.focusElements(nodes);
    }
  }

  /**
   * Get current options
   */
  get options(): Readonly<Required<FocusElementOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<FocusElementOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    // Cancel any ongoing animation
    if (this._animationFrame !== null) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    this._canvas = null;
    this._viewport = null;
  }
}

// Auto-register plugin
PluginRegistry.register('focus-element', FocusElementPlugin);
