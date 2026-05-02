// ── ClickSelectPlugin ─────────────────────────────────────────────────────────
// Behaviour plugin: applies a state to clicked nodes/edges (and optionally
// their neighbours up to N hops). Supports single + multi-select with
// configurable modifier keys, optional dimming of unselected elements, and
// optional clear-on-background-click. All options are runtime-mutable via
// setOptions().
//
// This plugin is **opt-in** — register it explicitly when click selection is
// desired. It does not modify any visual state until a click happens.

import type {
  CanvasPlugin,
  PluginContext,
  CanvasEventMap,
} from '@invana/canvas-deprecated';
import type { BaseShape, BaseConnector } from '@invana/plugins-shapes-deprecated';
import type { GraphDataPlugin } from '../GraphDataPlugin.js';
import type { TraversalDirection } from '../graph-types.js';
import { SelectionStore } from '../state/SelectionStore.js';

type Handler<K extends keyof CanvasEventMap> = (e: CanvasEventMap[K]) => void;

/** Element kind for selection targets. */
export type SelectableElementType = 'shape' | 'connector';

/**
 * Element handed to selection callbacks — `id`, `type`, and the underlying
 * rendered shape/connector instance.
 */
export interface SelectableElement {
  readonly id:      string;
  readonly type:    SelectableElementType;
  readonly element: BaseShape | BaseConnector;
}

/**
 * Edge direction filter for neighbour traversal.
 * Alias of {@link TraversalDirection} for plugin-local readability.
 */
export type SelectDirection = TraversalDirection;

/** Modifier-key names accepted by {@link ClickSelectPluginOptions.trigger}. */
export type SelectModifierKey = 'shift' | 'control' | 'alt' | 'meta';

/** Constructor / `setOptions` payload for {@link ClickSelectPlugin}. */
export interface ClickSelectPluginOptions {
  /** Plugin id override. Default: `'click-select'`. */
  key?: string;
  /**
   * Id of the {@link GraphDataPlugin} this plugin reads/writes through.
   * Default: `'graph-data'`.
   */
  graphDataId?: string;

  /**
   * Whether click selection is enabled.
   * `boolean` — global on/off.
   * `(element) => boolean` — per-element predicate.
   * Default: `true`.
   */
  enable?: boolean | ((element: SelectableElement) => boolean);

  /** Allow selecting more than one element at a time. Default: `false`. */
  multiple?: boolean;

  /**
   * Modifier key(s) that, when held during a click, activate multi-select.
   * Only consulted when `multiple` is `true`.
   * Pass an empty array to make every click extend the selection.
   * Default: `['shift']`.
   */
  trigger?: SelectModifierKey[];

  /**
   * Number of hops to expand from each clicked element.
   * Neighbours within `degree` hops are added to the selection (same `state`).
   * `0` = only the directly clicked element; `1` = direct neighbours; etc.
   * Default: `0`.
   */
  degree?: number;

  /** Edge-traversal direction when expanding neighbours. Default: `'both'`. */
  direction?: SelectDirection;

  /** State applied to every selected element (clicked + expanded). Default: `'selected'`. */
  state?: string;

  /**
   * State applied to every element that is NOT selected.
   * `undefined` (default) or `''` disables dimming.
   */
  unselectedState?: string;

  /** Clear the selection when clicking the empty canvas background. Default: `true`. */
  clearOnBackground?: boolean;

  /** Called when an element becomes selected (after expansion). */
  onSelect?: (element: SelectableElement) => void;
  /** Called when an element becomes deselected. */
  onDeselect?: (element: SelectableElement) => void;
  /** Called once per click after the selection has settled. */
  onSelectionChange?: (snapshot: { shapeIds: string[]; connectorIds: string[] }) => void;
}

interface ResolvedOptions {
  enable:            boolean | ((element: SelectableElement) => boolean);
  multiple:          boolean;
  trigger:           SelectModifierKey[];
  degree:            number;
  direction:         SelectDirection;
  state:             string;
  unselectedState:   string | undefined;
  clearOnBackground: boolean;
  onSelect:          ((element: SelectableElement) => void) | undefined;
  onDeselect:        ((element: SelectableElement) => void) | undefined;
  onSelectionChange: ((snapshot: { shapeIds: string[]; connectorIds: string[] }) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: ClickSelectPluginOptions,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable:            true,
    multiple:          false,
    trigger:           ['shift'],
    degree:            0,
    direction:         'both',
    state:             'selected',
    unselectedState:   undefined,
    clearOnBackground: true,
    onSelect:          undefined,
    onDeselect:        undefined,
    onSelectionChange: undefined,
  };
  return {
    enable:            patch.enable            ?? base.enable,
    multiple:          patch.multiple          ?? base.multiple,
    trigger:           patch.trigger           ?? base.trigger,
    degree:            patch.degree            ?? base.degree,
    direction:         patch.direction         ?? base.direction,
    state:             patch.state             ?? base.state,
    unselectedState:   'unselectedState'   in patch
      ? (patch.unselectedState === '' ? undefined : patch.unselectedState)
      : base.unselectedState,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect:          'onSelect'          in patch ? patch.onSelect          : base.onSelect,
    onDeselect:        'onDeselect'        in patch ? patch.onDeselect        : base.onDeselect,
    onSelectionChange: 'onSelectionChange' in patch ? patch.onSelectionChange : base.onSelectionChange,
  };
}

