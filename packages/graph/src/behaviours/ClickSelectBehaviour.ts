/**
 * `ClickSelectBehaviour` — toggles a named visual state on clicked nodes /
 * edges with optional N-degree neighbour expansion, modifier-driven
 * multi-select, and optional dimming of unselected elements.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that
 * layer's renderer click events and to the canvas-level `background:click`
 * for clear-on-background behaviour.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * The canonical `selected` state is auto-merged into every
 * `GraphLayer`'s state catalogue — no setup needed. Override the layer's
 * `options.node.state.selected` to customise the visual.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ClickSelectBehaviour({
 *     id: 'select',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     multiple: true,
 *     degree: 1,
 *   }),
 * );
 * ```
 */

import { Behaviour, EventEmitter, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

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

/** Event-map for {@link ClickSelectBehaviour.events}. */
export type ClickSelectEventMap = {
  /**
   * Fired once whenever the selection set is replaced (click, `select*`,
   * `clearSelection`, or brush/lasso delegation). The non-clobbering complement
   * to the `onSelectionChange` callback — observers (e.g. the canvas-react
   * `useSelection` hook) subscribe here instead of hijacking the callback.
   */
  'selection:change': SelectionSnapshot;
};

/** Constructor options for `ClickSelectBehaviour`. */
export interface ClickSelectBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;

  /**
   * Per-target enable predicate. `boolean` is a global on/off; a function
   * runs per click and may veto. Default `true`.
   */
  enable?: boolean | ((element: SelectableElement) => boolean);

  /**
   * Allow more than one element selected at a time. When `true`, a qualifying
   * click (see `trigger`) toggles the element in/out of the selection; when
   * `false` it replaces the selection with the clicked element. Default `false`.
   */
  multiple?: boolean;

  /**
   * Modifier key(s) required for a click to affect the selection **at all**.
   * When non-empty, a click that holds none of these is ignored — a plain
   * (unmodified) click selects nothing, and a plain left-drag stays a pure
   * pan. With a modifier held, the click selects (replacing the selection, or
   * toggling membership when `multiple` is `true`). Empty array = every click
   * selects, no modifier needed. Default `[]` (plain click selects). Pass
   * `['shift']` to gate selection behind the Shift key.
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

  /**
   * Lift the selected set (seeds + degree-expanded neighbours) above the rest
   * within its render layer, so unrelated nodes / edges don't paint over the
   * selection. Edges raise above other edges (still below all nodes); nodes
   * raise above other nodes. Reset when the selection clears. Visual-only —
   * restacking doesn't affect hit-testing. Default `true`.
   */
  raiseActive?: boolean;

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
  raiseActive: boolean;
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
    trigger: [],
    degree: 0,
    direction: 'both',
    state: 'selected',
    unselectedState: undefined,
    raiseActive: true,
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
    raiseActive: patch.raiseActive ?? base.raiseActive,
    clearOnBackground: patch.clearOnBackground ?? base.clearOnBackground,
    onSelect: 'onSelect' in patch ? patch.onSelect : base.onSelect,
    onDeselect: 'onDeselect' in patch ? patch.onDeselect : base.onDeselect,
    onSelectionChange:
      'onSelectionChange' in patch ? patch.onSelectionChange : base.onSelectionChange,
  };
}

export class ClickSelectBehaviour extends Behaviour {
  override readonly kind = 'click-select';
  /**
   * Selection event bus. Subscribe to `'selection:change'` for a reactive
   * snapshot every time the selection set is replaced. Independent of (and
   * additive to) the `onSelectionChange` option.
   */
  readonly events = new EventEmitter<ClickSelectEventMap>();

  private layer: GraphLayer | null = null;
  private opts: ResolvedOptions;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  /**
   * Kernel store — the semantic selection set is mirrored into
   * `view.interaction.selection` (D11) so it's observable (`useStore`), tap-able
   * (telemetry), and syncable (Awareness) without readers touching this behaviour.
   * The behaviour keeps owning the interaction *machinery* (expansion / dimming /
   * z-raise) and the render visuals (`GraphStore` runtime states).
   */
  private _canvasStore?: CanvasContext['store'];

  /** Seed set — ids the user *directly* clicked / passed to `select*`. */
  private seeds = new Map<string, SelectableElementType>();
  /** Expanded set — seeds + degree-expanded neighbours. */
  private selected = new Map<string, SelectableElementType>();
  /** Ids currently rendered with the `unselectedState`. */
  private unselectedIds = new Set<string>();

  /** True when the most recent click already consumed an element. */
  private clickConsumedByElement = false;

  /** Pointerdown screen-position — used to distinguish a click from a drag. */
  private pointerDownScreen: { x: number; y: number } | null = null;

