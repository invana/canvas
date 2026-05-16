/**
 * `GraphLayer` — `WorldLayer` subclass that renders a `GraphStore` via a
 * `PrimitivesRenderer`. Subscribes to store events and projects them into
 * `addShape` / `addConnector` / `updateShape` / `updateConnector` /
 * `removeShape` / `removeConnector` calls.
 *
 * The store is the source of truth. The layer is a thin projection — no
 * domain data lives here. Re-emits aggregated `data:changed` and
 * `positions:updated` events at the layer level for application code that
 * only cares about visible-graph changes.
 *
 * See `apps/docs/graph/data-model.md` for the data model and
 * `apps/docs/graph/events.md` for the event model.
 */

import { PrimitivesRenderer, WorldLayer } from '@invana/canvas';
import type {
  ArcSpec,
  BaseConnectorSpec,
  BaseShapeSpec,
  CanvasContext,
  CircleSpec,
  ConnectorLabelStyle,
  LayerOptions,
  RectSpec,
  ShapeLabelStyle,
  WorldLayerHit,
} from '@invana/canvas';

import { GraphStore } from '../store/GraphStore';
import type { GraphEdge, GraphNode } from '../store/types';

import {
  DEFAULT_EDGE_STATE_CONFIGS,
  DEFAULT_NODE_STATE_CONFIGS,
  resolveField,
  type EdgeLabelHint,
  type EdgeOption,
  type EdgePathType,
  type EdgeRenderHints,
  type EdgeShapeOptions,
  type EdgeStateConfig,
  type EdgeStyle,
  type GraphData,
  type GraphLayerEvents,
  type GraphLayerOptions,
  type NodeLabelHint,
  type NodeOption,
  type NodeRenderHints,
  type NodeShapeOptions,
  type NodeStateConfig,
  type NodeStyle,
  type ResolvableEdgeRenderHints,
  type ResolvableEdgeStyle,
  type ResolvableNodeRenderHints,
  type ResolvableNodeStyle,
} from './types';

// ─── Resolved-defaults types ───────────────────────────────────────────────

/**
 * Shape of the per-layer node defaults after merging the caller's
 * `nodeDefaults` onto the factory `DEFAULT_NODE_HINTS`. The always-present
 * fields (covered by the factory defaults) are non-optional resolvers;
 * the rest stay optional.
 */
export type ResolvedNodeDefaults =
  Required<Pick<ResolvableNodeRenderHints,
    'shape' | 'size' | 'cornerRadius' | 'fill' | 'stroke' | 'strokeWidth' | 'alpha'>>
  & Pick<ResolvableNodeRenderHints,
    'label' | 'height' | 'innerR' | 'outerR' | 'startAngle' | 'endAngle'>;

export type ResolvedEdgeDefaults =
  Required<Pick<ResolvableEdgeRenderHints,
    'pathType' | 'anchor' | 'pathStyleOpts' | 'stroke' | 'strokeWidth' | 'alpha' | 'arrow'>>
  & Pick<ResolvableEdgeRenderHints,
    'label' | 'sourceAnchor' | 'targetAnchor' | 'sourceAnchorOpts' | 'targetAnchorOpts' | 'waypoints'>;

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_NODE_HINTS: Required<Omit<NodeRenderHints, 'height' | 'label' | 'innerR' | 'outerR' | 'startAngle' | 'endAngle'>> = {
  shape: 'circle',
  size: 32,
  cornerRadius: 4,
  fill: 0x3b82f6,
  stroke: 0x1d4ed8,
  strokeWidth: 1,
  alpha: 1,
};

const DEFAULT_EDGE_HINTS: Required<Omit<EdgeRenderHints, 'label' | 'sourceAnchor' | 'targetAnchor' | 'sourceAnchorOpts' | 'targetAnchorOpts' | 'waypoints'>> = {
  pathType: 'straight',
  anchor: 'boundary',
  pathStyleOpts: {},
  stroke: 0x94a3b8,
  strokeWidth: 1.5,
  alpha: 1,
  arrow: true,
};

/**
 * Translate a {@link EdgePathType} shortcut into the canvas `router` +
 * `pathStyle` pair the renderer understands.
 */
function pathTypeToRouterPathStyle(t: EdgePathType): { router: string; pathStyle: string } {
  switch (t) {
    case 'straight':
      return { router: 'straight', pathStyle: 'normal' };
    case 'bezier':
      return { router: 'straight', pathStyle: 'bezier' };
    case 'bump-radial':
      return { router: 'straight', pathStyle: 'bump-radial' };
    case 'bump-horizontal':
      return { router: 'straight', pathStyle: 'bump-horizontal' };
    case 'step-radial':
      return { router: 'straight', pathStyle: 'step-radial' };
    case 'orth':
      return { router: 'orth', pathStyle: 'normal' };
    case 'manhattan':
      return { router: 'manhattan', pathStyle: 'normal' };
    case 'rounded':
      return { router: 'orth', pathStyle: 'rounded' };
    case 'smooth':
      return { router: 'orth', pathStyle: 'smooth' };
    case 'bundle':
      // The bundle curve consumes the polyline literally — including all
      // intermediate `waypoints` — so it has to pair with `straight`, the
      // only router that passes waypoints through unaltered.
      return { router: 'straight', pathStyle: 'bundle' };
  }
  return { router: 'straight', pathStyle: 'normal' };
}

// ─── State (none for now) ──────────────────────────────────────────────────

interface GraphLayerState {
  /** Reserved for hover / selection / decoration state in later phases. */
  readonly _placeholder?: never;
}

// ─── GraphLayer ────────────────────────────────────────────────────────────

export class GraphLayer extends WorldLayer<
  GraphLayerOptions,
  GraphLayerState,
  GraphLayerEvents,
  never,
  WorldLayerHit