/**
 * `ClickSelectPlugin` — toggles a state on clicked nodes/edges with optional
 * N-degree neighbour highlighting, modifier-driven multi-select, and
 * dimming of unselected elements.
 *
 * @remarks
 * Looks up an existing {@link GraphDataPlugin} via `ctx.getPlugin()` at
 * registration time and uses its public methods to drive visuals. Exposes
 * a {@link SelectionStore} (`plugin.store`) for downstream consumers.
 *
 * Edges only emit `shape:click` events when their `interactive` flag is set
 * to `true` on the {@link IEdgeData} (default for connectors is `false`).
 *
 * @example
 * ```ts
 * await canvas.plugins.register(new GraphDataPlugin({ data }));
 * await canvas.plugins.register(new ClickSelectPlugin({
 *   multiple:        true,
 *   trigger:         ['shift'],
 *   degree:          1,
 *   direction:       'both',
 *   state:           'selected',
 *   unselectedState: 'muted',
 * }));
 * ```
 */
export class ClickSelectPlugin implements CanvasPlugin {
  readonly id: string;

  /** Live selection store updated by this plugin. */
  readonly store = new SelectionStore();

  private readonly _graphDataId: string;

  private _options: ResolvedOptions;
  private _graph:   GraphDataPlugin | null = null;
  private _ctx:     PluginContext   | null = null;

  private _onShapeClick:  Handler<'shape:click'>     | null = null;
  private _onCanvasClick: Handler<'canvas:clicked'>  | null = null;

  // Seeds — ids the user directly clicked/added (never degree-expanded).
  // Selected — every id rendered as selected: seeds + degree-expanded.
  // Unselected — every id currently rendered as `unselectedState`.
  // Keeping seeds and selected separate prevents re-expanding expanded nodes
  // when shift-clicking another node.
  private _seeds          = new Map<string, SelectableElementType>();
  private _selected       = new Map<string, SelectableElementType>();
  private _unselectedIds  = new Set<string>();

  // ShapesPlugin's `canvas:clicked` handler runs before ours and synchronously
  // re-emits `shape:click` when a shape is hit. To avoid clearing the
  // selection on the same dispatch where a shape was clicked, the shape
  // handler sets this one-shot flag, which the canvas handler reads and resets.
  private _shapeClickInFlight = false;

  constructor(options: ClickSelectPluginOptions = {}) {
    this.id           = options.key         ?? 'click-select';
    this._graphDataId = options.graphDataId ?? 'graph-data';
    this._options     = resolveOptions(null, options);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    const graph = ctx.getPlugin<GraphDataPlugin>(this._graphDataId);
    if (!graph) {
      throw new Error(
        `[ClickSelectPlugin] requires a GraphDataPlugin registered with id "${this._graphDataId}". ` +
        `Register it before ClickSelectPlugin.`,
      );
    }
    this._graph = graph;
    this._ctx   = ctx;

    this._onShapeClick = (e) => {
      this._shapeClickInFlight = true;
      this._handleShapeClick(e.elementId, e.elementType, e.nativeEvent);
    };
    this._onCanvasClick = () => {
      // Skip if a `shape:click` was emitted earlier in the same dispatch chain
      // — that means the user clicked a shape, not the empty background.
      if (this._shapeClickInFlight) {
        this._shapeClickInFlight = false;
        return;
      }
      if (this._options.clearOnBackground) this.clearSelection();
    };

    ctx.events.on('shape:click',    this._onShapeClick);
    ctx.events.on('canvas:clicked', this._onCanvasClick);
  }

  destroy(): void {
    this.clearSelection();
    if (this._ctx && this._onShapeClick)  this._ctx.events.off('shape:click',    this._onShapeClick);
    if (this._ctx && this._onCanvasClick) this._ctx.events.off('canvas:clicked', this._onCanvasClick);
    this._onShapeClick  = null;
    this._onCanvasClick = null;
    this._ctx           = null;
    this.store.clear();
    this.store.removeAllListeners();
    this._graph = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this._options;
  }

