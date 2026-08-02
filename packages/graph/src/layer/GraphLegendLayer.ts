/**
 * `GraphLegendLayer` — a legend keyed on the graph's **types**: one row per node type
 * and per edge type, each showing a colour swatch, the type name, and how many
 * of that type are in the canvas.
 *
 * ```text
 *  Nodes
 *   ●  Person          12 / 40
 *   ●  Company             8
 *  Edges
 *   ─  WORKS_AT        12 / 31
 *   ╌  KNOWS               4
 * ```
 *
 * **Swatch colours are read back off the graph, never configured twice.** For
 * each type the layer picks a representative element (the first *visible* one,
 * else the first seen) and asks the source `GraphLayer` for its *effective*
 * style via `resolveNodeStyle` / `resolveEdgeStyle`. So the legend automatically
 * agrees with whatever is actually on screen — the layer template, per-node
 * overrides, `ColorByBehaviour`, and `ThemeBehaviour` recolours — with no
 * separate palette to keep in sync. A node swatch is always a filled circle in
 * the node's `bgFill` colour (the shape kind is deliberately *not* mirrored — the
 * legend keys on type, not geometry); an edge swatch is a short line in the
 * edge's `strokeColor`, at its `strokeWidth`, dashed when `strokeDashArray` is
 * set. Override any type explicitly with {@link GraphLegendLayerOptions.colors}.
 *
 * **Counts are `visible / total`.** The visible count skips elements hidden via
 * `GraphStore.hideNode` / `hideEdge` (and, for edges, those with a hidden
 * endpoint — the derived rule the renderer itself uses). When nothing of that
 * type is hidden the two are equal and a single number is shown, so an unfiltered
 * graph reads cleanly. Switch with {@link GraphLegendLayerOptions.countMode}.
 *
 * **Rows can filter the graph.** With
 * {@link GraphLegendLayerOptions.toggleOnClick} on, clicking a row hides every
 * element of that type (`GraphStore.hideNodes` / `hideEdges`, batched to one
 * flush) and renders the row struck through and muted; clicking again restores
 * it. The toggle state lives in `layer.state` (`hiddenNodeTypes` /
 * `hiddenEdgeTypes`) and is also drivable programmatically via
 * {@link GraphLegendLayer.setTypeHidden} / {@link GraphLegendLayer.showAllTypes},
 * so a host toolbar or a saved filter can share it. The `'row:click'` event
 * fires whether or not the built-in toggle is enabled, so a host can wire a
 * different reaction (drive a query, select the type) instead.
 *
 * Implemented as a `ScreenLayer` whose visible artifact is a plain
 * absolutely-positioned HTML `<div>` layered above the canvas — the
 * `DevInfoLayer` pattern, not pixi drawing. Crisp text at any DPR for free, and
 * the inherited pixi `container` goes unused. The panel is `pointer-events:none`
 * and only the *rows* opt back in (and only when `toggleOnClick` is on), so the
 * legend intercepts scene input on a clickable row and nowhere else. The layer
 * always opts out of engine hit-testing (`hittable: false`, `hitTest() → null`)
 * — its interaction is DOM, not pixi.
 *
 * Headless / offscreen mode: when `ctx.canvasElement` is undefined (i.e.
 * `Canvas.initWithStage`), the layer mounts cleanly and renders nothing.
 *
 * Cross-layer dependency declared via `graphLayerId` per the canvas
 * architecture rule — no inference of "the only graph layer".
 *
 * @example
 * ```ts
 * const graph = new GraphLayer({ id: 'graph', options: { initData } });
 * canvas.layers.add(graph);
 *
 * canvas.layers.add(
 *   new GraphLegendLayer({
 *     id: 'legend',
 *     options: { graphLayerId: 'graph', position: 'top-left' },
 *   }),
 * );
 * ```
 */

import { ScreenLayer, type CanvasContext, type ScreenLayerHit } from '@invana/canvas';
import type { LayerOptions } from '@invana/canvas';

import { GraphLayer } from './GraphLayer';
import { defaultEdgeTypeOf, defaultNodeTypeOf } from '../schema/deriveSchema';
import type { GraphEdge, GraphNode } from '../store/types';

// ─── Public types ────────────────────────────────────────────────────────────

/** Anchor corner inside the canvas viewport. */
export type GraphLegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * A legend-chrome colour. Pass a single CSS colour string for a fixed colour, or
 * a `{ light, dark }` pair to swap based on the resolved {@link GraphLegendMode} — so
 * the legend can track the canvas theme the way `BackgroundLayer` and
 * `MiniMapLayer` do.
 */
export type GraphLegendColor = string | { light: string; dark: string };

/**
 * Mode selector for light/dark colour resolution. `'auto'` follows the active
 * theme published on `ctx.theme`; `'light'` / `'dark'` pin explicitly.
 */