> {
  /**
   * Pixi-backed primitives renderer; created in `onMount`.
   *
   * Public so behaviours can subscribe to `shape:*` / `connector:*` pointer
   * events on `graph.getRenderer().events`. Returns `undefined` before mount.
   */
  private _renderer?: PrimitivesRenderer;

  /** Renderer accessor for behaviours. Undefined before `onMount`. */
  getRenderer(): PrimitivesRenderer | undefined {
    return this._renderer;
  }

  /**
   * Per-frame tick — delegated to `PrimitivesRenderer.tickAnimations` so
   * animated decorations (`pulse-ring`, `marching-ants`, …) and the
   * viewport-clipped label-resolution sweep advance every frame.
   *
   * `Canvas.tickOnce` duck-types this hook on each layer; without it the
   * renderer would never tick for graph layers because the field that
   * holds it (`_renderer`) is private and the alternative fallback path
   * looks for a public `renderer` property.
   */
  tickAnimations(deltaMs: number): void {
    this._renderer?.tickAnimations(deltaMs);
  }

  /**
   * Resolved per-node defaults (caller-supplied `nodeDefaults` merged onto the
   * factory defaults). Exposed for layers that need to mirror what's drawn —
   * e.g. `MiniMapLayer` falls back to these when a node omits `shape` / `size`.
   *
   * Fields may be either static values or resolver functions
   * (`(node) => value`). Callers that need a concrete value per node should
   * use {@link resolveNodeDefault} to unwrap.
   */
  getNodeDefaults(): ResolvedNodeDefaults {
    return this.nodeDefaults;
  }

  /**
   * Resolved per-edge defaults (caller-supplied `edgeDefaults` merged onto the
   * factory defaults). Exposed symmetrically with {@link getNodeDefaults} for
   * sibling layers / behaviours that need to read what an edge would look
   * like before any per-edge `data` override kicks in.
   */
  getEdgeDefaults(): ResolvedEdgeDefaults {
    return this.edgeDefaults;
  }

  /**
   * Replace the layer-wide `nodeDefaults` wholesale and re-render every node.
   *
   * The new value is merged onto the factory `DEFAULT_NODE_HINTS` (so omitted
   * always-present fields fall back to factory values, not to whatever the
   * previous user-supplied defaults were). Use {@link updateNodeDefaults} to
   * partial-merge against the current defaults instead of replacing.
   *
   * Every node currently in the layer is re-rendered because per-render
   * lookup reads from `nodeDefaults` whenever a per-node hint is omitted.
   */
  setNodeDefaults(defaults: ResolvableNodeRenderHints): void {
    this.nodeDefaults = { ...DEFAULT_NODE_HINTS, ...defaults };
    this.rerenderAllNodes();
  }

  /**
   * Patch-merge `nodeDefaults` against the current resolved defaults and
   * re-render every node. `undefined` values in `patch` are ignored
   * (they don't blank out an existing field — pass an explicit `false` /
   * `0` / factory value to override). Use {@link setNodeDefaults} for a
   * wholesale replacement.
   */
  updateNodeDefaults(patch: ResolvableNodeRenderHints): void {
    this.nodeDefaults = { ...this.nodeDefaults, ...patch };
    this.rerenderAllNodes();
  }

  /** Sibling of {@link setNodeDefaults} for edges. */
  setEdgeDefaults(defaults: ResolvableEdgeRenderHints): void {
    this.edgeDefaults = { ...DEFAULT_EDGE_HINTS, ...defaults };
    this.rerenderAllEdges();
  }

  /** Sibling of {@link updateNodeDefaults} for edges. */
  updateEdgeDefaults(patch: ResolvableEdgeRenderHints): void {
    this.edgeDefaults = { ...this.edgeDefaults, ...patch };
    this.rerenderAllEdges();
  }

  /** Data source. Either supplied by the caller or self-created. */
  readonly store: GraphStore;

  /** Resolved defaults (caller overrides + factory defaults). Mutable to
   * support runtime updates via {@link setNodeDefaults} / {@link updateNodeDefaults}
   * and their edge equivalents. */
  private nodeDefaults: ResolvedNodeDefaults;
  private edgeDefaults: ResolvedEdgeDefaults;

  /** Subscription disposers, called in `onUnmount`. */
  private subs: Array<() => void> = [];

  /**
   * Edge ids whose endpoint moved since last flush. The connector path is
   * pinned to shape positions via the `boundary` anchor, but PixiJS doesn't
   * auto-reroute connectors when an anchored shape moves — we drain this set
   * on each store flush and call `updateConnector(eid, {})` to force re-route.
   */
  private dirtyConnectors: Set<string> = new Set();

  /**
   * Visual-state machinery — name → config + name → set of ids carrying it.
   *
   * Callers configure a state shape once (`setNodeStateConfig('selected', {...})`)
   * then toggle it on individual ids (`setNodeState(id, 'selected', true)`).
   * The active states stack on top of the base render hints from `node.data`
   * — last-set-state wins per field.
   */
  private readonly nodeStateConfigs: Map<string, NodeStateConfig> = new Map();
  private readonly edgeStateConfigs: Map<string, EdgeStateConfig> = new Map();
  /** id → set of active state names. */
  private readonly nodeStates: Map<string, Set<string>> = new Map();
  private readonly edgeStates: Map<string, Set<string>> = new Map();

  // ─── v3 G6-aligned layer template ────────────────────────────────────
  // `options.node` and `options.edge` carry layer-level NodeOption /
  // EdgeOption templates (style + state catalogue, resolver-aware).
  private nodeOption: NodeOption | undefined;
  private edgeOption: EdgeOption | undefined;

  constructor(opts: LayerOptions<GraphLayerOptions>) {
    super(opts);
    this.store = opts.options.store ?? new GraphStore();
    this.nodeDefaults = { ...DEFAULT_NODE_HINTS, ...opts.options.nodeDefaults };
    this.edgeDefaults = { ...DEFAULT_EDGE_HINTS, ...opts.options.edgeDefaults };

    // Auto-register the canonical state configs unless the caller opts out.
    // Writes go straight to the internal Maps (not through `setNodeStateConfig`)
    // because the public setter triggers a re-render walk that's pointless
    // at construction — no nodes exist yet and the renderer isn't mounted.
    if (opts.options.useDefaultStateConfigs !== false) {
      for (const [name, cfg] of Object.entries(DEFAULT_NODE_STATE_CONFIGS)) {
        this.nodeStateConfigs.set(name, cfg);
      }
      for (const [name, cfg] of Object.entries(DEFAULT_EDGE_STATE_CONFIGS)) {
        this.edgeStateConfigs.set(name, cfg);
      }
    }
    // Caller-supplied state configs go LAST so they override canonical
    // entries by name, and new names register as fresh states.
    if (opts.options.nodeStateConfigs) {
      for (const [name, cfg] of Object.entries(opts.options.nodeStateConfigs)) {
        this.nodeStateConfigs.set(name, cfg);
      }
    }
    if (opts.options.edgeStateConfigs) {
      for (const [name, cfg] of Object.entries(opts.options.edgeStateConfigs)) {
        this.edgeStateConfigs.set(name, cfg);
      }
    }

    // v3 G6-aligned layer template (NodeOption / EdgeOption). Coexists with
    // the legacy nodeDefaults / nodeStateConfigs path; both are read at
    // render time and merged per §2 of `data-types-implementation-plan.md`.
    this.nodeOption = opts.options.node;
    this.edgeOption = opts.options.edge;
  }

  protected createState(): GraphLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    this._renderer = new PrimitivesRenderer({
      container: this.container,
      camera: ctx.camera,
    });

    // Initial sync — render anything the store already has, then apply any
    // data-driven `state` fields the nodes / edges arrived with.
    for (const node of this.store.nodes()) {
      this.installNodeShape(node);
      this.syncDataDrivenNodeStates(node, undefined);
    }
    for (const edge of this.store.edges()) {
      this.installEdgeConnector(edge);
      this.syncDataDrivenEdgeStates(edge, undefined);
    }

    // Subscribe to fine-grained store events.
    const s = this.store.events;
    this.subs.push(
      s.on('node:add', ({ nodeId }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        this.installNodeShape(node);
        this.syncDataDrivenNodeStates(node, undefined);
      }),
      s.on('node:update', ({ nodeId, patch }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        this.updateNodeShape(node, patch);
        if ('states' in patch) {
          this.syncDataDrivenNodeStates(node, patch.states ?? null);
        }
      }),
      s.on('node:remove', ({ nodeId }) => {
        this.nodeStates.delete(nodeId);
        this._renderer?.removeShape(nodeId);
      }),
      s.on('edge:add', ({ edgeId }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        this.installEdgeConnector(edge);
        this.syncDataDrivenEdgeStates(edge, undefined);
      }),
      s.on('edge:update', ({ edgeId, patch }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        this.updateEdgeConnector(edge, patch);
        if ('states' in patch) {
          this.syncDataDrivenEdgeStates(edge, patch.states ?? null);
        }
      }),
      s.on('edge:remove', ({ edgeId }) => {
        this.edgeStates.delete(edgeId);
        this._renderer?.removeConnector(edgeId);
      }),
      s.on('flush', (counters) => {
        if (this.dirtyConnectors.size > 0 && this._renderer) {
          for (const edgeId of this.dirtyConnectors) {
            // Empty partial — triggers recomputeConnectorPath which re-runs
            // anchors against the current shape positions.
            this._renderer.updateConnector(edgeId, {});
          }
          this.dirtyConnectors.clear();
        }
        this.events.emit('data:changed', { ...counters });
      }),
    );
  }

  protected override onUnmount(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this._renderer?.destroy();
    this._renderer = undefined;
  }

  // ─── Bulk loading ────────────────────────────────────────────────────────

  /**
   * Bulk-load nodes + edges, **replacing** any prior data. Wraps the
   * underlying store inserts in a single `batch()` so subscribers see one
   * flush.
   *
   * For streaming consumers (constantly arriving data), use the store
   * directly: `graph.store.addData({ nodes, edges })` appends without
   * clearing, and `graph.store.applyDelta({ added, updated, removed })`
   * applies an incremental change in one batch. All other per-id CRUD
   * (`upsertNode`, `updateNode`, `removeNode`, edge equivalents, `batch`,
   * `flush`, `clear`) lives on `graph.store` — the store is the single
   * source of truth and the layer just orchestrates store → renderer.
   */
  setData(data: GraphData): void {
    this.store.batch(() => {
      this.store.clear();
      this.store.addNodesBulk(data.nodes);
      this.store.addEdgesBulk(data.edges);
    });
  }

  // ─── State machinery ────────────────────────────────────────────────────

  /**
   * Configure how a named state restyles a node. Multiple active states stack
   * — later-set state wins per field. Pass `null` to remove the config.
   *
   * @example
   * graph.setNodeStateConfig('selected', { stroke: 0xfacc15, strokeWidth: 3 });
   * graph.setNodeStateConfig('hovered', { fill: 0x60a5fa });
   * graph.setNodeStateConfig('inactive', { alpha: 0.25 });
   */
  setNodeStateConfig(name: string, config: NodeStateConfig | null): void {
    if (config === null) this.nodeStateConfigs.delete(name);
    else this.nodeStateConfigs.set(name, config);
    // Re-render every node that currently carries this state.
    for (const [id, states] of this.nodeStates) {
      if (states.has(name)) this.rerenderNode(id);
    }
  }

  /** Same as {@link setNodeStateConfig} for edges. */
  setEdgeStateConfig(name: string, config: EdgeStateConfig | null): void {
    if (config === null) this.edgeStateConfigs.delete(name);
    else this.edgeStateConfigs.set(name, config);
    for (const [id, states] of this.edgeStates) {
      if (states.has(name)) this.rerenderEdge(id);
    }
  }

  /**
   * Toggle a named state on a node. Defaults to `on=true`. Re-renders the
   * node with the merged state overrides applied. No-op if the node id is
   * unknown.
   */
  setNodeState(id: string, name: string, on = true): void {
    if (!this.store.hasNode(id)) return;
    let set = this.nodeStates.get(id);
    if (on) {
      if (set?.has(name)) return;
      if (!set) {
        set = new Set();
        this.nodeStates.set(id, set);
      }
      set.add(name);
    } else {
      if (!set?.has(name)) return;
      set.delete(name);
      if (set.size === 0) this.nodeStates.delete(id);
    }
    this.rerenderNode(id);
  }

  /** Same as {@link setNodeState} for edges. */
  setEdgeState(id: string, name: string, on = true): void {
    if (!this.store.hasEdge(id)) return;
    let set = this.edgeStates.get(id);
    if (on) {
      if (set?.has(name)) return;
      if (!set) {
        set = new Set();
        this.edgeStates.set(id, set);
      }
      set.add(name);
    } else {
      if (!set?.has(name)) return;
      set.delete(name);
      if (set.size === 0) this.edgeStates.delete(id);
    }
    this.rerenderEdge(id);
  }

  /** True iff `id` currently carries state `name`. */
  hasNodeState(id: string, name: string): boolean {
    return this.nodeStates.get(id)?.has(name) ?? false;
  }

  hasEdgeState(id: string, name: string): boolean {
    return this.edgeStates.get(id)?.has(name) ?? false;
  }

  /**
   * Remove state `name` from every node that carries it, in one pass. Useful
   * for clearing a transient selection / hover set without iterating
   * externally.
   */
  clearNodeState(name: string): void {
    const affected: string[] = [];
    for (const [id, set] of this.nodeStates) {
      if (set.delete(name)) {
        affected.push(id);
        if (set.size === 0) this.nodeStates.delete(id);
      }
    }
    for (const id of affected) this.rerenderNode(id);
  }

  clearEdgeState(name: string): void {
    const affected: string[] = [];
    for (const [id, set] of this.edgeStates) {
      if (set.delete(name)) {
        affected.push(id);
        if (set.size === 0) this.edgeStates.delete(id);
      }
    }
    for (const id of affected) this.rerenderEdge(id);
  }

  /** Ids currently carrying state `name`. Useful for snapshots / iteration. */
  *nodesWithState(name: string): IterableIterator<string> {
    for (const [id, set] of this.nodeStates) if (set.has(name)) yield id;
  }

  *edgesWithState(name: string): IterableIterator<string> {
    for (const [id, set] of this.edgeStates) if (set.has(name)) yield id;
  }

  // ─── Hit testing (placeholder) ───────────────────────────────────────────

  /**
   * Placeholder hit test — returns `null` until proper hit testing wires up
   * in a later phase (likely via the canvas hit-test pipeline reading the
   * renderer's shape registry).
   */
  hitTest(_worldX: number, _worldY: number): WorldLayerHit | null {
    return null;
  }

  // ─── Internals: data → spec translation ─────────────────────────────────

  /**
   * Resolve the active node hints — merges base `node.data` hints (legacy)
   * and v3 `node.style` with each active state's overlay (legacy + v3),
   * resolving layer-side resolver functions against the current node.
   *
   * Precedence (lowest → highest):
   * 1. layer `node.style` (resolved against GraphNode, adapted)
   * 2. `node.data` (legacy hints)
   * 3. per-node `node.style` (concrete NodeStyle, adapted)
   * 4. For each active state name in `node.states[]`:
   *    a. layer legacy `nodeStateConfigs[name]` (resolved)
   *    b. layer v3 `node.state[name]` (resolved against GraphNode, adapted)
   *    c. per-node `node.state[name]` (concrete NodeStyle, adapted)
   */
  private resolveNodeHints(node: GraphNode): NodeRenderHints {
    // Merge v3 NodeStyle fields BEFORE adapting. Necessary so layer-level
    // settings like `labelFontSize` compose with per-node `labelText` into
    // one ShapeLabelStyle — otherwise adapting layer + per-node separately
    // would build two labels and Object.assign would clobber the layer's
    // font settings with the per-node label.
    const mergedStyle: Partial<NodeStyle> = {};
    if (this.nodeOption?.style) {
      Object.assign(mergedStyle, resolveNodeStyleFields(this.nodeOption.style, node));
    }
    Object.assign(mergedStyle, (node.style as Partial<NodeStyle> | undefined) ?? {});

    // Start from legacy `node.data` hints, then apply the adapted v3 style.
    const out: NodeRenderHints = { ...((node.data as NodeRenderHints | undefined) ?? {}) };
    Object.assign(out, adaptNodeStyle(mergedStyle));

    const activeStates = this.nodeStates.get(node.id);
    if (activeStates && activeStates.size > 0) {
      const perNodeCatalogue = node.state as Readonly<Record<string, NodeStyle>> | undefined;
      for (const name of activeStates) {
        // (a) Legacy state config — applied directly to NodeRenderHints.
        const legacy = this.nodeStateConfigs.get(name);
        if (legacy) {
          for (const k of Object.keys(legacy) as (keyof ResolvableNodeRenderHints)[]) {
            const v = resolveField(legacy[k], node);
            if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
          }
        }
        // (b+c) v3 state overlays — merge into mergedStyle so label-field
        // composition works (e.g. state's `bgStrokeWidth` doesn't lose the
        // base `labelText`), then re-adapt.
        let stateDirty = false;
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          Object.assign(mergedStyle, resolveNodeStyleFields(layerOverlay, node));
          stateDirty = true;
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) {
          Object.assign(mergedStyle, perNodeOverlay);
          stateDirty = true;
        }
        if (stateDirty) {
          Object.assign(out, adaptNodeStyle(mergedStyle));
        }
      }
    }
    return out;
  }

  private resolveEdgeHints(edge: GraphEdge): EdgeRenderHints {
    const mergedStyle: Partial<EdgeStyle> = {};
    if (this.edgeOption?.style) {
      Object.assign(mergedStyle, resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    Object.assign(mergedStyle, (edge.style as Partial<EdgeStyle> | undefined) ?? {});

    const out: EdgeRenderHints = { ...((edge.data as EdgeRenderHints | undefined) ?? {}) };
    Object.assign(out, adaptEdgeStyle(mergedStyle));

    const activeStates = this.edgeStates.get(edge.id);
    if (activeStates && activeStates.size > 0) {
      const perEdgeCatalogue = edge.state as Readonly<Record<string, EdgeStyle>> | undefined;
      for (const name of activeStates) {
        const legacy = this.edgeStateConfigs.get(name);
        if (legacy) {
          for (const k of Object.keys(legacy) as (keyof ResolvableEdgeRenderHints)[]) {
            const v = resolveField(legacy[k], edge);
            if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
          }
        }
        let stateDirty = false;
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          Object.assign(mergedStyle, resolveEdgeStyleFields(layerOverlay, edge));
          stateDirty = true;
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) {
          Object.assign(mergedStyle, perEdgeOverlay);
          stateDirty = true;
        }
        if (stateDirty) {
          Object.assign(out, adaptEdgeStyle(mergedStyle));
        }
      }
    }
    return out;
  }

  private nodeSpec(node: GraphNode): CircleSpec | RectSpec | ArcSpec {
    const hints = this.resolveNodeHints(node);
    const shape = hints.shape ?? resolveField(this.nodeDefaults.shape, node)!;
    const size = hints.size ?? resolveField(this.nodeDefaults.size, node)!;
    const fill = hints.fill ?? resolveField(this.nodeDefaults.fill, node)!;
    const stroke = hints.stroke ?? resolveField(this.nodeDefaults.stroke, node)!;
    const strokeWidth =
      hints.strokeWidth ?? resolveField(this.nodeDefaults.strokeWidth, node)!;
    const alpha = hints.alpha ?? resolveField(this.nodeDefaults.alpha, node)!;
    const pos = node.position ?? { x: 0, y: 0 };

    const common = {
      x: pos.x,
      y: pos.y,
      alpha,
      ...(fill === false ? {} : { fill }),
      ...(stroke === false ? {} : { stroke: { color: stroke, width: strokeWidth } }),
    };

    if (shape === 'rect') {
      const height =
        hints.height ?? resolveField(this.nodeDefaults.height, node) ?? size;
      const cornerRadius =
        hints.cornerRadius ?? resolveField(this.nodeDefaults.cornerRadius, node)!;
      return {
        kind: 'rect',
        width: size,
        height,
        cornerRadius,
        ...common,
      };
    }
    if (shape === 'arc') {
      // Arc geometry comes from per-node hints (typically written by a
      // hierarchical layout like `D3HierarchyLayout({ mode: 'sunburst' })`).
      // Zero-sweep / zero-radius fallback so a node with unresolved arc
      // params is still legal — it just paints nothing until the layout fills
      // the hints in.
      return {
        kind: 'arc',
        innerR: hints.innerR ?? resolveField(this.nodeDefaults.innerR, node) ?? 0,
        outerR: hints.outerR ?? resolveField(this.nodeDefaults.outerR, node) ?? 0,
        startAngle:
          hints.startAngle ?? resolveField(this.nodeDefaults.startAngle, node) ?? 0,
        endAngle:
          hints.endAngle ?? resolveField(this.nodeDefaults.endAngle, node) ?? 0,
        ...common,
      };
    }
    // circle (default)
    return {
      kind: 'circle',
      radius: size / 2,
      ...common,
    };
  }

  private edgeSpec(edge: GraphEdge): BaseConnectorSpec {
    const hints = this.resolveEdgeHints(edge);
    const pathType = hints.pathType ?? resolveField(this.edgeDefaults.pathType, edge)!;
    const stroke = hints.stroke ?? resolveField(this.edgeDefaults.stroke, edge)!;
    const strokeWidth =
      hints.strokeWidth ?? resolveField(this.edgeDefaults.strokeWidth, edge)!;
    const alpha = hints.alpha ?? resolveField(this.edgeDefaults.alpha, edge)!;
    const arrow = hints.arrow ?? resolveField(this.edgeDefaults.arrow, edge)!;
    const baseAnchor =
      hints.anchor ?? resolveField(this.edgeDefaults.anchor, edge) ?? 'boundary';
    const sourceAnchorName =
      hints.sourceAnchor ?? resolveField(this.edgeDefaults.sourceAnchor, edge) ?? baseAnchor;
    const targetAnchorName =
      hints.targetAnchor ?? resolveField(this.edgeDefaults.targetAnchor, edge) ?? baseAnchor;
    const sourceAnchorOpts =
      hints.sourceAnchorOpts ?? resolveField(this.edgeDefaults.sourceAnchorOpts, edge);
    const targetAnchorOpts =
      hints.targetAnchorOpts ?? resolveField(this.edgeDefaults.targetAnchorOpts, edge);
    const pathStyleOpts =
      hints.pathStyleOpts ?? resolveField(this.edgeDefaults.pathStyleOpts, edge)!;
    const waypoints = hints.waypoints ?? resolveField(this.edgeDefaults.waypoints, edge);
    const { router, pathStyle } = pathTypeToRouterPathStyle(pathType);

    // String form when no per-endpoint opts; object form (`{ name, opts }`)
    // when opts present. Identity-equal to the previous one-arg form when
    // sourceAnchor / sourceAnchorOpts are undefined — zero cost on the
    // non-port path.
    const sourceAnchorSpec =
      sourceAnchorOpts && Object.keys(sourceAnchorOpts).length > 0
        ? { name: sourceAnchorName, opts: sourceAnchorOpts }
        : sourceAnchorName;
    const targetAnchorSpec =
      targetAnchorOpts && Object.keys(targetAnchorOpts).length > 0
        ? { name: targetAnchorName, opts: targetAnchorOpts }
        : targetAnchorName;

    return {
      kind: 'connector',
      source: { kind: 'shape', shapeId: edge.source, anchor: sourceAnchorSpec },
      target: { kind: 'shape', shapeId: edge.target, anchor: targetAnchorSpec },
      router,
      pathStyle,
      ...(pathStyleOpts && Object.keys(pathStyleOpts).length > 0 ? { pathStyleOpts } : {}),
      ...(waypoints && waypoints.length > 0 ? { waypoints } : {}),
      stroke: { color: stroke, width: strokeWidth },
      alpha,
      ...(arrow ? { targetMarker: { kind: 'arrow', fill: stroke } } : {}),
    };
  }

  /**
   * Re-render a single node from its current data + active state stack.
   *
   * Prefers `renderer.updateShape` (instance-preserving) over the
   * `removeShape + addShape` fallback so the renderer's per-instance
   * state — `gfxScale` (written by `NodeSizeLODBehaviour`), attached
   * decorations, badges, effects — survives a state toggle. Falls back
   * to remove+add only when the rebuilt spec has a different `kind`,
   * which `updateShape` can't safely handle (the `IShape` class is
   * fixed at construction time).
   */
  /**
   * Apply a node's data-driven `state` field to the visible state set.
   *
   * - `replacement === undefined` is the **insert path**: each name in
   *   `node.state` is toggled on additively (existing visible states stay).
   * - `replacement === null` or a `readonly string[]` is the **update path**:
   *   clear every currently-visible state on this id, then apply `replacement`.
   *   Replace-on-update means runtime states (e.g. hover) are wiped — the
   *   data feed is the source of truth at update time.
   */
  private syncDataDrivenNodeStates(
    node: GraphNode,
    replacement: readonly string[] | null | undefined,
  ): void {
    if (replacement === undefined) {
      // Insert path — only add named states; do not clear.
      for (const name of node.states ?? []) {
        this.setNodeState(node.id, name, true);
      }
      return;
    }
    // Update path — clear current visible set first, then apply replacement.
    const current = this.nodeStates.get(node.id);
    if (current && current.size > 0) {
      for (const name of [...current]) this.setNodeState(node.id, name, false);
    }
    if (replacement !== null) {
      for (const name of replacement) this.setNodeState(node.id, name, true);
    }
  }

  /** Sibling of {@link syncDataDrivenNodeStates} for edges. */
  private syncDataDrivenEdgeStates(
    edge: GraphEdge,
    replacement: readonly string[] | null | undefined,
  ): void {
    if (replacement === undefined) {
      for (const name of edge.states ?? []) {
        this.setEdgeState(edge.id, name, true);
      }
      return;
    }
    const current = this.edgeStates.get(edge.id);
    if (current && current.size > 0) {
      for (const name of [...current]) this.setEdgeState(edge.id, name, false);
    }
    if (replacement !== null) {
      for (const name of replacement) this.setEdgeState(edge.id, name, true);
    }
  }

  /**
   * Re-render every node currently in the layer. Used after a `nodeDefaults`
   * change so the new fallbacks take effect immediately. Edges are not
   * touched — change `edgeDefaults` to repaint those.
   */
  private rerenderAllNodes(): void {
    if (!this._renderer) return;
    for (const node of this.store.nodes()) this.rerenderNode(node.id);
  }

  /** Mirror of {@link rerenderAllNodes} for edges. */
  private rerenderAllEdges(): void {
    if (!this._renderer) return;
    for (const edge of this.store.edges()) this.rerenderEdge(edge.id);
  }

  private rerenderNode(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const spec = this.nodeSpec(node);
    const currentKind = this._renderer.getShapeKind(id);
    if (currentKind === undefined) {
      this._renderer.addShape(id, spec);
    } else if (currentKind === spec.kind) {
      // Kind already matches — cast through `BaseShapeSpec` since the
      // `CircleSpec | RectSpec | ArcSpec` union narrows by `kind` and
      // `updateShape`'s generic infers a single member otherwise.
      this._renderer.updateShape<BaseShapeSpec>(id, spec);
    } else {
      this._renderer.removeShape(id);
      this._renderer.addShape(id, spec);
    }
    // `syncNodeLabel` is idempotent — `setDecoration` replaces the
    // 'label' slot whether or not one was already there. Cheap to call
    // in both the update and rebuild branches.
    this.syncNodeLabel(id);
    // Anchors of incident connectors point to this shape — re-route in
    // either branch since the shape's bounds may have changed (size
    // hint shift, kind change, etc.).
    for (const edge of this.store.edgesOf(id, 'both')) {
      this.dirtyConnectors.add(edge.id);
    }
    this.drainDirtyConnectors();
  }

  /**
   * Re-render a single edge from its current data + active state stack.
   *
   * Always uses `renderer.updateConnector` so `inst.strokeWidthScale`
   * (written by `EdgeSizeLODBehaviour` as `1/cameraScale`) survives the
   * state-driven full-spec replacement. The fresh spec carries the new
   * "base" stroke width; the multiplier applies on top at draw time.
   */
  private rerenderEdge(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const spec = this.edgeSpec(edge);
    if (this._renderer.hasConnector(id)) {
      this._renderer.updateConnector(id, spec);
    } else {
      this._renderer.addConnector(id, spec);
    }
    this.syncEdgeLabel(id);
  }

  private drainDirtyConnectors(): void {
    if (this.dirtyConnectors.size === 0 || !this._renderer) return;
    for (const edgeId of this.dirtyConnectors) {
      this._renderer.updateConnector(edgeId, {});
    }
    this.dirtyConnectors.clear();
  }

  private installNodeShape(node: GraphNode): void {
    if (!this._renderer) return;
    this._renderer.addShape(node.id, this.nodeSpec(node));
    this.syncNodeLabel(node.id);
  }

  private installEdgeConnector(edge: GraphEdge): void {
    if (!this._renderer) return;
    this._renderer.addConnector(edge.id, this.edgeSpec(edge));
    this.syncEdgeLabel(edge.id);
  }

  /**
   * Project the resolved `label` hint onto the canvas `'label'` decoration
   * slot for the given node. A `null` / `undefined` hint clears the slot.
   * Called after every `addShape` and every `rerenderNode` since decorations
   * are dropped when the shape is destroyed.
   */
  private syncNodeLabel(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    // Per-node hint wins (always static); otherwise fall back to
    // `nodeDefaults.label` which may be a resolver function.
    const hint =
      this.resolveNodeHints(node).label
      ?? resolveField(this.nodeDefaults.label, node);
    if (hint === undefined || hint === null) {
      this._renderer.setDecoration(id, 'label', null);
      return;
    }
    this._renderer.setDecoration(id, 'label', {
      kind: 'label',
      style: nodeLabelHintToStyle(hint),
    });
  }

  private syncEdgeLabel(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const hint =
      this.resolveEdgeHints(edge).label
      ?? resolveField(this.edgeDefaults.label, edge);
    if (hint === undefined || hint === null) {
      this._renderer.setDecoration(id, 'label', null);
      return;
    }
    this._renderer.setDecoration(id, 'label', {
      kind: 'label-connector',
      style: edgeLabelHintToStyle(hint),
    });
  }

  private updateNodeShape(node: GraphNode, patch: Partial<GraphNode>): void {
    if (!this._renderer) return;

    // Skip the renderer entirely for patches whose fields don't affect what
    // the shape *looks* like. `pinned` is metadata for layouts; `parentId`
    // is metadata for hierarchy queries. Critically, **a renderer rebuild
    // during pixi's pointer-event flow would invalidate the in-flight
    // gesture** (the user clicks → drag-node pins → shape gets re-created
    // → pixi's synthesized `shape:click` for the original instance is
    // dropped). So a no-visual update must remain a no-op here.
    const patchKeys = Object.keys(patch);
    const nonVisualOnly = patchKeys.every((k) => k === 'pinned' || k === 'parentId');
    if (nonVisualOnly) return;

    // Position-only updates: cheap partial. Connectors anchored to this node
    // need re-routing too; queue them for the flush-time drain.
    if ('position' in patch && patch.position && patchKeys.length === 1) {
      this._renderer.updateShape<CircleSpec>(node.id, {
        x: patch.position.x,
        y: patch.position.y,
      });
      this.queueIncidentConnectors(node.id);
      return;
    }

    // Data change: prefer `updateShape` (instance-preserving — keeps the
    // renderer's `gfxScale`, decorations, badges, effects) and fall back
    // to `removeShape + addShape` only when the new spec has a different
    // `kind` (e.g. `circle` → `rect`). `updateShape` can't safely change
    // kind because the underlying `IShape` class is fixed at construction.
    const spec = this.nodeSpec(node);
    const currentKind = this._renderer.getShapeKind(node.id);
    if (currentKind === undefined) {
      this._renderer.addShape(node.id, spec);
    } else if (currentKind === spec.kind) {
      // See `rerenderNode` for the `BaseShapeSpec` cast rationale.
      this._renderer.updateShape<BaseShapeSpec>(node.id, spec);
    } else {
      this._renderer.removeShape(node.id);
      this._renderer.addShape(node.id, spec);
    }
    this.syncNodeLabel(node.id);
    // Connectors anchored to this shape may need re-routing in either
    // branch — the shape's bounds can shift on a size/kind change.
    this.queueIncidentConnectors(node.id);
  }

  private queueIncidentConnectors(nodeId: string): void {
    for (const edge of this.store.edgesOf(nodeId, 'both')) {
      this.dirtyConnectors.add(edge.id);
    }
  }

  private updateEdgeConnector(edge: GraphEdge, _patch: Partial<GraphEdge>): void {
    if (!this._renderer) return;
    // Prefer `updateConnector` (instance-preserving — keeps `strokeWidthScale`
    // from `EdgeSizeLODBehaviour`, attached decorations, effects). The
    // underlying `recomputeConnectorPath` rebuilds the routed geometry,
    // so router / pathStyle / marker changes still apply cleanly.
    const spec = this.edgeSpec(edge);
    if (this._renderer.hasConnector(edge.id)) {
      this._renderer.updateConnector(edge.id, spec);
    } else {
      this._renderer.addConnector(edge.id, spec);
    }
    this.syncEdgeLabel(edge.id);
  }
}

