/**
 * Click Select Plugin
 * 
 * Enables selection of nodes and edges via clicking.
 * Supports single and multi-select with keyboard modifiers.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'click-select',
 *       options: {
 *         multiSelect: true,
 *         highlightColor: '#0066ff'
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import { FederatedPointerEvent } from 'pixi.js';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { PluginRegistry } from './registry';

export type SelectableElement = RendererNodeBase | RendererEdgeBase;

export interface ClickSelectOptions {
  /** Enable multi-select with modifier keys */
  multiSelect?: boolean;
  /** Selection state name to apply */
  selectedState?: string;
  /** Clear selection when clicking empty space */
  clearOnBackground?: boolean;
}

/**
 * Click Select Plugin
 * Handles element selection via clicking with keyboard modifiers
 */
export class ClickSelectPlugin implements CanvasPlugin {
  readonly id = 'click-select';
  readonly name = 'Click Select';
  getLayers() {
    return [];
  }

  private _canvas: Canvas | null = null;
  private _options: Required<ClickSelectOptions>;
  
  // Track selected elements
  private _selected = new Set<SelectableElement>();

  constructor(options: ClickSelectOptions = {}) {
    this._options = {
      multiSelect: options.multiSelect ?? true,
      selectedState: options.selectedState ?? 'selected',
      clearOnBackground: options.clearOnBackground ?? true,
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;

    // Subscribe to canvas event bus — no per-element setup needed
    canvas.on('node:clicked', (e) => this.onElementClick(e.node, e.originalEvent));
    canvas.on('edge:clicked', (e) => this.onElementClick(e.edge, e.originalEvent));
    canvas.on('canvas:clicked', () => {
      if (this._options.clearOnBackground) this.clearSelection();
    });
  }

  /**
   * Handle element click — wired from canvas event bus
   */
  private onElementClick(element: SelectableElement, event: FederatedPointerEvent): void {
    const isMultiSelect = this._options.multiSelect &&
      (event.shiftKey || event.ctrlKey || event.metaKey);

    if (this.isSelected(element)) {
      if (isMultiSelect) {
        this.deselect(element);
      }
    } else {
      if (isMultiSelect) {
        this.addToSelection(element);
      } else {
        this.select(element);
      }
    }
  }

  /**
   * Select a single element (clears previous selection)
   */
  select(element: SelectableElement): void {
    this.clearSelection();
    this.addToSelection(element);
  }

  /**
   * Add element to selection
   */
  addToSelection(element: SelectableElement): void {
    if (this._selected.has(element)) return;

    this._selected.add(element);
    element.setState(this._options.selectedState, true);

    if (element instanceof RendererNodeBase) {
      this._canvas?.events.emit('node:selected', { node: element });
    } else {
      this._canvas?.events.emit('edge:selected', { edge: element as RendererEdgeBase });
    }

    this.emitSelectionChange();
  }

  /**
   * Remove element from selection
   */
  deselect(element: SelectableElement): void {
    if (!this._selected.has(element)) return;

    this._selected.delete(element);
    element.setState(this._options.selectedState, false);

    if (element instanceof RendererNodeBase) {
      this._canvas?.events.emit('node:deselected', { node: element });
    } else {
      this._canvas?.events.emit('edge:deselected', { edge: element as RendererEdgeBase });
    }

    this.emitSelectionChange();
  }

  /**
   * Toggle element selection
   */
  toggle(element: SelectableElement): void {
    if (this.isSelected(element)) {
      this.deselect(element);
    } else {
      this.addToSelection(element);
    }
  }

  /**
   * Select multiple elements
   */
  selectMultiple(elements: SelectableElement[]): void {
    this.clearSelection();
    elements.forEach(el => this.addToSelection(el));
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this._selected.forEach(el => {
      el.setState(this._options.selectedState, false);
    });
    this._selected.clear();

    this.emitSelectionChange();
  }

  /**
   * Check if element is selected
   */
  isSelected(element: SelectableElement): boolean {
    return this._selected.has(element);
  }

  /**
   * Get all selected elements
   */
  getSelected(): SelectableElement[] {
    return Array.from(this._selected);
  }

  /**
   * Get selected nodes only
   */
  getSelectedNodes(): RendererNodeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof RendererNodeBase
    ) as RendererNodeBase[];
  }

  /**
   * Get selected edges only
   */
  getSelectedEdges(): RendererEdgeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof RendererEdgeBase
    ) as RendererEdgeBase[];
  }

  /**
   * Emit selection change event
   */
  private emitSelectionChange(): void {
    if (!this._canvas) return;

    this._canvas.events.emit('selection:changed', {
      nodes: this.getSelectedNodes(),
      edges: this.getSelectedEdges(),
    });
  }

  /**
   * Get current options
   */
  get options(): Readonly<Required<ClickSelectOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<ClickSelectOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    this.clearSelection();
    this._canvas = null;
    this._selected.clear();
  }
}

// Auto-register plugin
PluginRegistry.register('click-select', ClickSelectPlugin);