  /**
   * Update one or more options at runtime. Any in-flight selection visuals
   * are cleared first when `state` or `unselectedState` change, then the
   * current seed set is re-applied so the new states render cleanly.
   */
  setOptions(patch: Partial<ClickSelectPluginOptions>): void {
    const prevOptions     = this._options;
    const stateChanged    = patch.state           !== undefined && patch.state           !== prevOptions.state;
    const unselectedChanged =
      'unselectedState' in patch &&
      (patch.unselectedState === '' ? undefined : patch.unselectedState) !== prevOptions.unselectedState;
    const expansionChanged =
      (patch.degree    !== undefined && patch.degree    !== prevOptions.degree) ||
      (patch.direction !== undefined && patch.direction !== prevOptions.direction);

    const seedsSnapshot = new Map(this._seeds);
    const hadSelection  = this._selected.size > 0;

    if (hadSelection && (stateChanged || unselectedChanged || expansionChanged)) {
      // Remove old visuals using *current* options before swapping.
      this._clearVisualsOnly();
    }

    this._options = resolveOptions(this._options, patch);

    // Re-apply with new options.
    if (hadSelection && (stateChanged || unselectedChanged || expansionChanged)) {
      this._applySelection(seedsSnapshot, /*emitEvents*/ false);
    }
  }

  /** Replace the selection with a single element. */
  select(id: string, type: SelectableElementType = 'shape'): void {
    this._applySelection(new Map([[id, type]]), true);
  }

  /** Replace the selection with the given list of (id, type) pairs. */
  selectMultiple(elements: Array<{ id: string; type?: SelectableElementType }>): void {
    const next = new Map<string, SelectableElementType>();
    for (const el of elements) next.set(el.id, el.type ?? 'shape');
    this._applySelection(next, true);
  }

  /** Add a single element to the current selection. */
  addToSelection(id: string, type: SelectableElementType = 'shape'): void {
    if (this._seeds.has(id)) return;
    const next = new Map(this._seeds);
    next.set(id, type);
    this._applySelection(next, true);
  }

  /** Remove a single element from the current selection. */
  deselect(id: string): void {
    if (!this._seeds.has(id)) return;
    const next = new Map(this._seeds);
    next.delete(id);
    this._applySelection(next, true);
  }

  /** Toggle the selection state of an element. */
  toggle(id: string, type: SelectableElementType = 'shape'): void {
    if (this._seeds.has(id)) {
      this.deselect(id);
    } else {
      this.addToSelection(id, type);
    }
  }

  /** `true` when `id` is part of the rendered selection (seed *or* expanded). */
  isSelected(id: string): boolean {
    return this._selected.has(id);
  }

  /** All currently selected ids (seeds + expanded). */
  getSelectedIds(): string[] {
    return [...this._selected.keys()];
  }

  /** Currently selected shape (node) ids. */
  getSelectedShapeIds(): string[] {
    const out: string[] = [];
    for (const [id, type] of this._selected) if (type === 'shape') out.push(id);
    return out;
  }

  /** Currently selected connector (edge) ids. */
  getSelectedConnectorIds(): string[] {
    const out: string[] = [];
    for (const [id, type] of this._selected) if (type === 'connector') out.push(id);
    return out;
  }

  /** Clear the entire selection and all associated states. */
  clearSelection(): void {
    if (this._selected.size === 0 && this._unselectedIds.size === 0 && this._seeds.size === 0) return;
    this._applySelection(new Map(), true);
  }

  // ── Internal — click handlers ─────────────────────────────────────────────

  private _handleShapeClick(
    id: string,
    type: SelectableElementType,
    nativeEvent: PointerEvent,
  ): void {
    const target = this._resolveElement(id, type);
    if (!target) return;

    const { enable } = this._options;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(target)) return;

    const { multiple, trigger } = this._options;
    const activeModifiers = this._activeModifiers(nativeEvent);
    // Empty trigger array means no modifier required — `multiple: true` alone is sufficient.
    const isMultiKey =
      multiple &&
      (trigger.length === 0 || trigger.some(k => activeModifiers.has(k.toLowerCase())));