// ─── Label hint resolution ───────────────────────────────────────────────────

/**
 * Translate a `NodeLabelHint` (string shorthand or full payload) into the
 * `ShapeLabelStyle` shape the canvas decoration consumes. The string shorthand
 * expands to plain text with default placement (`'bottom'`).
 */
function nodeLabelHintToStyle(hint: NodeLabelHint): ShapeLabelStyle {
  if (typeof hint === 'string') {
    return { content: { kind: 'text', text: hint } };
  }
  return hint;
}

/**
 * Translate an `EdgeLabelHint` into the `ConnectorLabelStyle`. String shorthand
 * expands to plain text centred on the path with default `autoRotate: true`.
 */
function edgeLabelHintToStyle(hint: EdgeLabelHint): ConnectorLabelStyle {
  if (typeof hint === 'string') {
    return { content: { kind: 'text', text: hint } };
  }
  return hint;
}

// ─── v3 NodeStyle / EdgeStyle adapters (new-shape → legacy NodeRenderHints) ─
// Translate the v3 flat-key NodeStyle / EdgeStyle into the internal
// NodeRenderHints / EdgeRenderHints fields the renderer already understands.
// Keeps the v3 public API stable while reusing today's render path.

/**
 * Adapt a {@link NodeShapeOptions} (discriminated union) to the legacy
 * flat hint fields the renderer consumes. Lives inside `style.shape` in v3.
 */
