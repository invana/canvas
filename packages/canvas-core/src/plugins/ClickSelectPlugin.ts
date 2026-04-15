/**
 * Click Select Plugin
 *
 * Enables selection of nodes and edges via clicking.
 * Supports single and multi-select with configurable hotkeys
 * and unselected-element dimming.
 *
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'click-select',
 *       options: {
 *         multiple: true,
 *         trigger: ['shift'],
 *         state: 'selected',
 *         unselectedState: 'muted',
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { ICanvasPointerEvent } from '../types';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { TraversalDirection } from './GraphDataPlugin';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { PluginRegistry } from './registry';

/** Direction alias for ClickSelectPlugin — same semantics as TraversalDirection. */
export type SelectDirection = TraversalDirection;

export type SelectableElement = RendererNodeBase | RendererEdgeBase;

export interface ClickSelectOptions {
  /**
   * Whether the plugin is active. Accepts a boolean or a predicate function
   * receiving the raw pointer event.
   */
  enable?: boolean | ((event: ICanvasPointerEvent) => boolean);

  /**
   * Number of hops to expand from each clicked element.
   * Neighbors within `degree` hops are added to the selection (same `state`).
   * 0 = only the directly clicked element; 1 = direct neighbors; etc.
   */
  degree?: number;

  /**
   * Edge-traversal direction when expanding neighbors.
   * 'both' (default) | 'in' | 'out'.
   */
  direction?: SelectDirection;

  /** State name applied to the selected element(s). */
  state?: string;

  /**
   * State name applied to every element that is not selected.
   * Set to `null` or `''` to disable dimming.
   */
  unselectedState?: string | null;

  /** Allow selecting more than one element at a time. */
  multiple?: boolean;

  /**
   * Modifier key(s) that, when held during a click, activate multi-select.
   * Accepted values (case-insensitive): 'shift', 'control', 'alt', 'meta'.
   * Defaults to `['shift']`.
   */
  trigger?: string[];

  /** Callback fired on every element click (after the enable guard). Set to `null` to disable. */
  onClick?: ((event: ICanvasPointerEvent) => void) | null;

  /** Clear the selection when clicking the empty canvas background. */
  clearOnBackground?: boolean;
}

/**
 * Click Select Plugin
 *
 * Handles element selection via clicking. Supports single-select,
 * multi-select with configurable hotkeys, n-degree neighbor highlighting,
 * and optional dimming of unselected elements.
 */
export class ClickSelectPlugin implements CanvasPlugin {
  readonly id = 'click-select';
  readonly name = 'Click Select';

  getLayers() {
    return [];
  }

  private _canvas: Canvas | null = null;
  private _options: Required<ClickSelectOptions>;

  // _seeds  — elements the user directly clicked/added (never degree-expanded nodes).
  // _selected — everything rendered as selected: seeds + degree-expanded nodes/edges.
  // Keeping them separate prevents re-expanding expanded nodes when shift-clicking.
  private _seeds     = new Set<SelectableElement>();
  private _selected  = new Set<SelectableElement>();
  private _unselected = new Set<SelectableElement>();

