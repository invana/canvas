/**
 * `ClickSelectBehaviour` — toggles a named visual state on clicked nodes /
 * edges with optional N-degree neighbour expansion, modifier-driven
 * multi-select, and optional dimming of unselected elements.
 *
 * Layer-scoped: constructed with a target `layerId`. Subscribes to that
 * layer's renderer click events and to the canvas-level `background:click`
 * for clear-on-background behaviour.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * graph.setNodeStateConfig('selected', { stroke: 0xfacc15, strokeWidth: 3 });
 * graph.setEdgeStateConfig('selected', { stroke: 0xfacc15, strokeWidth: 2 });
 *
 * canvas.behaviours.register(
 *   new ClickSelectBehaviour({
 *     id: 'select',
 *     layerId: 'graph',
 *     enabled: true,
 *     multiple: true,
 *     trigger: ['shift'],
 *     degree: 1,
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import { ModifierTracker, type ModifierKey } from './ModifierTracker';
import type { HoverableElementType, HoverDirection } from './HoverActivateBehaviour';

/** Element kind for selection targets. */
export type SelectableElementType = HoverableElementType;

/** Edge-traversal direction filter. */
export type SelectDirection = HoverDirection;

/** Modifier-key names accepted by `trigger`. */
export type SelectModifierKey = ModifierKey;

/** Element handed to selection callbacks. */
export interface SelectableElement {
  readonly id: string;
  readonly type: SelectableElementType;
  /** Arbitrary user payload from `node.data` or `edge.data`. */
  readonly data: unknown;
}

/** Per-flush snapshot fired to `onSelectionChange`. */
export interface SelectionSnapshot {
  shapeIds: string[];
  connectorIds: string[];
}

/** Constructor options for `ClickSelectBehaviour`. */
export interface ClickSelectBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  layerId: string;

  /**
   * Per-target enable predicate. `boolean` is a global on/off; a function
   * runs per click and may veto. Default `true`.
   */
  enable?: boolean | ((element: SelectableElement) => boolean);

  /** Allow more than one element selected at a time. Default `false`. */
  multiple?: boolean;

  /**
   * Modifier key(s) that activate multi-select mode when held. Consulted
   * only when `multiple` is `true`. Empty array = every click extends.
   * Default `['shift']`.
   */
  trigger?: SelectModifierKey[];

  /**
   * N-hop neighbour radius around each seed. `0` = clicked element only.
   * Default `0`.
   */
  degree?: number;

  /** Direction for neighbour traversal. Default `'both'`. */
  direction?: SelectDirection;

  /** Active-state name. Default `'selected'`. */
  state?: string;

  /**
   * State applied to every element that is *not* selected. `undefined`
   * disables dimming. Default `undefined`.
   */
  unselectedState?: string;

  /** Clear selection when clicking the empty canvas background. Default `true`. */
  clearOnBackground?: boolean;

  /** Fired when an element becomes selected. */
  onSelect?: (element: SelectableElement) => void;
  /** Fired when an element becomes deselected. */
  onDeselect?: (element: SelectableElement) => void;
  /** Fired once per click with the post-settle selection snapshot. */
  onSelectionChange?: (snapshot: SelectionSnapshot) => void;
}

interface ResolvedOptions {
  enable: boolean | ((element: SelectableElement) => boolean);
  multiple: boolean;
  trigger: SelectModifierKey[];
  degree: number;
  direction: SelectDirection;
  state: string;
  unselectedState: string | undefined;
  clearOnBackground: boolean;
  onSelect: ((element: SelectableElement) => void) | undefined;
  onDeselect: ((element: SelectableElement) => void) | undefined;
  onSelectionChange: ((snapshot: SelectionSnapshot) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<ClickSelectBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable: true,
    multiple: false,
    trigger: ['shift'],
    degree: 0,
    direction: 'both',
    state: 'selected',
    unselectedState: undefined,
    clearOnBackground: true,
    onSelect: undefined,
    onDeselect: undefined,
    onSelectionChange: undefined,
  };
  return {
    enable: patch.enable ?? base.enable,
    multiple: patch.multiple ?? base.multiple,
    trigger: patch.trigger ?? base.trigger,
    degree: patch.degree ?? base.degree,
    direction: patch.direction ?? base.direction,
    state: patch.state ?? base.state,
    unselectedState:
      'unselectedState' in patch
        ? patch.unselectedState === ''
          ? undefined
          : patch.unselectedState
        : base.unselectedState,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: 'onSelect' in patch ? patch.onSelect : base.onSelect,
    onDeselect: 'onDeselect' in patch ? patch.onDeselect : base.onDeselect,
    onSelectionChange:
      'onSelectionChange' in patch ? patch.onSelectionChange : base.onSelectionChange,
  };
}