function adaptNodeShape(shape: NodeShapeOptions | undefined): Partial<NodeRenderHints> {
  if (!shape) return {};
  switch (shape.kind) {
    case 'rect':
      return {
        shape: 'rect',
        size: shape.width,
        height: shape.height,
        ...(shape.cornerRadius !== undefined ? { cornerRadius: shape.cornerRadius } : {}),
      };
    case 'circle':
      return { shape: 'circle', size: shape.radius * 2 };
    case 'arc':
      return {
        shape: 'arc',
        innerR: shape.innerR,
        outerR: shape.outerR,
        startAngle: shape.startAngle,
        endAngle: shape.endAngle,
      };
  }
}

/**
 * Adapt the flat-prefixed {@link NodeStyle} fields to the legacy
 * NodeRenderHints fields. Includes the `style.shape` structural variant.
 *
 * Polymorphic fields (`bgFill` as ShapeFillLayer / array, `icon`, `image`,
 * `badges`, `decorations`, `effects`) are not yet wired into the legacy
 * spec path; they pass through for forward compatibility but the renderer
 * ignores them until a follow-up phase wires them.
 */
function adaptNodeStyle(style: Partial<NodeStyle> | undefined): Partial<NodeRenderHints> {
  if (!style) return {};
  const hints: Partial<NodeRenderHints> = { ...adaptNodeShape(style.shape) };
  if (style.bgFill !== undefined) {
    // Legacy `fill` only accepts `number | false`. Pass through numbers;
    // complex fill layers (gradient, glyph, image) are pending renderer
    // wiring — they no-op for now in the legacy path.
    if (typeof style.bgFill === 'number') hints.fill = style.bgFill;
  }
  if (style.bgStrokeColor !== undefined) hints.stroke = style.bgStrokeColor;
  if (style.bgStrokeWidth !== undefined) hints.strokeWidth = style.bgStrokeWidth;
  if (style.bgAlpha !== undefined) hints.alpha = style.bgAlpha;

  // Escape hatch: full `ShapeLabelStyle` payload wins over flat fields.
  if (style.labelStyle !== undefined) {
    hints.label = style.labelStyle;
  } else {
    const label = buildShapeLabelStyle(style);
    if (label !== undefined) hints.label = label;
  }
  return hints;
}