  constructor(options: ClickSelectOptions = {}) {
    this._options = {
      enable:          options.enable          ?? true,
      degree:          options.degree          ?? 0,
      direction:       options.direction       ?? 'both',
      state:           options.state           ?? 'selected',
      unselectedState: options.unselectedState ?? null,
      multiple:        options.multiple        ?? false,
      trigger:         options.trigger         ?? ['shift'],
      onClick:         options.onClick         ?? null,
      clearOnBackground: options.clearOnBackground ?? true,
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;

    canvas.on('node:clicked', (e) => this._onElementClick(e.node, e.originalEvent));
    canvas.on('edge:clicked', (e) => this._onElementClick(e.edge, e.originalEvent));
    canvas.on('canvas:clicked', () => {
      if (this._options.clearOnBackground) this.clearSelection();
    });
  }

  // ---------------------------------------------------------------------------
  // Internal click handler

  private _onElementClick(element: SelectableElement, event: ICanvasPointerEvent): void {
    const { enable, multiple, trigger, onClick } = this._options;

    const isEnabled = typeof enable === 'function' ? enable(event) : enable;
    if (!isEnabled) return;

    onClick?.(event);

    const activeModifiers = this._activeModifiers(event);
    // Empty trigger array means no modifier required — multiple:true alone is sufficient.
    const isMultiKey = multiple && (trigger.length === 0 || trigger.some(k => activeModifiers.has(k.toLowerCase())));

    if (isMultiKey) {
      // Toggle the clicked element in the *seed* set
      const nextSeeds = new Set(this._seeds);
      if (nextSeeds.has(element)) {
        nextSeeds.delete(element);
      } else {
        nextSeeds.add(element);
      }
      this._applySelection(nextSeeds, event);
    } else {
      this._applySelection(new Set([element]), event);
    }
  }

  private _activeModifiers(event: ICanvasPointerEvent): Set<string> {
    // Pixi's synthetic 'pointertap' does not reliably copy modifier keys onto
    // the FederatedPointerEvent itself — read from the underlying native event.
    const src = (event.nativeEvent as PointerEvent | MouseEvent | undefined) ?? event;
    const active = new Set<string>();
    if (src.shiftKey) active.add('shift');
    if (src.ctrlKey)  active.add('control');
    if (src.altKey)   active.add('alt');
    if (src.metaKey)  active.add('meta');
    return active;
  }

  // ---------------------------------------------------------------------------
  // Core selection engine

  /**
   * Central method.
   * @param seeds  - Only the elements the user directly targeted (clicked/added).
   *                 Degree expansion happens exclusively from these, so previously
   *                 expanded nodes never become re-expansion seeds on shift-click.
   */
  private _applySelection(
    seeds: Set<SelectableElement>,
    _event: ICanvasPointerEvent | null,
  ): void {
    // 0. Expand seeds by degree — iterative hop-by-hop from seeds only.
    const { degree, direction } = this._options;
    let expanded = seeds;
    if (degree > 0 && seeds.size > 0) {
      const graphPlugin = this._canvas?.getPlugin<any>('graph-data');
      if (graphPlugin) {
        expanded = new Set(seeds);
        let currentFrontier = new Set<SelectableElement>(seeds);
        for (let hop = 0; hop < degree; hop++) {
          const nextFrontier = new Set<SelectableElement>();
          for (const el of currentFrontier) {
            const { nodes, edges } = graphPlugin.getNeighborElements(el, 1, direction);
            for (const n of nodes) {
              if (!expanded.has(n)) {
                expanded.add(n);
                nextFrontier.add(n);
              }
            }
            for (const e of edges) {
              expanded.add(e);
            }
          }
          if (nextFrontier.size === 0) break;
          currentFrontier = nextFrontier;
        }
      }
    }

    const prevSelected = new Set(this._selected);

    // 1. Strip old states
    this._clearAllStates();

    // 2. Record seeds and apply new states
    this._seeds = seeds;
    if (expanded.size > 0) {
      // Selected state
      for (const el of expanded) {
        el.setState(this._options.state, true);
        this._selected.add(el);
      }

      // Unselected (dimmed) state
      if (this._options.unselectedState != null && this._options.unselectedState !== '') {
        const graphPlugin = this._canvas?.getPlugin<any>('graph-data');
        if (graphPlugin) {
          const all = [
            ...graphPlugin.getRenderedNodes(),
            ...graphPlugin.getRenderedEdges(),
          ] as SelectableElement[];
          for (const el of all) {
            if (!this._selected.has(el)) {
              el.setState(this._options.unselectedState, true);
              this._unselected.add(el);
            }
          }
        }
      }
    }

    // 3. Emit per-element selection/deselection events
    for (const el of prevSelected) {
      if (!this._selected.has(el)) {
        if (el instanceof RendererNodeBase) {
          this._canvas?.events.emit('node:deselected', { node: el });
        } else {
          this._canvas?.events.emit('edge:deselected', { edge: el as RendererEdgeBase });
        }
      }
    }
    for (const el of this._selected) {
      if (!prevSelected.has(el)) {
        if (el instanceof RendererNodeBase) {
          this._canvas?.events.emit('node:selected', { node: el });
        } else {
          this._canvas?.events.emit('edge:selected', { edge: el as RendererEdgeBase });
        }
      }
    }

    // 4. Aggregate event
    this._emitSelectionChanged();
  }

  /**
   * Remove all managed states from tracked elements and clear buckets.
   * Does NOT emit any events.
   */
  private _clearAllStates(): void {
    for (const el of this._selected) {
      el.setState(this._options.state, false);
    }
    if (this._options.unselectedState) {
      for (const el of this._unselected) {
        el.setState(this._options.unselectedState, false);
      }
    }
    this._seeds.clear();
    this._selected.clear();
    this._unselected.clear();
  }

  // ---------------------------------------------------------------------------
  // Helpers

  private _emitSelectionChanged(): void {
    this._canvas?.events.emit('selection:changed', {
      nodes: this.getSelectedNodes(),
      edges: this.getSelectedEdges(),
    });
  }

  // ---------------------------------------------------------------------------
  // Public API

  /** Select a single element, replacing any existing selection. */
  select(element: SelectableElement): void {
    this._applySelection(new Set([element]), null);
  }

  /** Add an element to the current selection. */
  addToSelection(element: SelectableElement): void {
    if (this._seeds.has(element)) return;
    const next = new Set(this._seeds);
    next.add(element);
    this._applySelection(next, null);
  }

  /** Remove a single element from the current selection. */
  deselect(element: SelectableElement): void {
    if (!this._seeds.has(element)) return;
    const next = new Set(this._seeds);
    next.delete(element);
    this._applySelection(next, null);
  }

  /** Toggle the selection state of an element. */
  toggle(element: SelectableElement): void {
    if (this.isSelected(element)) {
      this.deselect(element);
    } else {
      this.addToSelection(element);
    }
  }

  /** Replace the selection with the provided elements. */
  selectMultiple(elements: SelectableElement[]): void {
    this._applySelection(new Set(elements), null);
  }

  /** Clear the entire selection and all associated states. */
  clearSelection(): void {
    this._applySelection(new Set(), null);
  }

  /** Returns true if the element is currently selected. */
  isSelected(element: SelectableElement): boolean {
    return this._selected.has(element);
  }

  /** Returns all currently selected elements. */
  getSelected(): SelectableElement[] {
    return Array.from(this._selected);
  }

  /** Returns only the currently selected nodes. */
  getSelectedNodes(): RendererNodeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof RendererNodeBase,
    ) as RendererNodeBase[];
  }

  /** Returns only the currently selected edges. */
  getSelectedEdges(): RendererEdgeBase[] {
    return Array.from(this._selected).filter(
      el => el instanceof RendererEdgeBase,
    ) as RendererEdgeBase[];
  }

  /** Read-only snapshot of the current plugin options. */
  get options(): Readonly<Required<ClickSelectOptions>> {
    return this._options;
  }

  /** Merge new option values into the existing configuration.
   * `undefined` values are ignored (use `null` to explicitly disable a state). */
  setOptions(options: Partial<ClickSelectOptions>): void {
    const patch = Object.fromEntries(
      Object.entries(options).filter(([, v]) => v !== undefined)
    ) as Partial<ClickSelectOptions>;
    this._options = { ...this._options, ...patch };
  }

  destroy(): void {
    this._clearAllStates();
    this._canvas = null;
  }
}

// Auto-register plugin
PluginRegistry.register('click-select', ClickSelectPlugin);
