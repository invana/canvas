/**
 * Hover Activate Plugin
 * 
 * Enables hover effects on nodes and edges with optional neighbor highlighting.
 * Uses spatial indexing for performance with large graphs.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'hover-activate',
 *       options: {
 *         highlightNeighbors: true,
 *         hoverDelay: 100
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import type { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { PluginRegistry } from './registry';

export type HoverableElement = RendererNodeBase | RendererEdgeBase;

export interface HoverActivateOptions {
  /** Hover state name to apply */
  hoverState?: string;
  /** Highlight connected neighbors when hovering a node */
  highlightNeighbors?: boolean;
  /** State to apply to highlighted neighbors */
  neighborState?: string;
  /** Delay before activating hover (ms) */
  hoverDelay?: number;
}

/**
 * Hover Activate Plugin
 * Handles hover effects with optional neighbor highlighting
 */
export class HoverActivatePlugin implements CanvasPlugin {
  readonly id = 'hover-activate';
  readonly name = 'Hover Activate';
  getLayers() {
    return [];
  }

  private _options: Required<HoverActivateOptions>;
  
  private _currentHover: HoverableElement | null = null;
  private _highlightedElements = new Set<HoverableElement>();
  private _hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HoverActivateOptions = {}) {
    this._options = {
      hoverState: options.hoverState ?? 'active',  // Use 'active' state for hover
      highlightNeighbors: options.highlightNeighbors ?? false,
      neighborState: options.neighborState ?? 'highlighted',
      hoverDelay: options.hoverDelay ?? 0,
    };
  }

  async init(canvas: Canvas): Promise<void> {
    // Subscribe to canvas event bus — no per-element setup needed
    canvas.on('node:hover',    (e) => this.onHoverStart(e.node));
    canvas.on('node:hoverend', (e) => this.onHoverEnd(e.node));
    canvas.on('edge:hover',    (e) => this.onHoverStart(e.edge));
    canvas.on('edge:hoverend', (e) => this.onHoverEnd(e.edge));
  }

  /**
   * Handle hover start
   */
  private onHoverStart(element: HoverableElement): void {
    // Clear any pending hover timeout
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }

    // Clear previous hover if different element
    if (this._currentHover && this._currentHover !== element) {
      this.clearHover();
    }

    if (this._options.hoverDelay > 0) {
      // Delay hover activation
      this._hoverTimeout = setTimeout(() => {
        this.activateHover(element);
      }, this._options.hoverDelay);
    } else {
      // Immediate activation
      this.activateHover(element);
    }
  }

  /**
   * Activate hover state
   */
  private activateHover(element: HoverableElement): void {
    this._currentHover = element;

    // Apply hover state
    element.setState(this._options.hoverState, true);

    // Highlight neighbors if enabled and element is a node
    if (this._options.highlightNeighbors && element instanceof RendererNodeBase) {
      this.highlightNeighbors(element);
    }
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(element: HoverableElement): void {
    // Clear pending hover timeout
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }

    // Only clear if this is the current hover element
    if (this._currentHover === element) {
      this.clearHover();
    }
  }

  /**
   * Highlight neighbors of a node
   * TODO: Implement when SceneGraph relationship API is available
   */
  private highlightNeighbors(_node: RendererNodeBase): void {
    // Temporarily disabled - requires SceneGraph.relationships API
  }

  /**
   * Clear current hover and highlights
   */
  clearHover(): void {
    if (this._currentHover) {
      this._currentHover.setState(this._options.hoverState, false);
      this._currentHover = null;
    }

    // Clear all highlighted elements
    this._highlightedElements.forEach(el => {
      el.setState(this._options.neighborState, false);
    });
    this._highlightedElements.clear();
  }

  /**
   * Get current hovered element
   */
  get hoveredElement(): HoverableElement | null {
    return this._currentHover;
  }

  /**
   * Get current options
   */
  get options(): Readonly<Required<HoverActivateOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<HoverActivateOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    this.clearHover();

    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }

    this._currentHover = null;
    this._highlightedElements.clear();
  }
}

// Auto-register plugin
PluginRegistry.register('hover-activate', HoverActivatePlugin);