/**
 * Build a `ShapeLabelStyle` from the flat label fields on a NodeStyle.
 * Returns `undefined` when there's no `labelText` — a label without text
 * is meaningless, and silently emitting an empty-text label would show
 * a 0×0 decoration on nodes that only inherit layer-level label *settings*
 * without supplying any text.
 */
function buildShapeLabelStyle(style: Partial<NodeStyle>): ShapeLabelStyle | undefined {
  if (style.labelText === undefined) {
    return undefined;
  }
  return {
    content: {
      kind: 'text',
      text: style.labelText ?? '',
      ...(style.labelColor !== undefined ? { fill: style.labelColor } : {}),
      ...(style.labelFontSize !== undefined ? { fontSize: style.labelFontSize } : {}),
      ...(style.labelFontFamily !== undefined ? { fontFamily: style.labelFontFamily } : {}),
      ...(style.labelFontWeight !== undefined ? { fontWeight: style.labelFontWeight } : {}),
      ...(style.labelFontStyle !== undefined ? { fontStyle: style.labelFontStyle } : {}),
      ...(style.labelAlign !== undefined ? { align: style.labelAlign } : {}),
      ...(style.labelLineHeight !== undefined ? { lineHeight: style.labelLineHeight } : {}),
      ...(style.labelLetterSpacing !== undefined ? { letterSpacing: style.labelLetterSpacing } : {}),
    },
    ...(style.labelPlacement !== undefined ? { placement: style.labelPlacement } : {}),
    ...(style.labelRotation !== undefined ? { rotation: style.labelRotation } : {}),
    ...(style.labelAlpha !== undefined ? { alpha: style.labelAlpha } : {}),
    ...(style.labelMinFontSize !== undefined ? { minFontSize: style.labelMinFontSize } : {}),
    ...(style.labelPriority !== undefined ? { priority: style.labelPriority } : {}),
    ...(style.labelCollisionGroup !== undefined ? { collisionGroup: style.labelCollisionGroup } : {}),
    ...(style.labelForceShow !== undefined ? { forceShow: style.labelForceShow } : {}),
    ...(style.labelMinZoom !== undefined || style.labelMaxZoom !== undefined
      ? {
          visibility: {
            ...(style.labelMinZoom !== undefined ? { minZoom: style.labelMinZoom } : {}),
            ...(style.labelMaxZoom !== undefined ? { maxZoom: style.labelMaxZoom } : {}),
          },
        }
      : {}),
    ...(style.labelOffsetX !== undefined || style.labelOffsetY !== undefined
      ? {
          offset: {
            ...(style.labelOffsetX !== undefined ? { x: style.labelOffsetX } : {}),
            ...(style.labelOffsetY !== undefined ? { y: style.labelOffsetY } : {}),
          },
        }
      : {}),
    ...(buildLabelBackground(style) !== undefined ? { background: buildLabelBackground(style)! } : {}),
  };
}