export type GraphLegendMode = 'auto' | 'light' | 'dark';

/** The concrete kind currently resolved after `mode` resolution. */
export type GraphLegendKind = 'light' | 'dark';

/** How the per-type count is rendered. */
export type GraphLegendCountMode =
  /** `visible / total`, collapsing to one number when nothing of that type is hidden. */
  | 'both'
  /** Only the count currently rendered in the canvas. */
  | 'visible'
  /** Only the count loaded in the store, hidden or not. */
  | 'total';

/** Row ordering within each section. */
export type GraphLegendSort =
  /** Most-populous type first (by total), ties broken by name. */
  | 'count-desc'
  /** Alphabetical by type name. */
  | 'name-asc'
  /** Order of first appearance in the store. */
  | 'insertion';

/** Constructor options for `GraphLegendLayer`. */
export interface GraphLegendLayerOptions {
  /** Required — the `GraphLayer` id this legend describes. */
  graphLayerId: string;

  // ── Content ───────────────────────────────────────────────────────────────
  /** Panel heading. Pass `false` (or `''`) for no heading. Default `'Legend'`. */
  title?: string | false;
  /** Include the node-type section. Default `true`. */
  showNodes?: boolean;
  /** Include the edge-type section. Default `true`. */
  showEdges?: boolean;
  /** Node-section heading. Pass `false` to drop it. Default `'Nodes'`. */
  nodesTitle?: string | false;
  /** Edge-section heading. Pass `false` to drop it. Default `'Edges'`. */
  edgesTitle?: string | false;
  /** Show the per-type counts. Default `true`. */
  showCounts?: boolean;
  /** How the count is rendered. Default `'both'`. */
  countMode?: GraphLegendCountMode;
  /** Row ordering within each section. Default `'count-desc'`. */
  sort?: GraphLegendSort;
  /**
   * Cap on rows *per section*; the remainder collapses into a single
   * `+N more` row. `0` means no cap. Default `12`.
   */
  maxRows?: number;
  /**
   * Drop rows whose visible count is `0` (i.e. the type is entirely filtered
   * out). Default `false` — a zeroed row is usually the point of a legend.
   */
  hideEmpty?: boolean;
  /**
   * Restrict the legend to these type names (in this order, ignoring
   * {@link sort}). Types absent from the store are skipped. Unset → every
   * observed type.
   */
  nodeTypes?: readonly string[];
  /** Edge-side sibling of {@link nodeTypes}. */
  edgeTypes?: readonly string[];
  /**
   * Explicit per-type swatch colours as `0xRRGGBB`, keyed by type name (node and
   * edge types share the map). Wins over the colour resolved from the graph —
   * reach for it only when the representative element's style isn't the colour
   * you want in the legend.
   */
  colors?: Record<string, number>;
  /** Swatch colour for a type whose style resolves no usable colour. Default `0x9ca3af`. */
  fallbackColor?: number;

  // ── Type accessors ────────────────────────────────────────────────────────
  /**
   * How to read a node's type. Defaults to the same accessor `deriveSchema`
   * uses (`node.type`, then `data.type` / `.label` / `.kind` / `.group` /
   * `.category`, then `'node'`) — so the legend and the schema panel agree.
   * Non-serialisable: pass it in the constructor, not through `canvas.update`.
   */
  nodeTypeOf?: (node: GraphNode) => string;
  /** Edge-side sibling of {@link nodeTypeOf}. */
  edgeTypeOf?: (edge: GraphEdge) => string;

  // ── Interaction ───────────────────────────────────────────────────────────
  /**
   * Make rows clickable, toggling the whole type's visibility in the graph —
   * click `Person` to hide every Person node, click again to bring them back.
   * A toggled-off row renders **struck through and muted** (see
   * {@link hiddenTypeOpacity}) so the legend doubles as the filter's own state
   * display.
   *
   * Default `false` — interaction is opt-in, mirroring the engine's
   * behaviours-don't-auto-enable rule. The {@link GraphLegendLayerEvents.row:click}
   * event fires either way, so a host can wire its own reaction (drive a query,
   * select instead of hide) with this left off.
   *
   * Only the row elements take pointer events; the panel's padding and section
   * headings stay `pointer-events:none`, so panning the canvas "through" the
   * legend still works everywhere except directly on a row.
   */
  toggleOnClick?: boolean;
  /**
   * Row opacity when its type is toggled off via {@link toggleOnClick}. Applies
   * to the whole row (swatch included); the type name additionally gets
   * `line-through` and the muted text colour. Default `0.45`.
   */
  hiddenTypeOpacity?: number;

