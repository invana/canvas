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
  BaseConnectorSpec,
  CanvasContext,
  CircleSpec,
  LayerOptions,
  RectSpec,
  WorldLayerHit,
} from '@invana/canvas';

import { GraphStore } from '../store/GraphStore';
import type { GraphEdge, GraphNode } from '../store/types';

import type {
  EdgePathType,
  EdgeRenderHints,
  EdgeStateConfig,
  GraphData,
  GraphLayerEvents,
  GraphLayerOptions,
  NodeRenderHints,
  NodeStateConfig,
} from './types';

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_NODE_HINTS: Required<Omit<NodeRenderHints, 'height' | 'label'>> = {
  shape: 'circle',
  size: 32,
  cornerRadius: 4,
  fill: 0x3b82f6,
  stroke: 0x1d4ed8,
  strokeWidth: 1,
  alpha: 1,
};

const DEFAULT_EDGE_HINTS: Required<EdgeRenderHints> = {
  pathType: 'straight',
  anchor: 'boundary',
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
    case 'orth':
      return { router: 'orth', pathStyle: 'normal' };
    case 'manhattan':
      return { router: 'manhattan', pathStyle: 'normal' };
    case 'rounded':
      return { router: 'orth', pathStyle: 'rounded' };
    case 'smooth':
      return { router: 'orth', pathStyle: 'smooth' };
  }
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
   * Resolved per-node defaults (caller-supplied `nodeDefaults` merged onto the
   * factory defaults). Exposed for layers that need to mirror what's drawn —
   * e.g. `MiniMapLayer` falls back to these when a node omits `shape` / `size`.
   */
  getNodeDefaults(): Required<Omit<NodeRenderHints, 'height' | 'label'>> {
    return this.nodeDefaults;
  }

  /** Data source. Either supplied by the caller or self-created. */
  readonly store: GraphStore;

  /** Resolved defaults (caller overrides + factory defaults). */
  private readonly nodeDefaults: Required<Omit<NodeRenderHints, 'height' | 'label'>>;
  private readonly edgeDefaults: Required<EdgeRenderHints>;

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

  constructor(opts: LayerOptions<GraphLayerOptions>) {
    super(opts);
    this.store = opts.options.store ?? new GraphStore();
    this.nodeDefaults = { ...DEFAULT_NODE_HINTS, ...opts.options.nodeDefaults };
    this.edgeDefaults = { ...DEFAULT_EDGE_HINTS, ...opts.options.edgeDefaults };
  }

  protected createState(): GraphLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    this._renderer = new PrimitivesRenderer({
      container: this.container,
      camera: ctx.camera,
    });

    // Initial sync — render anything the store already has.
    for (const node of this.store.nodes()) this.installNodeShape(node);
    for (const edge of this.store.edges()) this.installEdgeConnector(edge);

    // Subscribe to fine-grained store events.
    const s = this.store.events;
    this.subs.push(
      s.on('node:add', ({ nodeId }) => {
        const node = this.store.getNode(nodeId);
        if (node) this.installNodeShape(node);
      }),
      s.on('node:update', ({ nodeId, patch }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        this.updateNodeShape(node, patch);
      }),
      s.on('node:remove', ({ nodeId }) => {
        this.nodeStates.delete(nodeId);
        this._renderer?.removeShape(nodeId);
      }),
      s.on('edge:add', ({ edgeId }) => {
        const edge = this.store.getEdge(edgeId);
        if (edge) this.installEdgeConnector(edge);
      }),
      s.on('edge:update', ({ edgeId, patch }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        this.updateEdgeConnector(edge, patch);
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

  // ─── Sugar over store ────────────────────────────────────────────────────

  /**
   * Bulk-load nodes + edges. Wraps the underlying store inserts in a single
   * `batch()` so subscribers see one flush.
   */
  setData(data: GraphData): void {
    this.store.batch(() => {
      this.store.clear();
      this.store.addNodesBulk(data.nodes);
      this.store.addEdgesBulk(data.edges);
    });
  }

  /** Pass-through to the underlying store. */
  addNode<D>(node: GraphNode<D>): void {
    this.store.addNode(node);
  }

  /** Pass-through to the underlying store. */
  addEdge<D>(edge: GraphEdge<D>): void {
    this.store.addEdge(edge);
  }

  /** Pass-through to the underlying store. */
  removeNode(id: string, opts?: { cascade?: boolean }): void {
    this.store.removeNode(id, opts);
  }

  /** Pass-through to the underlying store. */
  removeEdge(id: string): void {
    this.store.removeEdge(id);
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

  /** Resolve the active node hints, merging base data hints + state overrides. */
  private resolveNodeHints(node: GraphNode): NodeRenderHints {
    const base = (node.data as NodeRenderHints | undefined) ?? {};
    const states = this.nodeStates.get(node.id);
    if (!states || states.size === 0) return base;
    const out: NodeRenderHints = { ...base };
    for (const name of states) {
      const cfg = this.nodeStateConfigs.get(name);
      if (!cfg) continue;
      for (const k of Object.keys(cfg) as (keyof NodeRenderHints)[]) {
        const v = cfg[k];
        if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
      }
    }
    return out;
  }

  private resolveEdgeHints(edge: GraphEdge): EdgeRenderHints {
    const base = (edge.data as EdgeRenderHints | undefined) ?? {};
    const states = this.edgeStates.get(edge.id);
    if (!states || states.size === 0) return base;
    const out: EdgeRenderHints = { ...base };
    for (const name of states) {
      const cfg = this.edgeStateConfigs.get(name);
      if (!cfg) continue;
      for (const k of Object.keys(cfg) as (keyof EdgeRenderHints)[]) {
        const v = cfg[k];
        if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
      }
    }
    return out;
  }

  private nodeSpec(node: GraphNode): CircleSpec | RectSpec {
    const hints = this.resolveNodeHints(node);
    const shape = hints.shape ?? this.nodeDefaults.shape;
    const size = hints.size ?? this.nodeDefaults.size;
    const fill = hints.fill ?? this.nodeDefaults.fill;
    const stroke = hints.stroke ?? this.nodeDefaults.stroke;
    const strokeWidth = hints.strokeWidth ?? this.nodeDefaults.strokeWidth;
    const alpha = hints.alpha ?? this.nodeDefaults.alpha;
    const pos = node.position ?? { x: 0, y: 0 };

    const common = {
      x: pos.x,
      y: pos.y,
      alpha,
      ...(fill === false ? {} : { fill }),
      ...(stroke === false ? {} : { stroke: { color: stroke, width: strokeWidth } }),
    };

    if (shape === 'rect') {
      const height = hints.height ?? size;
      const cornerRadius = hints.cornerRadius ?? this.nodeDefaults.cornerRadius;
      return {
        kind: 'rect',
        width: size,
        height,
        cornerRadius,
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
    const pathType = hints.pathType ?? this.edgeDefaults.pathType;
    const stroke = hints.stroke ?? this.edgeDefaults.stroke;
    const strokeWidth = hints.strokeWidth ?? this.edgeDefaults.strokeWidth;
    const alpha = hints.alpha ?? this.edgeDefaults.alpha;
    const arrow = hints.arrow ?? this.edgeDefaults.arrow;
    const anchor = hints.anchor ?? this.edgeDefaults.anchor ?? 'boundary';
    const { router, pathStyle } = pathTypeToRouterPathStyle(pathType);

    return {
      kind: 'connector',
      source: { kind: 'shape', shapeId: edge.source, anchor },
      target: { kind: 'shape', shapeId: edge.target, anchor },
      router,
      pathStyle,
      stroke: { color: stroke, width: strokeWidth },
      alpha,
      ...(arrow ? { targetMarker: { kind: 'arrow', fill: stroke } } : {}),
    };
  }

  /** Re-render a single node from its current data + active state stack. */
  private rerenderNode(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const spec = this.nodeSpec(node);
    this._renderer.removeShape(id);
    this._renderer.addShape(id, spec);
    // Adjacency anchors point to this shape — re-route connectors.
    for (const edge of this.store.edgesOf(id, 'both')) {
      this.dirtyConnectors.add(edge.id);
    }
    this.drainDirtyConnectors();
  }

  /** Re-render a single edge from its current data + active state stack. */
  private rerenderEdge(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const spec = this.edgeSpec(edge);
    this._renderer.removeConnector(id);
    this._renderer.addConnector(id, spec);
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
  }

  private installEdgeConnector(edge: GraphEdge): void {
    if (!this._renderer) return;
    this._renderer.addConnector(edge.id, this.edgeSpec(edge));
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

    // For data changes, rebuild the full spec by remove+add so a kind change
    // (circle → rect) works correctly. updateShape can't change `kind`
    // safely since it merges over the existing instance.
    const spec = this.nodeSpec(node);
    this._renderer.removeShape(node.id);
    this._renderer.addShape(node.id, spec);
    // A removed+re-added shape invalidates anchors referencing it — re-route
    // incident connectors too.
    this.queueIncidentConnectors(node.id);
  }

  private queueIncidentConnectors(nodeId: string): void {
    for (const edge of this.store.edgesOf(nodeId, 'both')) {
      this.dirtyConnectors.add(edge.id);
    }
  }

  private updateEdgeConnector(edge: GraphEdge, _patch: Partial<GraphEdge>): void {
    if (!this._renderer) return;
    // Same rationale as updateNodeShape — rebuild rather than partial-merge
    // so router/pathStyle/marker changes apply cleanly.
    const spec = this.edgeSpec(edge);
    this._renderer.removeConnector(edge.id);
    this._renderer.addConnector(edge.id, spec);
  }
}