/** Build the `LabelBackground` payload from flat `labelBackground*` fields. */
function buildLabelBackground(
  style: Partial<NodeStyle> | Partial<EdgeStyle>,
): ShapeLabelStyle['background'] | undefined {
  if (
    style.labelBackgroundFill === undefined
    && style.labelBackgroundAlpha === undefined
    && style.labelBackgroundStrokeColor === undefined
    && style.labelBackgroundStrokeWidth === undefined
    && style.labelBackgroundPadding === undefined
    && style.labelBackgroundCornerRadius === undefined
  ) {
    return undefined;
  }
  return {
    ...(style.labelBackgroundFill !== undefined ? { fill: style.labelBackgroundFill } : {}),
    ...(style.labelBackgroundAlpha !== undefined ? { fillAlpha: style.labelBackgroundAlpha } : {}),
    ...(style.labelBackgroundStrokeColor !== undefined ? { stroke: style.labelBackgroundStrokeColor } : {}),
    ...(style.labelBackgroundStrokeWidth !== undefined ? { strokeWidth: style.labelBackgroundStrokeWidth } : {}),
    ...(style.labelBackgroundPadding !== undefined ? { padding: style.labelBackgroundPadding } : {}),
    ...(style.labelBackgroundCornerRadius !== undefined ? { radius: style.labelBackgroundCornerRadius } : {}),
  };
}

