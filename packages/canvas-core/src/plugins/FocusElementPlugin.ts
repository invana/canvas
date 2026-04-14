/**
 * Focus Element Plugin
 * 
 * Enables focusing the camera on elements by clicking on them, centering them
 * in the viewport with smooth animation. Also exposes programmatic focus methods.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'focus-element',
 *       options: {
 *         animation: { duration: 500, easing: 'ease-in' },
 *         enable: true,
 *       }
 *     }
 *   ]
 * });
 * 
 * // Focus on element programmatically
 * const focusPlugin = canvas.getPlugin<FocusElementPlugin>('focus-element');
 * focusPlugin?.focusElement(node);
 * ```
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import type { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import type { Viewport } from '../viewport/Viewport';
import { type ViewportAnimationEffectTiming } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export type FocusableElement = RendererNodeBase | RendererEdgeBase;
export type { ViewportAnimationEffectTiming };

export interface FocusElementOptions {
  /**
   * Animation settings for viewport transitions.
   * Default: `{ duration: 500, easing: 'ease-in' }`
   */
  animation?: ViewportAnimationEffectTiming;
  /**
   * Whether to enable click-to-focus behavior.
   * Can be a function receiving the click event for conditional logic.
   * Default: `true`
   */
  enable?: boolean | ((event: { element: FocusableElement; originalEvent: PointerEvent }) => boolean);
  /** Padding around focused element(s) when fitting multiple elements */
  padding?: number;
}

/**
 * Focus Element Plugin
 * Centers the viewport on an element when clicked, with smooth animation.
 */
export class FocusElementPlugin implements CanvasPlugin {
  readonly id = 'focus-element';
  readonly name = 'Focus Element';
  getLayers() { return []; }

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: FocusElementOptions;

  constructor(options: FocusElementOptions = {}) {
    this._options = options;
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for FocusElementPlugin');
    }

    canvas.on('node:clicked', (e) => {
      const event = { element: e.node as FocusableElement, originalEvent: e.originalEvent };
      if (this._isEnabled(event)) this._centerOnElement(e.node as FocusableElement);
    });

    canvas.on('edge:clicked', (e) => {
      const event = { element: e.edge as FocusableElement, originalEvent: e.originalEvent };
      if (this._isEnabled(event)) this._centerOnElement(e.edge as FocusableElement);
    });
  }

  private _isEnabled(event: { element: FocusableElement; originalEvent: PointerEvent }): boolean {
    const { enable = true } = this._options;
    return typeof enable === 'function' ? enable(event) : enable;
  }

  /**
   * Center the viewport on a single element at the current zoom level.
   */
  focusElement(element: FocusableElement): void {
    this._centerOnElement(element);
  }

  /**
   * Fit the viewport to display all given elements with padding.
   */
  focusElements(elements: FocusableElement[]): void {
    if (!this._viewport || elements.length === 0) return;
    const bounds = this._worldBoundsOf(elements);
    this._viewport.fitBounds(bounds, this._options.padding ?? 50, this._options.animation);
  }

  /**
   * Focus on currently selected elements (requires ClickSelectPlugin).
   */
  focusSelected(): void {
    if (!this._canvas) return;
    const selectPlugin = this._canvas.getPlugin('click-select') as any;
    if (!selectPlugin) {
      console.warn('ClickSelectPlugin not found. Cannot focus on selected elements.');
      return;
    }
    const selected = selectPlugin.getSelected?.();
    if (selected && selected.length > 0) this.focusElements(selected);
  }

  /** Fit all content in viewport. @deprecated Use viewport.fitContent() instead. */
  fitContent(): void {
    this._canvas?.viewport?.fitContent(50);
  }

  get options(): Readonly<FocusElementOptions> { return this._options; }

  setOptions(options: Partial<FocusElementOptions>): void {
    this._options = { ...this._options, ...options };
  }

  destroy(): void {
    this._canvas = null;
    this._viewport = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Center viewport on element's world position at the current zoom. */
  private _centerOnElement(element: FocusableElement): void {
    // element.x / element.y are world-space coordinates inside the viewport container.
    this._viewport?.centerOnWorld(element.x, element.y, this._options.animation);
  }

  /**
   * Calculate the world-space axis-aligned bounding box for a set of elements.
   * getBounds() returns screen-space coords, so we convert via screenToWorld().
   */
  private _worldBoundsOf(elements: FocusableElement[]): {
    x: number; y: number; width: number; height: number;
  } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      const s  = el.getBounds();
      const tl = this._viewport!.screenToWorld(s.x, s.y);
      const br = this._viewport!.screenToWorld(s.x + s.width, s.y + s.height);
      minX = Math.min(minX, tl.x);  minY = Math.min(minY, tl.y);
      maxX = Math.max(maxX, br.x);  maxY = Math.max(maxY, br.y);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

// Auto-register plugin
PluginRegistry.register('focus-element', FocusElementPlugin);
