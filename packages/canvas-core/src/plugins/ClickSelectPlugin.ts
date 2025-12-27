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
import { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import { EdgeShapeBase } from '../elements/edges/EdgeShapeBase';
import { PluginRegistry } from './registry';

export type SelectableElement = NodeShapeBase | EdgeShapeBase;

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
  readonly layerGroups = [];

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

    if (!canvas.viewport) {
      throw new Error('Viewport is required for ClickSelectPlugin');
    }

    // Setup existing nodes and edges as selectable
    this.setupExistingElements();

    // Listen to viewport for background clicks
    canvas.viewport.on('pointerdown', this.onBackgroundClick);
  }

  /**
   * Setup existing elements as selectable
   */
  private setupExistingElements(): void {
    if (!this._canvas) return;

    // Make all nodes selectable
    const nodes = this._canvas.renderer.getNodes();
    nodes.forEach(node => {
      this.makeElementSelectable(node);
    });

    // Make all edges selectable
    const edges = this._canvas.renderer.getEdges();
    edges.forEach(edge => {
      this.makeElementSelectable(edge);
    });
  }

  /**
   * Make an element selectable
   */
  private makeElementSelectable(element: SelectableElement): void {
    element.eventMode = 'static';
    element.cursor = 'pointer';

    // Use pointertap instead of pointerdown to avoid selecting during drag
    element.on('pointertap', (event: FederatedPointerEvent) => {
      this.onElementClick(element, event);
    });
  }

  /**
   * Handle element click
   */
  private onElementClick = (element: SelectableElement, event: FederatedPointerEvent): void => {
    // Check for multi-select modifier
    const isMultiSelect = this._options.multiSelect && 
      (event.shiftKey || event.ctrlKey || event.metaKey);

    if (this.isSelected(element)) {
      // Toggle off if already selected
      if (isMultiSelect) {
        this.deselect(element);
      }
    } else {
      // Select element
      if (isMultiSelect) {
        this.addToSelection(element);
      } else {
        this.select(element);
      }
    }

    // Don't stop propagation - let DragElementPlugin also receive events
    // DragCanvasPlugin already checks event.target to avoid dragging when clicking nodes
  };

  /**
   * Handle background click
   */
  private onBackgroundClick = (event: FederatedPointerEvent): void => {
    // Only clear if clicking on viewport (not on any element)
    if (event.target === this._canvas?.viewport && this._options.clearOnBackground) {
      this.clearSelection();
    }
  };

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

    this.emitSelectionChange();
  }

  /**
   * Remove element from selection
   */
  deselect(element: SelectableElement): void {
    if (!this._selected.has(element)) return;

    this._selected.delete(element);
    element.setState(this._options.selectedState, false);

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
  getSelectedNodes(): NodeShapeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof NodeShapeBase
    ) as NodeShapeBase[];
  }

  /**
   * Get selected edges only
   */
  getSelectedEdges(): EdgeShapeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof EdgeShapeBase
    ) as EdgeShapeBase[];
  }

  /**
   * Emit selection change event
   */
  private emitSelectionChange(): void {
    if (!this._canvas) return;

    // Emit custom event through canvas
    (this._canvas as any).emit?.('selectionChanged', {
      selected: this.getSelected(),
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
    // Clear all selections
    this.clearSelection();

    // Remove event listeners
    if (this._canvas) {
      this._canvas.viewport?.off('pointerdown', this.onBackgroundClick);

      const nodes = this._canvas.renderer.getNodes();
      nodes.forEach(node => {
        node.off('pointerdown');
      });

      const edges = this._canvas.renderer.getEdges();
      edges.forEach(edge => {
        edge.off('pointerdown');
      });
    }

    this._canvas = null;
    this._selected.clear();
  }
}

// Auto-register plugin
PluginRegistry.register('click-select', ClickSelectPlugin);