/**
 * Resolve every Resolvable field on a ResolvableNodeStyle against `subject`
 * (raw input data at insert-time, or stored GraphNode at render-time).
 */
function resolveNodeStyleFields<D>(
  cfg: ResolvableNodeStyle<D>,
  subject: D,
): Partial<NodeStyle> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(cfg) as (keyof ResolvableNodeStyle<D>)[]) {
    const v = resolveField(cfg[k] as never, subject);
    if (v !== undefined) out[k as string] = v;
  }
  return out as Partial<NodeStyle>;
}

// ─── Edge adapters ─────────────────────────────────────────────────────────

/** Adapt {@link EdgeShapeOptions} (lives at edge.style.shape) to legacy hints. */
function adaptEdgeShape(shape: EdgeShapeOptions | undefined): Partial<EdgeRenderHints> {
  if (!shape) return {};
  const out: Partial<EdgeRenderHints> = {};
  if (shape.pathType !== undefined) out.pathType = shape.pathType;
  if (shape.sourceAnchor !== undefined) out.sourceAnchor = shape.sourceAnchor;
  if (shape.targetAnchor !== undefined) out.targetAnchor = shape.targetAnchor;
  if (shape.sourceAnchorOpts !== undefined) out.sourceAnchorOpts = shape.sourceAnchorOpts;
  if (shape.targetAnchorOpts !== undefined) out.targetAnchorOpts = shape.targetAnchorOpts;
  if (shape.pathStyleOpts !== undefined) out.pathStyleOpts = shape.pathStyleOpts;
  if (shape.waypoints !== undefined) out.waypoints = shape.waypoints;
  return out;
}