    if (isMultiKey) {
      const next = new Map(this._seeds);
      if (next.has(id)) next.delete(id);
      else              next.set(id, type);
      this._applySelection(next, true);
    } else {
      this._applySelection(new Map([[id, type]]), true);
    }
  }

  private _activeModifiers(event: PointerEvent | MouseEvent): Set<string> {
    const active = new Set<string>();
    if (event.shiftKey) active.add('shift');
    if (event.ctrlKey)  active.add('control');
    if (event.altKey)   active.add('alt');
    if (event.metaKey)  active.add('meta');
    return active;
  }

  // ── Core selection engine ─────────────────────────────────────────────────

  /**
   * Central method: replace the seed set, recompute expansion, swap visuals,
   * fire callbacks/events.
   *
   * @param seeds      The new seed set — only the ids the user directly
   *                   targeted. Degree expansion is computed from these.
   * @param emitEvents When `false`, suppresses `onSelect` / `onDeselect` /
   *                   `onSelectionChange` and `selection:*` store events
   *                   (used by `setOptions` re-application).
   */
  private _applySelection(
    seeds: Map<string, SelectableElementType>,
    emitEvents: boolean,
  ): void {
    const graph = this._graph;
    if (!graph) return;

    // 1. Compute expanded set from seeds (seeds + neighbours within `degree`).
    const expanded = this._expandSeeds(seeds);

    // 2. Snapshot previous selected ids for diffing.
    const prevSelected = new Map(this._selected);

    // 3. Strip old visual states.
    this._clearVisualsOnly();

    // 4. Record new seed/selected sets and apply states.
    this._seeds    = new Map(seeds);
    this._selected = new Map(expanded);
    for (const id of this._selected.keys()) {
      graph.setState(id, this._options.state, true);
    }

    // 5. Apply unselected (dim) state to everything else.
    if (this._options.unselectedState && this._selected.size > 0) {
      this._applyUnselected(graph, this._selected);
    }

    // 6. Diff and emit per-element events.
    if (emitEvents) {
      // Removed
      for (const [id, type] of prevSelected) {
        if (!this._selected.has(id)) {
          this.store.delete(id);
          const target = this._resolveElement(id, type);
          if (target) this._options.onDeselect?.(target);
        }
      }
      // Added
      for (const [id, type] of this._selected) {
        if (!prevSelected.has(id)) {
          this.store.add(id, type);
          const target = this._resolveElement(id, type);
          if (target) this._options.onSelect?.(target);
        }
      }
      // Aggregate
      const snapshot = this.store.snapshot();
      this.store.emitChanged();
      this._options.onSelectionChange?.(snapshot);
    } else {
      // Re-sync store silently after option-driven re-application.
      this.store.clear();
      for (const [id, type] of this._selected) this.store.add(id, type);
      this.store.emitChanged();
    }
  }

  /** Expand seeds by `degree` hops (BFS from seeds only). */
  private _expandSeeds(
    seeds: Map<string, SelectableElementType>,
  ): Map<string, SelectableElementType> {
    const expanded = new Map(seeds);
    const { degree, direction } = this._options;
    const graph = this._graph;
    if (!graph || degree <= 0 || seeds.size === 0) return expanded;

    let currentFrontier: string[] = [];
    for (const [id, type] of seeds) {
      if (type === 'shape') currentFrontier.push(id);
    }

    for (let hop = 0; hop < degree && currentFrontier.length > 0; hop++) {
      const nextFrontier: string[] = [];
      for (const nodeId of currentFrontier) {
        const { nodeIds, edgeIds } = graph.getNeighborElements(nodeId, 1, direction);
        for (const nid of nodeIds) {
          if (!expanded.has(nid)) {
            expanded.set(nid, 'shape');
            nextFrontier.push(nid);
          }
        }
        for (const eid of edgeIds) {
          if (!expanded.has(eid)) expanded.set(eid, 'connector');
        }
      }
      currentFrontier = nextFrontier;
    }
    return expanded;
  }

  /** Strip every state currently applied by this plugin. Resets internal sets. */
  private _clearVisualsOnly(): void {
    const graph = this._graph;
    if (!graph) {
      this._seeds.clear();
      this._selected.clear();
      this._unselectedIds.clear();
      return;
    }
    for (const id of this._selected.keys()) {
      graph.setState(id, this._options.state, false);
    }
    if (this._options.unselectedState) {
      for (const id of this._unselectedIds) {
        graph.setState(id, this._options.unselectedState, false);
      }
    }
    this._seeds.clear();
    this._selected.clear();
    this._unselectedIds.clear();
  }

  private _applyUnselected(
    graph: GraphDataPlugin,
    selected: Map<string, SelectableElementType>,
  ): void {
    const unselectedState = this._options.unselectedState;
    if (!unselectedState) return;
    for (const nid of graph.getRenderedNodeIds()) {
      if (selected.has(nid)) continue;
      graph.setState(nid, unselectedState, true);
      this._unselectedIds.add(nid);
    }
    for (const eid of graph.getRenderedEdgeIds()) {
      if (selected.has(eid)) continue;
      graph.setState(eid, unselectedState, true);
      this._unselectedIds.add(eid);
    }
  }

  private _resolveElement(id: string, type: SelectableElementType): SelectableElement | null {
    const graph = this._graph;
    if (!graph) return null;
    if (type === 'shape') {
      const element = graph.getNodeElement(id);
      return element ? { id, type, element } : null;
    }
    const element = graph.getEdgeElement(id);
    return element ? { id, type, element } : null;
  }
}