  /**
   * Set once the pointer travels past the click/drag threshold while a button
   * is held. Used to suppress the synthetic element `click` that fires at the
   * end of a node drag — without it, dragging a selected node would collapse
   * the whole selection down to that one node on release.
   */
  private pressMoved = false;

  constructor(opts: ClickSelectBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this._canvasStore = ctx.store;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ClickSelectBehaviour "${this.id}": target layer is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    ModifierTracker.attach();

    // Project the *shared* lift state onto the renderer — the union of every
    // source's ids, so a selection lift and a hover lift reconcile in one call
    // instead of lowering each other's elements. Idempotent; a sibling
    // behaviour projecting the same state is harmless, and having each raiser
    // carry the wiring means the projection exists whenever any of them does.
    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        if (state.interaction.raised === prev.interaction.raised) return;
        const union = new Set<string>();
        for (const ids of Object.values(state.interaction.raised)) {
          for (const id of ids) union.add(id);
        }
        layer.getRenderer()?.setRaised(union);
      }),
    );

    const onShapeClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      // A drag (e.g. moving a selected node) ends with a synthetic element
      // click; ignore it so the gesture doesn't replace the selection.
      if (this.pressMoved) return;
      this.handleElementClick(e.id, 'shape');
    };
    const onConnClick = (e: { id: string }) => {
      this.clickConsumedByElement = true;
      if (this.pressMoved) return;
      this.handleElementClick(e.id, 'connector');
    };
    // `background:click` is declared on the canvas event bus but the engine
    // doesn't emit it today, so we listen to native DOM `click` on the canvas
    // element instead. PixiJS dispatches `shape:click` / `connector:click`
    // synchronously *during* the DOM event, so by the time this handler runs
    // `clickConsumedByElement` is already set when a shape was hit.
    //
    // We also track pointerdown screen-position to distinguish a click
    // (small movement) from a drag (e.g. brush / lasso select). A click
    // after a drag would otherwise clear the just-applied selection.
    const DRAG_VS_CLICK_THRESHOLD_PX = 4;
    const onPointerDown = (e: PointerEvent) => {
      this.pressMoved = false;
      if (e.button !== 0) {
        this.pointerDownScreen = null;
        return;
      }
      this.pointerDownScreen = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      const down = this.pointerDownScreen;
      if (!down || this.pressMoved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_THRESHOLD_PX) {
        this.pressMoved = true;
      }
    };
    const onCanvasClick = (e: MouseEvent) => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (e.button !== 0) return;
      // If the pointer moved more than the threshold between pointerdown
      // and click, this was a drag — don't treat it as a background click.
      if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > DRAG_VS_CLICK_THRESHOLD_PX) return;
      }
      if (this.opts.clearOnBackground) this.clearSelection();
    };

    renderer.events.on('shape:click', onShapeClick);
    renderer.events.on('connector:click', onConnClick);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('click', onCanvasClick);
    }

    this.subs.push(
      () => renderer.events.off('shape:click', onShapeClick),
      () => renderer.events.off('connector:click', onConnClick),
      () => {
        if (el) {
          el.removeEventListener('pointerdown', onPointerDown);
          el.removeEventListener('pointermove', onPointerMove);
          el.removeEventListener('click', onCanvasClick);
        }
      },
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
    const raiseChanged =
      patch.raiseActive !== undefined && patch.raiseActive !== prev.raiseActive;

    const seedsSnapshot = new Map(this.seeds);
    const hadSelection = this.selected.size > 0;
    const reapply = hadSelection && (stateChanged || unselChanged || expansionChanged);

    if (reapply) this.clearVisualsOnly();
    this.opts = resolveOptions(this.opts, patch);
    if (reapply) {
      // The full reapply path re-raises through the new opts already.
      this.applySelection(seedsSnapshot, false);
    } else if (hadSelection && raiseChanged) {
      // Pure raise toggle on a live selection — apply / reset in place.
      if (this.opts.raiseActive) this.applyRaise();
      else this.resetRaise();
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

  /**
   * Select every node and edge on the target layer. Replaces the current
   * selection. No-op if the layer isn't mounted.
   */
  selectAll(): void {
    if (!this.layer) return;
    const store = this.layer.store;
    const next: Array<{ id: string; type: SelectableElementType }> = [];
    // Skip effectively-hidden elements — you can't select what you can't see.
    for (const node of store.nodes()) {
      if (node.hidden === true) continue;
      next.push({ id: node.id, type: 'shape' });
    }
    for (const edge of store.edges()) {
      if (!store.isEdgeVisible(edge.id)) continue;
      next.push({ id: edge.id, type: 'connector' });
    }
    this.selectMultiple(next);
  }

  /**
   * Select a node together with its neighbours (in the given direction) and the
   * edges incident to it. Replaces the current selection. No-op if the layer
   * isn't mounted.
   *
   * @param id  Seed node id.
   * @param dir Adjacency direction for neighbours + incident edges. Default `'both'`.
   */
  selectNeighbourhood(id: string, dir: 'in' | 'out' | 'both' = 'both'): void {
    if (!this.layer) return;
    const store = this.layer.store;
    const next: Array<{ id: string; type: SelectableElementType }> = [{ id, type: 'shape' }];
    // Skip hidden neighbours + edges so the neighbourhood select mirrors what's
    // visible.
    for (const nb of store.neighborsOf(id, dir)) {
      if (store.isNodeHidden(nb)) continue;
      next.push({ id: nb, type: 'shape' });
    }
    for (const e of store.edgesOf(id, dir)) {
      if (!store.isEdgeVisible(e.id)) continue;
      next.push({ id: e.id, type: 'connector' });
    }
    this.selectMultiple(next);
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
    // `trigger` gates selection entirely: with a modifier configured, a click
    // that holds none of them is a no-op (plain click selects nothing; a plain
    // drag stays a pure pan). Empty `trigger` = every click selects.
    if (trigger.length > 0 && !ModifierTracker.anyHeld(trigger)) return;

    if (multiple) {
      // Toggle membership — extend or shrink the existing selection.
      const next = new Map(this.seeds);
      if (next.has(id)) next.delete(id);
      else next.set(id, type);
      this.applySelection(next, true);
    } else {
      // Single-select — replace the selection with just this element.
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
      if (type === 'shape') this.layer.store.setNodeState(id, this.opts.state, true);
      else this.layer.store.setEdgeState(id, this.opts.state, true);
    }

    if (this.opts.unselectedState && this.selected.size > 0) {
      this.applyUnselected(this.selected);
    }

    // Lift the selected set above the rest so unrelated nodes / edges don't
    // paint over it.
    if (this.opts.raiseActive) this.applyRaise();

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
    const snapshot = this.buildSnapshot();
    if (this.opts.onSelectionChange) this.opts.onSelectionChange(snapshot);
    this.events.emit('selection:change', snapshot);

    // Mirror the semantic selection (nodes + edges) into the kernel's
    // `view.interaction.selection` (D11) — the single point every mode reaches
    // (lasso/brush delegate here). One `set` per change; readers subscribe to the
    // store slice instead of this behaviour's event.
    this._canvasStore?.actions.selection.set([...snapshot.shapeIds, ...snapshot.connectorIds]);
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
          // Don't expand through hidden edges / into hidden nodes — the
          // selection tracks the visible graph.
          if (!store.isEdgeVisible(e.id)) continue;
          if (!expanded.has(e.id)) expanded.set(e.id, 'connector');
          const otherId = e.source === u ? e.target : e.source;
          if (store.isNodeHidden(otherId)) continue;
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
      this.resetRaise();
      return;
    }
    for (const [id, type] of this.selected) {
      if (type === 'shape') this.layer.store.setNodeState(id, this.opts.state, false);
      else this.layer.store.setEdgeState(id, this.opts.state, false);
    }
    const unsel = this.opts.unselectedState;
    if (unsel) {
      for (const id of this.unselectedIds) {
        this.layer.store.setNodeState(id, unsel, false);
        this.layer.store.setEdgeState(id, unsel, false);
      }
    }
    this.resetRaise();
    this.seeds.clear();
    this.selected.clear();
    this.unselectedIds.clear();
  }

  /**
   * Publish the selected set as this behaviour's paint-order lift, under its
   * own id in `view.interaction.raised`.
   *
   * Intent only — no renderer calls. `GraphLayer`'s projection applies the
   * union of every source and lowers whatever leaves it, so a selection lift
   * can't strand elements on top of the scene the way the old per-behaviour
   * bookkeeping could (it only lowered on the *next* selection change, and
   * knew nothing about lifts other sources had applied to the same ids).
   */
  private applyRaise(): void {
    this._canvasStore?.actions.raise.set(this.id, this.selected.keys());
  }

  /** Drop this behaviour's paint-order lift; other sources keep theirs. */
  private resetRaise(): void {
    this._canvasStore?.actions.raise.clear(this.id);
  }

  private applyUnselected(selected: Map<string, SelectableElementType>): void {
    const unsel = this.opts.unselectedState;
    if (!unsel || !this.layer) return;
    for (const node of this.layer.store.nodes()) {
      if (selected.has(node.id)) continue;
      this.layer.store.setNodeState(node.id, unsel, true);
      this.unselectedIds.add(node.id);
    }
    for (const edge of this.layer.store.edges()) {
      if (selected.has(edge.id)) continue;
      this.layer.store.setEdgeState(edge.id, unsel, true);
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