  // ── Chrome ────────────────────────────────────────────────────────────────
  /** Anchor corner. Default `'top-left'`. */
  position?: GraphLegendPosition;
  /**
   * Inset from the chosen corner, in screen pixels. A single number applies to
   * both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
   * header bar). A missing axis on the object form falls back to `10`.
   * Default `10`.
   */
  margin?: number | { x?: number; y?: number };
  /** Render the overlay at all. Toggle at runtime via {@link GraphLegendLayer.setEnabled}. Default `true`. */
  enabled?: boolean;
  /** Text size in px. Default `11`. */
  fontSize?: number;
  /** Panel opacity 0–1. Default `0.95`. */
  opacity?: number;
  /** Node swatch diameter (and edge swatch stroke length basis) in px. Default `10`. */
  swatchSize?: number;
  /** Panel background. CSS colour or a `{ light, dark }` pair. */
  backgroundColor?: GraphLegendColor;
  /** Row text colour. CSS colour or a `{ light, dark }` pair. */
  textColor?: GraphLegendColor;
  /** Section-heading + count colour. CSS colour or a `{ light, dark }` pair. */
  mutedColor?: GraphLegendColor;
  /** Panel border colour. CSS colour or a `{ light, dark }` pair. */
  borderColor?: GraphLegendColor;
  /** Panel corner radius in px. Default `6`. */
  borderRadius?: number;
  /** How `{ light, dark }` colours resolve. Default `'auto'`. */
  mode?: GraphLegendMode;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

/**
 * Wiring-only fields (`graphLayerId`, the type accessors, the optional type
 * allow-lists and colour overrides) have no sensible default and stay out of
 * this bag — same split `MiniMapLayer` uses.
 */
type GraphLegendDefaultable = Omit<
  GraphLegendLayerOptions,
  'graphLayerId' | 'nodeTypeOf' | 'edgeTypeOf' | 'nodeTypes' | 'edgeTypes' | 'colors'
>;

const DEFAULTS: Required<GraphLegendDefaultable> = {
  title: 'Legend',
  showNodes: true,
  showEdges: true,
  nodesTitle: 'Nodes',
  edgesTitle: 'Edges',
  showCounts: true,
  countMode: 'both',
  sort: 'count-desc',
  maxRows: 12,
  hideEmpty: false,
  fallbackColor: 0x9ca3af,
  toggleOnClick: false,
  hiddenTypeOpacity: 0.45,
  position: 'top-left',
  margin: 10,
  enabled: true,
  fontSize: 11,
  opacity: 0.95,
  swatchSize: 10,
  backgroundColor: { light: 'rgba(255,255,255,0.92)', dark: 'rgba(10,10,10,0.82)' },
  textColor: { light: '#1f2937', dark: '#e5e7eb' },
  mutedColor: { light: '#6b7280', dark: '#9ca3af' },
  borderColor: { light: 'rgba(0,0,0,0.10)', dark: 'rgba(255,255,255,0.10)' },
  borderRadius: 6,
  mode: 'auto',
};

/** Resolved option bag: everything defaulted, plus the un-defaultable wiring. */
type GraphLegendOpts = Required<GraphLegendDefaultable> &
  Pick<GraphLegendLayerOptions, 'nodeTypes' | 'edgeTypes' | 'colors'>;

// ─── Internals ───────────────────────────────────────────────────────────────

/**
 * One tallied type, ready to render — the unit
 * {@link GraphLegendLayer.getRows} hands back.
 */
export interface GraphLegendRow {
  /** The type name, as the accessor reported it. */
  type: string;
  /** How many are currently rendered (not hidden, endpoints visible for edges). */
  visible: number;
  /** How many are loaded in the store, hidden or not. */
  total: number;
  /** Resolved swatch colour as `0xRRGGBB`. */
  color: number;
  /** Edge rows only — the resolved stroke width, for the swatch line's thickness. */
  strokeWidth?: number;
  /** Edge rows only — true when the resolved style dashes the path. */
  dashed?: boolean;
}

/** Per-type accumulator, before the representative's style is resolved. */
interface Tally<T> {
  visible: number;
  total: number;
  /** First element of this type — the style fallback when none is visible. */
  first: T;
  /** First *visible* element of this type; preferred, since that's what's on screen. */
  firstVisible?: T;
}

/** Which side of the graph a row describes. */
export type GraphLegendRowKind = 'node' | 'edge';

/**
 * Layer-level event payloads.
 *
 * A `type` alias rather than an `interface` so it satisfies the engine's
 * `EventMap` (`Record<string, unknown>`) constraint — only aliases get TypeScript's
 * implicit index signature.
 */
export type GraphLegendLayerEvents = {
  /**
   * A legend row was clicked. Fires whether or not
   * {@link GraphLegendLayerOptions.toggleOnClick} is on — with it off nothing in
   * the graph changes and `hidden` simply reports the row's unchanged toggle
   * state, so a host can implement its own reaction (drive a query, select the
   * type, open a filter) without the built-in hide/show.
   */
  'row:click': { kind: GraphLegendRowKind; type: string; hidden: boolean };
  /**
   * A type was toggled off (`hidden: true`) or back on. Only fires when
   * {@link GraphLegendLayerOptions.toggleOnClick} actually applied the change,
   * so it's the one to listen to for "the legend filtered the graph".
   */
  'type:visibility': { kind: GraphLegendRowKind; type: string; hidden: boolean };
};

interface GraphLegendState {
  enabled: boolean;
  /** Node types the user has toggled off from the legend. */
  hiddenNodeTypes: Set<string>;
  /** Edge types the user has toggled off from the legend. */
  hiddenEdgeTypes: Set<string>;
}

export class GraphLegendLayer extends ScreenLayer<
  GraphLegendLayerOptions,
  GraphLegendState,
  GraphLegendLayerEvents
> {
  override readonly kind = 'graph-legend-layer';

  private opts: GraphLegendOpts;
  private readonly graphLayerId: string;
  private readonly nodeTypeOf: (node: GraphNode) => string;
  private readonly edgeTypeOf: (edge: GraphEdge) => string;

  private graph: GraphLayer | null = null;
  private overlay: HTMLDivElement | null = null;

  /** Unsubscribers for every event / observer subscription taken on mount. */
  private unsubs: Array<() => void> = [];

  /**
   * Pending repaint handle. Recounting is O(V+E), and the events that invalidate
   * it are bursty — `node:visibility` fires per node, so hiding 1 000 nodes
   * would otherwise mean 1 000 full recounts. Coalesce to one per frame.
   */
  private rafId: number | null = null;

  /**
   * Delegated row-click handler, attached once to the overlay so it survives the
   * `innerHTML` rewrites each repaint does (a per-row listener would not).
   */
  private onRowClick: ((e: MouseEvent) => void) | null = null;

  /**
   * Whether the last repaint produced any rows. An empty legend (no data yet, or
   * every section switched off) hides the panel rather than floating an empty box
   * over the canvas — tracked here because {@link applyStyles} rewrites
   * `cssText` wholesale and would otherwise drop the `display` the repaint set.
   */
  private hasRows = false;

  constructor(opts: LayerOptions<GraphLegendLayerOptions>) {
    super({
      ...opts,
      zIndex: opts.zIndex ?? 1000,
      cullable: opts.cullable ?? false,
      hittable: opts.hittable ?? false,
    });
    const { graphLayerId, nodeTypeOf, edgeTypeOf, ...rest } = opts.options;
    this.graphLayerId = graphLayerId;
    this.nodeTypeOf = nodeTypeOf ?? defaultNodeTypeOf;
    this.edgeTypeOf = edgeTypeOf ?? defaultEdgeTypeOf;
    this.opts = { ...DEFAULTS, ...rest };
    // `createState()` runs inside `super(...)`, before `this.opts` exists, so it
    // can only seed a constant. Reconcile here now that the options are resolved.
    if (!this.opts.enabled) {
      this.state.setState((s) => {
        s.enabled = false;
      });
    }
  }

  protected override createState(): GraphLegendState {
    return { enabled: true, hiddenNodeTypes: new Set(), hiddenEdgeTypes: new Set() };
  }

  // ── ScreenLayer hit-testing ────────────────────────────────────────────────

  /** Overlay is DOM with `pointer-events:none` — never participates in hit-testing. */
  override hitTest(_screenX: number, _screenY: number): ScreenLayerHit | null {
    return null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  protected override onMount(ctx: CanvasContext): void {
    const graph = ctx.layers.get<GraphLayer>(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `GraphLegendLayer "${this.id}": graph layer "${this.graphLayerId}" not found. ` +
          `Add the GraphLayer before GraphLegendLayer.`,
      );
    }
    this.graph = graph;

    // Recount on anything that can change which types exist, how many there are,
    // or what colour they render in.
    this.unsubs.push(graph.events.on('data:changed', () => this.schedule()));
    this.unsubs.push(graph.events.on('style:changed', () => this.schedule()));
    this.unsubs.push(graph.store.events.on('node:visibility', () => this.schedule()));
    this.unsubs.push(graph.store.events.on('edge:visibility', () => this.schedule()));
    // A theme flip swaps `{ light, dark }` chrome *and* can recolour the graph
    // (ThemeBehaviour re-applies the layer templates), so re-style and recount.
    this.unsubs.push(
      ctx.events.on('theme:change', () => {
        this.applyStyles();
        this.schedule();
      }),
    );
    // The source graph layer being hidden wholesale blanks the legend with it.
    this.unsubs.push(
      ctx.events.on('scene:layer:visibilitychange', ({ id }) => {
        if (id === graph.id) this.schedule();
      }),
    );

    if (this.opts.enabled) this.mountOverlay();
  }

  protected override onUnmount(): void {
    this.cancelScheduled();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.unmountOverlay();
    this.graph = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Show or hide the legend at runtime without removing the layer. */
  setEnabled(enabled: boolean): void {
    if (enabled) this.enable();
    else this.disable();
  }

  enable(): void {
    this.opts = { ...this.opts, enabled: true };
    this.state.setState((s) => {
      s.enabled = true;
    });
    if (this.mounted && !this.overlay) this.mountOverlay();
  }

  disable(): void {
    this.opts = { ...this.opts, enabled: false };
    this.state.setState((s) => {
      s.enabled = false;
    });
    this.cancelScheduled();
    this.unmountOverlay();
  }

  /**
   * Update display options at runtime. This is the seam `Canvas.update({ layers:
   * { <id>: … } })` drives, so the whole bag is serialisable — the
   * non-serialisable wiring (`graphLayerId`, the type accessors) is
   * constructor-only and ignored here.
   */
  setOptions(
    patch: Partial<Omit<GraphLegendLayerOptions, 'graphLayerId' | 'nodeTypeOf' | 'edgeTypeOf'>>,
  ): void {
    const wasEnabled = this.opts.enabled;
    this.opts = { ...this.opts, ...patch };
    if (patch.enabled !== undefined && patch.enabled !== wasEnabled) {
      this.setEnabled(patch.enabled);
      return;
    }
    if (this.overlay) {
      this.applyStyles();
      this.repaint();
    }
  }

  /** Force an immediate recount + repaint. Cheap for typical graph sizes. */
  refresh(): void {
    this.cancelScheduled();
    this.repaint();
  }

  /**
   * The rows the legend is currently showing — node types then edge types, each
   * with its resolved colour and `visible` / `total` counts. Handy for a
   * DOM-free consumer (a React legend panel, a test) that wants the same tally
   * without the overlay.
   */
  getRows(): { nodes: GraphLegendRow[]; edges: GraphLegendRow[] } {
    return { nodes: this.tallyNodes(), edges: this.tallyEdges() };
  }

  /** True iff `type` is currently toggled off from the legend. */
  isTypeHidden(kind: GraphLegendRowKind, type: string): boolean {
    const s = this.state.getState();
    return (kind === 'node' ? s.hiddenNodeTypes : s.hiddenEdgeTypes).has(type);
  }

  /** The types currently toggled off, as plain arrays (node types, edge types). */
  getHiddenTypes(): { nodes: string[]; edges: string[] } {
    const s = this.state.getState();
    return { nodes: [...s.hiddenNodeTypes], edges: [...s.hiddenEdgeTypes] };
  }

  /**
   * Hide or show every element of one type, exactly as clicking its row would —
   * the programmatic entry point, so a host toolbar or a saved filter can drive
   * the same state the legend displays. No-op when already in that state.
   *
   * Hiding writes the store's `hidden` flag on each matching element (batched to
   * one flush); the legend's own struck-through state is tracked here, so a
   * *restored* type reads as shown even if its elements remain invisible for
   * another reason (an edge whose endpoint is still hidden) — the row's
   * `visible / total` count is what tells you that.
   */
  setTypeHidden(kind: GraphLegendRowKind, type: string, hidden: boolean): void {
    const graph = this.graph;
    if (!graph || this.isTypeHidden(kind, type) === hidden) return;

    const store = graph.store;
    if (kind === 'node') {
      const ids: string[] = [];
      for (const node of store.nodes()) if (this.nodeTypeOf(node) === type) ids.push(node.id);
      if (hidden) store.hideNodes(ids);
      else store.showNodes(ids);
    } else {
      const ids: string[] = [];
      for (const edge of store.edges()) if (this.edgeTypeOf(edge) === type) ids.push(edge.id);
      if (hidden) store.hideEdges(ids);
      else store.showEdges(ids);
    }

    this.state.setState((s) => {
      const set = kind === 'node' ? s.hiddenNodeTypes : s.hiddenEdgeTypes;
      if (hidden) set.add(type);
      else set.delete(type);
    });
    this.events.emit('type:visibility', { kind, type, hidden });
    // The store's visibility events already scheduled a repaint, but a type with
    // no matching elements emits none — repaint regardless so the row updates.
    this.schedule();
  }

  /** Bring back every type toggled off from the legend, in one batch. */
  showAllTypes(): void {
    const { nodes, edges } = this.getHiddenTypes();
    for (const type of nodes) this.setTypeHidden('node', type, false);
    for (const type of edges) this.setTypeHidden('edge', type, false);
  }

  /**
   * Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
   * follows the theme published on `ctx.theme` (defaulting to `'light'` before
   * any theme is published).
   */
  getResolvedKind(): GraphLegendKind {
    const { mode } = this.opts;
    if (mode === 'light' || mode === 'dark') return mode;
    return this.ctx?.theme.current()?.kind ?? 'light';
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  /**
   * Delegated row click: announce it, then apply the built-in toggle when
   * {@link GraphLegendLayerOptions.toggleOnClick} is on. `row:click` fires first
   * and unconditionally so a host can react even with the toggle off.
   */
  private handleRowClick(kind: GraphLegendRowKind, type: string): void {
    const wasHidden = this.isTypeHidden(kind, type);
    const willHide = this.opts.toggleOnClick ? !wasHidden : wasHidden;
    this.events.emit('row:click', { kind, type, hidden: willHide });
    if (this.opts.toggleOnClick) this.setTypeHidden(kind, type, willHide);
  }

  // ── Repaint scheduling ─────────────────────────────────────────────────────

  /** Coalesce bursty invalidations into a single repaint on the next frame. */
  private schedule(): void {
    if (this.rafId !== null || !this.overlay) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.repaint();
    });
  }

  private cancelScheduled(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ── Mount / unmount the DOM overlay ────────────────────────────────────────

  private mountOverlay(): void {
    const canvasEl = this.context.canvasElement;
    if (!canvasEl) return; // headless / initWithStage
    const parent = canvasEl.parentElement;
    if (!parent) return;

    // The overlay is absolutely positioned — the host must be a containing block.
    if (window.getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const div = document.createElement('div');
    div.dataset['graphLegendLayer'] = this.id;
    this.overlay = div;

    // One delegated listener for every row, now and after each repaint. Rows
    // carry their identity in `data-legend-kind` / `data-legend-type`.
    this.onRowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const row = target?.closest<HTMLElement>('[data-legend-type]');
      if (!row) return;
      const kind = row.dataset['legendKind'];
      const type = row.dataset['legendType'];
      if ((kind !== 'node' && kind !== 'edge') || type === undefined) return;
      this.handleRowClick(kind, type);
    };
    div.addEventListener('click', this.onRowClick);

    this.applyStyles();
    parent.appendChild(div);
    this.repaint();
  }

  private unmountOverlay(): void {
    if (this.onRowClick && this.overlay) {
      this.overlay.removeEventListener('click', this.onRowClick);
    }
    this.onRowClick = null;
    this.overlay?.remove();
    this.overlay = null;
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  /** Resolve a {@link GraphLegendColor} against the current {@link GraphLegendKind}. */
  private color(c: GraphLegendColor): string {
    return typeof c === 'string' ? c : c[this.getResolvedKind()];
  }

  private applyStyles(): void {
    if (!this.overlay) return;
    const { position, margin, fontSize, opacity, borderRadius } = this.opts;

    const mx = typeof margin === 'number' ? margin : (margin.x ?? 10);
    const my = typeof margin === 'number' ? margin : (margin.y ?? 10);
    const inset: Record<GraphLegendPosition, string> = {
      'top-left': `top:${my}px; left:${mx}px;`,
      'top-right': `top:${my}px; right:${mx}px;`,
      'bottom-left': `bottom:${my}px; left:${mx}px;`,
      'bottom-right': `bottom:${my}px; right:${mx}px;`,
    };

    this.overlay.style.cssText = [
      'position:absolute;',
      `display:${this.hasRows ? 'block' : 'none'};`,
      inset[position],
      `font-size:${fontSize}px;`,
      `opacity:${opacity};`,
      `background:${this.color(this.opts.backgroundColor)};`,
      `color:${this.color(this.opts.textColor)};`,
      `border:1px solid ${this.color(this.opts.borderColor)};`,
      `border-radius:${borderRadius}px;`,
      'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;',
      'padding:8px 10px;',
      'line-height:1.5;',
      'pointer-events:none;',
      'z-index:9998;',
      'box-shadow:0 4px 16px rgba(0,0,0,0.18);',
      'user-select:none;',
      'backdrop-filter:blur(4px);',
    ].join('');
  }

  // ── Tallying ───────────────────────────────────────────────────────────────

  /**
   * Bucket the store's nodes by type, remembering counts and a representative
   * element per type, then resolve each representative's effective style for the
   * swatch colour. One pass over the nodes; the style resolution is once per
   * *type*, not per node.
   */
  private tallyNodes(): GraphLegendRow[] {
    const graph = this.graph;
    if (!graph || !this.opts.showNodes || !graph.visible) return [];

    const store = graph.store;
    const tallies = new Map<string, Tally<GraphNode>>();
    for (const node of store.nodes()) {
      const type = this.nodeTypeOf(node);
      const visible = store.isNodeVisible(node.id);
      const t = tallies.get(type);
      if (!t) {
        tallies.set(type, {
          visible: visible ? 1 : 0,
          total: 1,
          first: node,
          firstVisible: visible ? node : undefined,
        });
        continue;
      }
      t.total++;
      if (visible) {
        t.visible++;
        t.firstVisible ??= node;
      }
    }

    const rows: GraphLegendRow[] = [];
    for (const [type, t] of tallies) {
      const rep = t.firstVisible ?? t.first;
      const style = graph.resolveNodeStyle(rep);
      rows.push({
        type,
        visible: t.visible,
        total: t.total,
        color:
          this.opts.colors?.[type] ??
          fillColorOf(style.bgFill) ??
          style.bgStrokeColor ??
          this.opts.fallbackColor,
      });
    }
    return this.finalise(rows, 'node', this.opts.nodeTypes);
  }

  /** Edge-side sibling of {@link tallyNodes}, adding stroke width / dash to each row. */
  private tallyEdges(): GraphLegendRow[] {
    const graph = this.graph;
    if (!graph || !this.opts.showEdges || !graph.visible) return [];

    const store = graph.store;
    const tallies = new Map<string, Tally<GraphEdge>>();
    for (const edge of store.edges()) {
      const type = this.edgeTypeOf(edge);
      const visible = store.isEdgeVisible(edge.id);
      const t = tallies.get(type);
      if (!t) {
        tallies.set(type, {
          visible: visible ? 1 : 0,
          total: 1,
          first: edge,
          firstVisible: visible ? edge : undefined,
        });
        continue;
      }
      t.total++;
      if (visible) {
        t.visible++;
        t.firstVisible ??= edge;
      }
    }

    const rows: GraphLegendRow[] = [];
    for (const [type, t] of tallies) {
      const rep = t.firstVisible ?? t.first;
      const style = graph.resolveEdgeStyle(rep);
      rows.push({
        type,
        visible: t.visible,
        total: t.total,
        color: this.opts.colors?.[type] ?? style.strokeColor ?? this.opts.fallbackColor,
        strokeWidth: style.strokeWidth,
        dashed: style.strokeDashArray !== undefined,
      });
    }
    return this.finalise(rows, 'edge', this.opts.edgeTypes);
  }

  /**
   * Apply the shared row post-processing: the optional type allow-list (which
   * also fixes the order), `hideEmpty`, and {@link GraphLegendLayerOptions.sort}.
   * `maxRows` is applied at render time so the `+N more` row can be built there.
   *
   * `hideEmpty` deliberately **keeps** a row the user toggled off — dropping it
   * would delete the only control that can bring that type back.
   */
  private finalise(
    rows: GraphLegendRow[],
    kind: GraphLegendRowKind,
    allow: readonly string[] | undefined,
  ): GraphLegendRow[] {
    let out = this.opts.hideEmpty
      ? rows.filter((r) => r.visible > 0 || this.isTypeHidden(kind, r.type))
      : rows;
    if (allow) {
      const byType = new Map(out.map((r) => [r.type, r]));
      return allow.map((t) => byType.get(t)).filter((r): r is GraphLegendRow => r !== undefined);
    }
    out = [...out];
    if (this.opts.sort === 'count-desc') {
      out.sort((a, b) => b.total - a.total || a.type.localeCompare(b.type));
    } else if (this.opts.sort === 'name-asc') {
      out.sort((a, b) => a.type.localeCompare(b.type));
    }
    return out;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private repaint(): void {
    if (!this.overlay || !this.graph) return;

    const nodes = this.tallyNodes();
    const edges = this.tallyEdges();
    const { title, nodesTitle, edgesTitle } = this.opts;

    const html: string[] = [];
    if (title) html.push(this.headingHtml(title, true));
    if (nodes.length > 0) {
      if (nodesTitle) html.push(this.headingHtml(nodesTitle, false));
      html.push(...this.sectionHtml(nodes, 'node'));
    }
    if (edges.length > 0) {
      if (edgesTitle) html.push(this.headingHtml(edgesTitle, false));
      html.push(...this.sectionHtml(edges, 'edge'));
    }

    this.overlay.innerHTML = html.join('');
    this.hasRows = html.length > 0;
    this.overlay.style.display = this.hasRows ? 'block' : 'none';
  }

  /** The panel title (`strong`) or a section heading (muted, uppercase-ish). */
  private headingHtml(text: string, isTitle: boolean): string {
    const style = isTitle
      ? `font-weight:600;margin-bottom:4px;color:${this.color(this.opts.textColor)};`
      : `margin-top:2px;font-size:0.9em;letter-spacing:0.04em;color:${this.color(this.opts.mutedColor)};`;
    return `<div style="${style}">${escapeHtml(text)}</div>`;
  }

  /** Rows for one section, honouring `maxRows` with a trailing `+N more`. */
  private sectionHtml(rows: GraphLegendRow[], kind: GraphLegendRowKind): string[] {
    const { maxRows } = this.opts;
    const capped = maxRows > 0 && rows.length > maxRows;
    const shown = capped ? rows.slice(0, maxRows) : rows;
    const html = shown.map((r) => this.rowHtml(r, kind));
    if (capped) {
      const rest = rows.length - shown.length;
      html.push(
        // Indent to the row text column: swatch width + the 6px row gap.
        `<div style="padding-left:${this.opts.swatchSize + 6}px;color:${this.color(this.opts.mutedColor)};">+${rest} more</div>`,
      );
    }
    return html;
  }

  /**
   * One `[swatch] Type   count` row.
   *
   * The row carries its identity in `data-legend-kind` / `data-legend-type` for
   * the delegated click handler, and takes pointer events **only when
   * `toggleOnClick` is on** — so a non-interactive legend still lets pointer
   * input through to the scene beneath it. A type toggled off renders at
   * `hiddenTypeOpacity` with its name struck through and muted.
   */
  private rowHtml(row: GraphLegendRow, kind: GraphLegendRowKind): string {
    const swatch = kind === 'node' ? this.nodeSwatchHtml(row) : this.edgeSwatchHtml(row);
    const count = this.opts.showCounts ? this.countHtml(row) : '';
    const interactive = this.opts.toggleOnClick;
    const off = this.isTypeHidden(kind, row.type);

    const rowStyle =
      'display:flex;align-items:center;gap:6px;white-space:nowrap;' +
      (interactive ? 'cursor:pointer;pointer-events:auto;' : '') +
      (off ? `opacity:${this.opts.hiddenTypeOpacity};` : '');
    const nameStyle =
      'flex:1;' +
      (off ? `text-decoration:line-through;color:${this.color(this.opts.mutedColor)};` : '');

    // Only an interactive row gets a tooltip, and it says what the click does.
    const title = interactive
      ? ` title="${off ? 'Click to show' : 'Click to hide'} ${escapeHtml(row.type)}"`
      : '';

    return (
      `<div data-legend-kind="${kind}" data-legend-type="${escapeHtml(row.type)}"${title} ` +
      `style="${rowStyle}">` +
      swatch +
      `<span style="${nameStyle}">${escapeHtml(row.type)}</span>` +
      count +
      `</div>`
    );
  }

  /** A filled circle in the node type's colour — geometry-agnostic on purpose. */
  private nodeSwatchHtml(row: GraphLegendRow): string {
    const d = this.opts.swatchSize;
    return (
      `<span style="flex:0 0 ${d}px;width:${d}px;height:${d}px;border-radius:50%;` +
      `background:${cssHex(row.color)};"></span>`
    );
  }

  /**
   * A short line in the edge type's stroke colour, at its resolved width, dashed
   * when the style dashes the path. Drawn as a `border-top` so CSS gives us the
   * dash pattern for free.
   */
  private edgeSwatchHtml(row: GraphLegendRow): string {
    const w = this.opts.swatchSize + 4;
    const thickness = Math.max(1, Math.min(4, Math.round(row.strokeWidth ?? 2)));
    const style = row.dashed ? 'dashed' : 'solid';
    return (
      `<span style="flex:0 0 ${w}px;width:${w}px;height:0;` +
      `border-top:${thickness}px ${style} ${cssHex(row.color)};"></span>`
    );
  }

  /**
   * `visible / total` in `'both'` mode, collapsed to a single number when the
   * two agree (an unfiltered graph shouldn't read `40 / 40`).
   */
  private countHtml(row: GraphLegendRow): string {
    const { countMode } = this.opts;
    const text =
      countMode === 'visible'
        ? String(row.visible)
        : countMode === 'total'
          ? String(row.total)
          : row.visible === row.total
            ? String(row.total)
            : `${row.visible} / ${row.total}`;
    return `<span style="color:${this.color(this.opts.mutedColor)};font-variant-numeric:tabular-nums;">${text}</span>`;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Pull a representative `0xRRGGBB` out of a `NodeStyle.bgFill`, which may be a
 * bare number, a single fill layer, or a stack. Returns `undefined` when the
 * fill carries no solid colour (a pure image / glyph / svg fill) so the caller
 * can fall back.
 */
function fillColorOf(fill: unknown): number | undefined {
  if (typeof fill === 'number') return fill;
  if (Array.isArray(fill)) {
    for (const layer of fill) {
      const c = fillColorOf(layer);
      if (c !== undefined) return c;
    }
    return undefined;
  }
  if (fill && typeof fill === 'object') {
    const l = fill as { kind?: string; color?: unknown };
    if (l.kind === 'solid' && typeof l.color === 'number') return l.color;
  }
  return undefined;
}

/** `0xRRGGBB` → `#rrggbb` for the inline CSS. */
function cssHex(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
}

/**
 * Escape a user-derived string for interpolation into the overlay's `innerHTML`.
 * Type names come from arbitrary graph data, so they are never trusted markup.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