export class ClickSelectBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private opts: ResolvedOptions;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  /** Seed set — ids the user *directly* clicked / passed to `select*`. */
  private seeds = new Map<string, SelectableElementType>();
  /** Expanded set — seeds + degree-expanded neighbours. */
  private selected = new Map<string, SelectableElementType>();
  /** Ids currently rendered with the `unselectedState`. */
  private unselectedIds = new Set<string>();

  /** True when the most recent click already consumed an element. */
  private clickConsumedByElement = false;

  constructor(opts: ClickSelectBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": layer "${this.layerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": target layer is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    ModifierTracker.attach();

    const onShapeClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      this.handleElementClick(e.id, 'shape');
    };
    const onConnClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      this.handleElementClick(e.id, 'connector');
    };
    const onBackgroundClick = () => {
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (this.opts.clearOnBackground) this.clearSelection();
    };

    renderer.events.on('shape:click', onShapeClick);
    renderer.events.on('connector:click', onConnClick);
    const offBg = ctx.events.on('background:click', onBackgroundClick);

    this.subs.push(
      () => renderer.events.off('shape:click', onShapeClick),
      () => renderer.events.off('connector:click', onConnClick),
      offBg,
    );
  }

  protected override onDestroy(): void {
    this.clearSelection();
    for (const off of this.subs) off();
    this.subs.length = 0;
    ModifierTracker.detach();
    this.layer = null;
  }

  protected override onDisable(): void {
    this.clearSelection();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /**
   * Runtime option update. State-affecting changes clear the current
   * visual selection and re-apply with the new options.
   */
  setOptions(patch: Partial<ClickSelectBehaviourOptions>): void {
    const prev = this.opts;
    const stateChanged = patch.state !== undefined && patch.state !== prev.state;
    const unselChanged =
      'unselectedState' in patch &&
      (patch.unselectedState === '' ? undefined : patch.unselectedState) !==
        prev.unselectedState;
    const expansionChanged =
      (patch.degree !== undefined && patch.degree !== prev.degree) ||
      (patch.direction !== undefined && patch.direction !== prev.direction);

    const seedsSnapshot = new Map(this.seeds);
    const hadSelection = this.selected.size > 0;

    if (hadSelection && (stateChanged || unselChanged || expansionChanged)) {
      this.clearVisualsOnly();
    }
    this.opts = resolveOptions(this.opts, patch);
    if (hadSelection && (stateChanged || unselChanged || expansionChanged)) {
      this.applySelection(seedsSnapshot, false);
    }
  }

  /** Replace the selection with a single element. */
  select(id: string, type: SelectableElementType = 'shape'): void {
    this.applySelection(new Map([[id, type]]), true);
  }

  /** Replace the selection with the given (id, type) pairs. */
  selectMultiple(elements: Array<{ id: string; type?: SelectableElementType }>): void {
    const next = new Map<string, SelectableElementType>();
    for (const el of elements) next.set(el.id, el.type ?? 'shape');
    this.applySelection(next, true);
  }

  /** Add a single element to the current selection. */
  addToSelection(id: string, type: SelectableElementType = 'shape'): void {
    if (this.seeds.has(id)) return;
    const next = new Map(this.seeds);
    next.set(id, type);
    this.applySelection(next, true);
  }

  /** Remove a single element from the current selection. */
  deselect(id: string): void {
    if (!this.seeds.has(id)) return;
    const next = new Map(this.seeds);
    next.delete(id);
    this.applySelection(next, true);
  }

  /** Toggle the membership of `id` in the selection. */
  toggle(id: string, type: SelectableElementType = 'shape'): void {
    if (this.seeds.has(id)) this.deselect(id);
    else this.addToSelection(id, type);
  }

  /** True iff `id` is part of the rendered selection (seed or expanded). */
  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  /** All currently selected ids (seeds + expanded). */
  getSelectedIds(): string[] {
    return [...this.selected.keys()];
  }

  /** Currently selected shape (node) ids. */
  getSelectedShapeIds(): string[] {
    const out: string[] = [];
    for (const [id, type] of this.selected) if (type === 'shape') out.push(id);
    return out;
  }

  /** Currently selected connector (edge) ids. */
  getSelectedConnectorIds(): string[] {
    const out: string[] = [];
    for (const [id, type] of this.selected) if (type === 'connector') out.push(id);
    return out;
  }

  /** Clear the entire selection and any dimming. */
  clearSelection(): void {
    if (this.selected.size === 0 && this.unselectedIds.size === 0 && this.seeds.size === 0)
      return;
    this.applySelection(new Map(), true);
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private handleElementClick(id: string, type: SelectableElementType): void {
    if (!this._enabled) return;
    const target = this.resolveElement(id, type);
    if (!target) return;
    const { enable } = this.opts;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(target)) return;

    const { multiple, trigger } = this.opts;
    const isMultiKey =
      multiple && (trigger.length === 0 || ModifierTracker.anyHeld(trigger));

    if (isMultiKey) {
      const next = new Map(this.seeds);
      if (next.has(id)) next.delete(id);
      else next.set(id, type);
      this.applySelection(next, true);
    } else {
      this.applySelection(new Map([[id, type]]), true);
    }
  }

  /**
   * Core selection engine: replace seeds, recompute expansion, swap visuals,
   * diff-emit callbacks.
   */
  private applySelection(
    seeds: Map<string, SelectableElementType>,
    emitEvents: boolean,
  ): void {
    if (!this.layer) return;
    const expanded = this.expandSeeds(seeds);
    const prevSelected = new Map(this.selected);

    this.clearVisualsOnly();

    this.seeds = new Map(seeds);
    this.selected = new Map(expanded);
    for (const [id, type] of this.selected) {
      if (type === 'shape') this.layer.setNodeState(id, this.opts.state, true);
      else this.layer.setEdgeState(id, this.opts.state, true);
    }

    if (this.opts.unselectedState && this.selected.size > 0) {
      this.applyUnselected(this.selected);
    }

    if (!emitEvents) return;

    // Diff and fire callbacks.
    for (const [id, type] of prevSelected) {
      if (this.selected.has(id)) continue;
      const target = this.resolveElement(id, type);
      if (target) this.opts.onDeselect?.(target);
    }
    for (const [id, type] of this.selected) {
      if (prevSelected.has(id)) continue;
      const target = this.resolveElement(id, type);
      if (target) this.opts.onSelect?.(target);
    }
    if (this.opts.onSelectionChange) {
      this.opts.onSelectionChange(this.buildSnapshot());
    }
  }

  /** Expand seeds by `degree` hops (BFS) — same shape as HoverActivate. */
  private expandSeeds(
    seeds: Map<string, SelectableElementType>,
  ): Map<string, SelectableElementType> {
    const expanded = new Map(seeds);
    const { degree, direction } = this.opts;
    if (!this.layer || degree <= 0 || seeds.size === 0) return expanded;
    const store = this.layer.store;

    let frontier: string[] = [];
    for (const [id, type] of seeds) if (type === 'shape') frontier.push(id);

    for (let hop = 0; hop < degree && frontier.length > 0; hop++) {
      const next: string[] = [];
      for (const u of frontier) {
        for (const e of store.edgesOf(u, direction)) {
          if (!expanded.has(e.id)) expanded.set(e.id, 'connector');
          const otherId = e.source === u ? e.target : e.source;
          if (!expanded.has(otherId)) {
            expanded.set(otherId, 'shape');
            next.push(otherId);
          }
        }
      }
      frontier = next;
    }
    return expanded;
  }

  private clearVisualsOnly(): void {
    if (!this.layer) {
      this.seeds.clear();
      this.selected.clear();
      this.unselectedIds.clear();
      return;
    }
    for (const [id, type] of this.selected) {
      if (type === 'shape') this.layer.setNodeState(id, this.opts.state, false);
      else this.layer.setEdgeState(id, this.opts.state, false);
    }
    const unsel = this.opts.unselectedState;
    if (unsel) {
      for (const id of this.unselectedIds) {
        this.layer.setNodeState(id, unsel, false);
        this.layer.setEdgeState(id, unsel, false);
      }
    }
    this.seeds.clear();
    this.selected.clear();
    this.unselectedIds.clear();
  }

  private applyUnselected(selected: Map<string, SelectableElementType>): void {
    const unsel = this.opts.unselectedState;
    if (!unsel || !this.layer) return;
    for (const node of this.layer.store.nodes()) {
      if (selected.has(node.id)) continue;
      this.layer.setNodeState(node.id, unsel, true);
      this.unselectedIds.add(node.id);
    }
    for (const edge of this.layer.store.edges()) {
      if (selected.has(edge.id)) continue;
      this.layer.setEdgeState(edge.id, unsel, true);
      this.unselectedIds.add(edge.id);
    }
  }

  private resolveElement(id: string, type: SelectableElementType): SelectableElement | null {
    if (!this.layer) return null;
    if (type === 'shape') {
      const node = this.layer.store.getNode(id);
      return node ? { id, type, data: node.data } : null;
    }
    const edge = this.layer.store.getEdge(id);
    return edge ? { id, type, data: edge.data } : null;
  }

  private buildSnapshot(): SelectionSnapshot {
    const shapeIds: string[] = [];
    const connectorIds: string[] = [];
    for (const [id, type] of this.selected) {
      if (type === 'shape') shapeIds.push(id);
      else connectorIds.push(id);
    }
    return { shapeIds, connectorIds };
  }
}
