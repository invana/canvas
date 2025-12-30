/**
 * SelectionManager - Manages element selection state
 * 
 * Handles single and multi-select with keyboard modifiers
 */

import type { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import type { EdgeShapeBase } from '../elements/edges/EdgeShapeBase';

export type SelectableElement = NodeShapeBase | EdgeShapeBase;

export interface SelectionConfig {
  multiSelect?: boolean;
  selectionStyle?: {
    stroke?: string;
    strokeWidth?: number;
    alpha?: number;
  };
}

/** Default selection styling */
const DEFAULT_SELECTION_STYLE = {
  stroke: '#4A90E2',
  strokeWidth: 3,
  alpha: 1,
} as const;

export type SelectionEventCallback = (selected: SelectableElement[]) => void;

export class SelectionManager {
  private readonly selected: Set<SelectableElement> = new Set();
  private readonly config: Required<SelectionConfig>;
  private readonly listeners: Set<SelectionEventCallback> = new Set();

  constructor(config: SelectionConfig = {}) {
    this.config = {
      multiSelect: config.multiSelect ?? true,
      selectionStyle: config.selectionStyle ?? DEFAULT_SELECTION_STYLE,
    };
  }

  /**
   * Register an element for selection
   */
  registerElement(element: SelectableElement): void {
    element.eventMode = 'static';
    element.cursor = 'pointer';

    element.on('pointerdown', (event) => {
      const multiSelect = this.config.multiSelect && (event.shiftKey || event.ctrlKey || event.metaKey);
      this.handleClick(element, multiSelect);
    });
  }

  /**
   * Unregister an element
   */
  unregisterElement(element: SelectableElement): void {
    this.deselect(element);
    element.off('pointerdown');
  }

  /**
   * Handle click on element
   */
  private handleClick(element: SelectableElement, multiSelect: boolean): void {
    if (this.isSelected(element)) {
      if (multiSelect) {
        this.deselect(element);
      }
    } else {
      if (multiSelect) {
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
    if (!this.selected.has(element)) {
      this.selected.add(element);
      this.applySelectionStyle(element, true);
      this.notifyChange();
    }
  }

  /**
   * Remove element from selection
   */
  deselect(element: SelectableElement): void {
    if (this.selected.has(element)) {
      this.selected.delete(element);
      this.applySelectionStyle(element, false);
      this.notifyChange();
    }
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
    elements.forEach((element) => {
      this.selected.add(element);
      this.applySelectionStyle(element, true);
    });
    this.notifyChange();
  }

  /**
   * Clear selection
   */
  clear(): void {
    this.clearSelection();
  }

  /**
   * Clear all selections
   */
  private clearSelection(): void {
    this.selected.forEach((element) => {
      this.applySelectionStyle(element, false);
    });
    this.selected.clear();
    this.notifyChange();
  }

  /**
   * Check if element is selected
   */
  isSelected(element: SelectableElement): boolean {
    return this.selected.has(element);
  }

  /**
   * Get all selected elements
   */
  getSelected(): SelectableElement[] {
    return Array.from(this.selected);
  }

  /**
   * Get selected count
   */
  getCount(): number {
    return this.selected.size;
  }

  /**
   * Check if any elements are selected
   */
  hasSelection(): boolean {
    return this.selected.size > 0;
  }

  /**
   * Apply selection visual style
   */
  private applySelectionStyle(element: SelectableElement, selected: boolean): void {
    if (selected) {
      // Store original style
      (element as any)._originalStyle = {
        alpha: element.alpha,
      };

      // Apply selection style
      element.alpha = this.config.selectionStyle.alpha ?? 1;

      // Visual feedback - could enhance with outline/glow
    } else {
      // Restore original style
      const original = (element as any)._originalStyle;
      if (original) {
        element.alpha = original.alpha;
        delete (element as any)._originalStyle;
      }
    }
  }

  /**
   * Set multi-select mode
   */
  setMultiSelect(enabled: boolean): void {
    this.config.multiSelect = enabled;
    if (!enabled && this.selected.size > 1) {
      // Keep only the first selected element
      const rest = Array.from(this.selected).slice(1);
      rest.forEach((element) => {
        this.selected.delete(element);
        this.applySelectionStyle(element, false);
      });
      this.notifyChange();
    }
  }

  /**
   * Update selection style
   */
  setSelectionStyle(style: Partial<typeof this.config.selectionStyle>): void {
    Object.assign(this.config.selectionStyle, style);
    // Re-apply style to selected elements
    this.selected.forEach((element) => {
      this.applySelectionStyle(element, true);
    });
  }

  /**
   * Subscribe to selection changes
   */
  on(event: 'changed', callback: SelectionEventCallback): void {
    if (event === 'changed') {
      this.listeners.add(callback);
    }
  }

  /**
   * Unsubscribe from selection changes
   */
  off(event: 'changed', callback: SelectionEventCallback): void {
    if (event === 'changed') {
      this.listeners.delete(callback);
    }
  }

  /**
   * Notify listeners of selection change
   */
  private notifyChange(): void {
    const selected = this.getSelected();
    this.listeners.forEach((callback) => callback(selected));
  }

  /**
   * Destroy the selection manager
   */
  destroy(): void {
    this.clearSelection();
    this.listeners.clear();
  }
}