/**
 * Adapt the flat-prefixed {@link EdgeStyle} fields to the legacy
 * EdgeRenderHints fields. Includes the `edge.style.shape` structural variant.
 *
 * Arrow source/target are simplified — the legacy spec only supports
 * `arrow: boolean` (target-only). `arrowTargetShape` other than `'none'`
 * enables the arrow; `'none'` disables. Source arrows pass through as
 * forward-compat metadata but aren't yet rendered by the legacy path.
 */
function adaptEdgeStyle(style: Partial<EdgeStyle> | undefined): Partial<EdgeRenderHints> {
  if (!style) return {};
  const hints: Partial<EdgeRenderHints> = { ...adaptEdgeShape(style.shape) };
  if (style.strokeColor !== undefined) hints.stroke = style.strokeColor;
  if (style.strokeWidth !== undefined) hints.strokeWidth = style.strokeWidth;
  if (style.strokeAlpha !== undefined) hints.alpha = style.strokeAlpha;
  if (style.arrowTargetShape !== undefined) {
    hints.arrow = style.arrowTargetShape !== 'none';
  }
  // Escape hatch: full `ConnectorLabelStyle` payload wins over flat fields.
  if (style.labelStyle !== undefined) {
    hints.label = style.labelStyle;
  } else {
    const label = buildConnectorLabelStyle(style);
    if (label !== undefined) hints.label = label;
  }
  return hints;
}

/**
 * Build a `ConnectorLabelStyle` from the flat label fields on an EdgeStyle.
 * Returns `undefined` when there's no `labelText` — same rationale as
 * {@link buildShapeLabelStyle}.
 */
function buildConnectorLabelStyle(style: Partial<EdgeStyle>): ConnectorLabelStyle | undefined {
  if (style.labelText === undefined) {
    return undefined;
  }
  return {
    content: {
      kind: 'text',
      text: style.labelText ?? '',
      ...(style.labelColor !== undefined ? { fill: style.labelColor } : {}),
      ...(style.labelFontSize !== undefined ? { fontSize: style.labelFontSize } : {}),
      ...(style.labelFontFamily !== undefined ? { fontFamily: style.labelFontFamily } : {}),
      ...(style.labelFontWeight !== undefined ? { fontWeight: style.labelFontWeight } : {}),
      ...(style.labelFontStyle !== undefined ? { fontStyle: style.labelFontStyle } : {}),
      ...(style.labelAlign !== undefined ? { align: style.labelAlign } : {}),
      ...(style.labelLineHeight !== undefined ? { lineHeight: style.labelLineHeight } : {}),
      ...(style.labelLetterSpacing !== undefined ? { letterSpacing: style.labelLetterSpacing } : {}),
    },
    ...(style.labelPlacement !== undefined ? { placement: style.labelPlacement } : {}),
    ...(style.labelPathOffset !== undefined ? { pathOffset: style.labelPathOffset } : {}),
    ...(style.labelAutoRotate !== undefined ? { autoRotate: style.labelAutoRotate } : {}),
    ...(style.labelKeepUpright !== undefined ? { keepUpright: style.labelKeepUpright } : {}),
    ...(style.labelAlpha !== undefined ? { alpha: style.labelAlpha } : {}),
    ...(style.labelMinFontSize !== undefined ? { minFontSize: style.labelMinFontSize } : {}),
    ...(style.labelPriority !== undefined ? { priority: style.labelPriority } : {}),
    ...(style.labelCollisionGroup !== undefined ? { collisionGroup: style.labelCollisionGroup } : {}),
    ...(style.labelForceShow !== undefined ? { forceShow: style.labelForceShow } : {}),
    ...(style.labelMinZoom !== undefined || style.labelMaxZoom !== undefined
      ? {
          visibility: {
            ...(style.labelMinZoom !== undefined ? { minZoom: style.labelMinZoom } : {}),
            ...(style.labelMaxZoom !== undefined ? { maxZoom: style.labelMaxZoom } : {}),
          },
        }
      : {}),
    ...(style.labelOffsetX !== undefined || style.labelOffsetY !== undefined
      ? {
          offset: {
            ...(style.labelOffsetX !== undefined ? { x: style.labelOffsetX } : {}),
            ...(style.labelOffsetY !== undefined ? { y: style.labelOffsetY } : {}),
          },
        }
      : {}),
    ...(buildLabelBackground(style) !== undefined ? { background: buildLabelBackground(style)! } : {}),
  };
}

/**
 * Resolve every Resolvable field on a ResolvableEdgeStyle against `subject`.
 */
function resolveEdgeStyleFields<D>(
  cfg: ResolvableEdgeStyle<D>,
  subject: D,
): Partial<EdgeStyle> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(cfg) as (keyof ResolvableEdgeStyle<D>)[]) {
    const v = resolveField(cfg[k] as never, subject);
    if (v !== undefined) out[k as string] = v;
  }
  return out as Partial<EdgeStyle>;
}
