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
  DEFAULT_EDGE_STATES,
  DEFAULT_NODE_STATES,
  resolveField,
  type EdgeAnchor,
  type EdgeDecorationSpec,
  type EdgeOption,
  type EdgePathType,
  type EdgeStyle,
  type GraphData,
  type GraphLayerEvents,
  type GraphLayerOptions,
  type NodeDecorationSpec,
  type NodeOption,
  type NodeShapeOptions,
  type NodeStyle,
  type ResolvableEdgeStyle,
  type ResolvableNodeStyle,
} from './types';

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

  /** Data source. Either supplied by the caller or self-created. */
  readonly store: GraphStore;

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
   * Visual-state machinery — `id → Set<stateName>`. State styling itself
   * is declared on the `NodeOption.state` / per-node `state` catalogue;
   * this map only tracks which states are currently active per item so
   * the resolver can fold their overlays into the final NodeStyle.
   */
  private readonly nodeStates: Map<string, Set<string>> = new Map();
  private readonly edgeStates: Map<string, Set<string>> = new Map();

  /**
   * Currently-mounted decoration slot ids per node / edge, so the resolver
   * can diff (mount new / dispose removed / replace changed) against the
   * previous render's set. Slot ids are synthesized from `spec.id` or
   * `${kind}#<index>`. The `'label'` slot is managed separately by
   * `syncNodeLabel` / `syncEdgeLabel` and never appears in these maps.
   */
  private readonly nodeDecorationSlots: Map<string, Set<string>> = new Map();
  private readonly edgeDecorationSlots: Map<string, Set<string>> = new Map();

  // ─── v3 G6-aligned layer template ────────────────────────────────────
  // `options.node` and `options.edge` carry layer-level NodeOption /
  // EdgeOption templates (style + state catalogue, resolver-aware).
  private nodeOption: NodeOption | undefined;
  private edgeOption: EdgeOption | undefined;

  constructor(opts: LayerOptions<GraphLayerOptions>) {
    super(opts);
    this.store = opts.options.store ?? new GraphStore();
    // v3 G6-aligned layer template — single source of truth for style /
    // state catalogue. Both fields are resolver-aware via the
    // `ResolvableNodeStyle` / `ResolvableEdgeStyle` shape. The canonical
    // state defaults are auto-merged underneath so a layer that touches
    // no state code still renders distinct hover / select / error / etc.
    // visuals. Opt out with `useDefaultStates: false`.
    const useDefaults = opts.options.useDefaultStates !== false;
    this.nodeOption = mergeNodeOptionWithDefaults(opts.options.node, useDefaults);
    this.edgeOption = mergeEdgeOptionWithDefaults(opts.options.edge, useDefaults);
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
        this.nodeDecorationSlots.delete(nodeId);
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
        this.edgeDecorationSlots.delete(edgeId);
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
  /**
   * Resolve the final flat NodeStyle for a node by merging contributions from
   * the layer-level template (`options.node.style`), the per-node `style`,
   * and every active state's layer + per-node overlay. Object.assign order
   * encodes precedence (later wins).
   *
   * Exposed publicly so behaviours (NodeSizeLODBehaviour, label collision,
   * minimap, etc.) can read the same effective style the renderer sees,
   * without duplicating the merge logic.
   */
  resolveNodeStyle(node: GraphNode): Partial<NodeStyle> {
    const merged: Partial<NodeStyle> = {};
    if (this.nodeOption?.style) {
      Object.assign(merged, resolveNodeStyleFields(this.nodeOption.style, node));
    }
    Object.assign(merged, (node.style as Partial<NodeStyle> | undefined) ?? {});

    const activeStates = this.nodeStates.get(node.id);
    if (activeStates && activeStates.size > 0) {
      const perNodeCatalogue = node.state as Readonly<Record<string, NodeStyle>> | undefined;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          Object.assign(merged, resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) Object.assign(merged, perNodeOverlay);
      }
    }
    return merged;
  }

  /** Sibling of {@link resolveNodeStyle} for edges. Public for the same reason. */
  resolveEdgeStyle(edge: GraphEdge): Partial<EdgeStyle> {
    const merged: Partial<EdgeStyle> = {};
    if (this.edgeOption?.style) {
      Object.assign(merged, resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    Object.assign(merged, (edge.style as Partial<EdgeStyle> | undefined) ?? {});

    const activeStates = this.edgeStates.get(edge.id);
    if (activeStates && activeStates.size > 0) {
      const perEdgeCatalogue = edge.state as Readonly<Record<string, EdgeStyle>> | undefined;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          Object.assign(merged, resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) Object.assign(merged, perEdgeOverlay);
      }
    }
    return merged;
  }

  /**
   * Build the renderer-facing CircleSpec / RectSpec / ArcSpec from the
   * resolved {@link NodeStyle}. Geometry is driven by the discriminated
   * `style.shape` union; paint comes from the flat `bg*` fields.
   */
  private nodeSpec(node: GraphNode): CircleSpec | RectSpec | ArcSpec {
    const style = this.resolveNodeStyle(node);
    const shape: NodeShapeOptions = style.shape ?? { kind: 'circle', radius: 16 };
    const pos = node.position ?? { x: 0, y: 0 };

    const bgFill = style.bgFill;
    // Only number fills survive the spec — ShapeFill complex layer / array
    // forms aren't wired into the renderer yet.
    const fill = typeof bgFill === 'number' ? bgFill : undefined;

    const bgStrokeWidth = style.bgStrokeWidth ?? 0;
    const stroke =
      style.bgStrokeColor !== undefined && bgStrokeWidth > 0
        ? {
            color: style.bgStrokeColor,
            width: bgStrokeWidth,
            alignment: style.bgStrokeAlignment ?? 'outside',
            ...(style.bgStrokeAlpha !== undefined ? { alpha: style.bgStrokeAlpha } : {}),
            ...(style.bgStrokeDashArray ? { dashArray: style.bgStrokeDashArray } : {}),
            ...(style.bgStrokeDashOffset !== undefined ? { dashOffset: style.bgStrokeDashOffset } : {}),
          }
        : undefined;

    const common = {
      x: pos.x,
      y: pos.y,
      ...(style.bgAlpha !== undefined ? { alpha: style.bgAlpha } : {}),
      ...(fill !== undefined ? { fill } : {}),
      ...(stroke ? { stroke } : {}),
    };

    switch (shape.kind) {
      case 'rect':
        return {
          kind: 'rect',
          width: shape.width,
          height: shape.height,
          ...(shape.cornerRadius !== undefined ? { cornerRadius: shape.cornerRadius } : {}),
          ...common,
        };
      case 'arc':
        return {
          kind: 'arc',
          innerR: shape.innerR,
          outerR: shape.outerR,
          startAngle: shape.startAngle,
          endAngle: shape.endAngle,
          ...common,
        };
      case 'circle':
      default:
        return {
          kind: 'circle',
          radius: shape.radius,
          ...common,
        };
    }
  }

  /**
   * Build the renderer-facing connector spec from the resolved
   * {@link EdgeStyle}. The three-stage pipeline (anchor → router →
   * pathStyle) is driven by `style.shape.pathType` + the anchor / router
   * options on the same struct; paint comes from the flat `stroke*` fields.
   */
  private edgeSpec(edge: GraphEdge): BaseConnectorSpec {
    const style = this.resolveEdgeStyle(edge);
    const shape = style.shape ?? {};

    const pathType: EdgePathType = shape.pathType ?? 'straight';
    const { router, pathStyle } = pathTypeToRouterPathStyle(pathType);

    const baseAnchor: EdgeAnchor = 'boundary';
    const sourceAnchorName: EdgeAnchor = shape.sourceAnchor ?? baseAnchor;
    const targetAnchorName: EdgeAnchor = shape.targetAnchor ?? baseAnchor;
    const sourceAnchorOpts = shape.sourceAnchorOpts;
    const targetAnchorOpts = shape.targetAnchorOpts;
    const pathStyleOpts = shape.pathStyleOpts ?? {};
    const waypoints = shape.waypoints;

    const strokeColor = style.strokeColor ?? 0x94a3b8;
    const strokeWidth = style.strokeWidth ?? 1.5;
    const alpha = style.strokeAlpha ?? 1;

    const arrowTargetShape = style.arrowTargetShape ?? 'triangle';
    const arrowTargetColor = style.arrowTargetColor ?? strokeColor;

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
      stroke: {
        color: strokeColor,
        width: strokeWidth,
        ...(style.strokeAlignment !== undefined ? { alignment: style.strokeAlignment } : {}),
        ...(style.strokeDashArray ? { dashArray: style.strokeDashArray } : {}),
        ...(style.strokeDashOffset !== undefined ? { dashOffset: style.strokeDashOffset } : {}),
      },
      alpha,
      ...(arrowTargetShape !== 'none'
        ? { targetMarker: { kind: 'arrow', fill: arrowTargetColor } }
        : {}),
      ...(style.arrowSourceShape && style.arrowSourceShape !== 'none'
        ? { sourceMarker: { kind: 'arrow', fill: style.arrowSourceColor ?? strokeColor } }
        : {}),
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
      // `removeShape` disposes every mounted decoration on the host. Drop
      // our tracking so `syncNodeDecorations` treats the next pass as a
      // full mount instead of trying to diff against ghost slots.
      this.nodeDecorationSlots.delete(id);
      this._renderer.addShape(id, spec);
    }
    // `syncNodeLabel` / `syncNodeDecorations` are idempotent —
    // `setDecoration` replaces a slot whether or not one was already there.
    // Cheap to call in both the update and rebuild branches.
    this.syncNodeLabel(id);
    this.syncNodeDecorations(id);
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
    this.syncEdgeDecorations(id);
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
    this.syncNodeDecorations(node.id);
  }

  private installEdgeConnector(edge: GraphEdge): void {
    if (!this._renderer) return;
    this._renderer.addConnector(edge.id, this.edgeSpec(edge));
    this.syncEdgeLabel(edge.id);
    this.syncEdgeDecorations(edge.id);
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
    const style = this.resolveNodeStyle(node);
    // Escape hatch wins over flat-field synthesis.
    const labelStyle = style.labelStyle ?? buildShapeLabelStyle(style);
    if (!labelStyle) {
      this._renderer.setDecoration(id, 'label', null);
      return;
    }
    this._renderer.setDecoration(id, 'label', { kind: 'label', style: labelStyle });
  }

  private syncEdgeLabel(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const style = this.resolveEdgeStyle(edge);
    const labelStyle = style.labelStyle ?? buildConnectorLabelStyle(style);
    if (!labelStyle) {
      this._renderer.setDecoration(id, 'label', null);
      return;
    }
    this._renderer.setDecoration(id, 'label', { kind: 'label-connector', style: labelStyle });
  }

  /**
   * Resolve the final list of decorations for a node by concatenating every
   * contributing layer (layer template + per-node base + each active state
   * overlay) and deduping by `id`. Later precedence wins; `remove: true`
   * drops an earlier same-id entry. Entries without an explicit `id` fall
   * back to `${kind}#<combined-index>` — unique per source position, so
   * id-less decorations stack rather than collapsing.
   *
   * Returns a `Map<slotId, NodeDecorationSpec>` keyed by the resolved
   * identity. Caller emits one `setDecoration` call per slot to the
   * renderer; the slot id is reused on subsequent renders to enable diffing.
   */
  private resolveNodeDecorations(node: GraphNode): Map<string, NodeDecorationSpec> {
    const collected: NodeDecorationSpec[] = [];

    const pushFrom = (style: Partial<NodeStyle> | undefined): void => {
      const decos = style?.decorations;
      if (decos && decos.length > 0) collected.push(...decos);
    };

    if (this.nodeOption?.style) {
      pushFrom(resolveNodeStyleFields(this.nodeOption.style, node));
    }
    pushFrom(node.style as Partial<NodeStyle> | undefined);

    const activeStates = this.nodeStates.get(node.id);
    if (activeStates && activeStates.size > 0) {
      const perNodeCatalogue = node.state as Readonly<Record<string, NodeStyle>> | undefined;
      for (const name of activeStates) {
        const layerOverlay = this.nodeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveNodeStyleFields(layerOverlay, node));
        }
        const perNodeOverlay = perNodeCatalogue?.[name];
        if (perNodeOverlay) pushFrom(perNodeOverlay);
      }
    }

    const out = new Map<string, NodeDecorationSpec>();
    for (let i = 0; i < collected.length; i++) {
      const spec = collected[i]!;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      if (spec.remove) {
        out.delete(slotId);
      } else {
        out.set(slotId, spec);
      }
    }
    return out;
  }

  /** Sibling of {@link resolveNodeDecorations} for edges. */
  private resolveEdgeDecorations(edge: GraphEdge): Map<string, EdgeDecorationSpec> {
    const collected: EdgeDecorationSpec[] = [];

    const pushFrom = (style: Partial<EdgeStyle> | undefined): void => {
      const decos = style?.decorations;
      if (decos && decos.length > 0) collected.push(...decos);
    };

    if (this.edgeOption?.style) {
      pushFrom(resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    pushFrom(edge.style as Partial<EdgeStyle> | undefined);

    const activeStates = this.edgeStates.get(edge.id);
    if (activeStates && activeStates.size > 0) {
      const perEdgeCatalogue = edge.state as Readonly<Record<string, EdgeStyle>> | undefined;
      for (const name of activeStates) {
        const layerOverlay = this.edgeOption?.state?.[name];
        if (layerOverlay) {
          pushFrom(resolveEdgeStyleFields(layerOverlay, edge));
        }
        const perEdgeOverlay = perEdgeCatalogue?.[name];
        if (perEdgeOverlay) pushFrom(perEdgeOverlay);
      }
    }

    const out = new Map<string, EdgeDecorationSpec>();
    for (let i = 0; i < collected.length; i++) {
      const spec = collected[i]!;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      if (spec.remove) {
        out.delete(slotId);
      } else {
        out.set(slotId, spec);
      }
    }
    return out;
  }

  /**
   * Project the resolved decoration array onto the canvas renderer for the
   * given node. Diffs against the previous render's slot set tracked in
   * {@link nodeDecorationSlots}: mounts new ids, removes vanished ones,
   * replaces specs whose slot id appears in both.
   */
  private syncNodeDecorations(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const next = this.resolveNodeDecorations(node);
    const prev = this.nodeDecorationSlots.get(id);

    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.setDecoration(id, slotId, null);
      }
    }
    for (const [slotId, spec] of next) {
      const { kind, style } = splitDecorationSpec(spec);
      this._renderer.setDecoration(id, slotId, { kind, style });
    }

    if (next.size === 0) this.nodeDecorationSlots.delete(id);
    else this.nodeDecorationSlots.set(id, new Set(next.keys()));
  }

  /** Sibling of {@link syncNodeDecorations} for edges. */
  private syncEdgeDecorations(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const next = this.resolveEdgeDecorations(edge);
    const prev = this.edgeDecorationSlots.get(id);

    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.setDecoration(id, slotId, null);
      }
    }
    for (const [slotId, spec] of next) {
      const { kind, style } = splitDecorationSpec(spec);
      this._renderer.setDecoration(id, slotId, { kind, style });
    }

    if (next.size === 0) this.edgeDecorationSlots.delete(id);
    else this.edgeDecorationSlots.set(id, new Set(next.keys()));
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
      // `removeShape` disposes attached decorations — drop our tracking.
      this.nodeDecorationSlots.delete(node.id);
      this._renderer.addShape(node.id, spec);
    }
    this.syncNodeLabel(node.id);
    this.syncNodeDecorations(node.id);
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build the effective `NodeOption` by merging the caller's option (if any)
 * with {@link DEFAULT_NODE_STATES}. Consumer entries on `state[name]` win
 * outright — no per-field deep merge. When `applyDefaults` is `false`,
 * just returns the caller's option verbatim.
 */
function mergeNodeOptionWithDefaults(
  opt: NodeOption | undefined,
  applyDefaults: boolean,
): NodeOption | undefined {
  if (!applyDefaults) return opt;
  const mergedState = { ...DEFAULT_NODE_STATES, ...(opt?.state ?? {}) };
  return { ...(opt ?? {}), state: mergedState };
}

/** Sibling of {@link mergeNodeOptionWithDefaults} for edges. */
function mergeEdgeOptionWithDefaults(
  opt: EdgeOption | undefined,
  applyDefaults: boolean,
): EdgeOption | undefined {
  if (!applyDefaults) return opt;
  const mergedState = { ...DEFAULT_EDGE_STATES, ...(opt?.state ?? {}) };
  return { ...(opt ?? {}), state: mergedState };
}

/**
 * Split a `NodeDecorationSpec` / `EdgeDecorationSpec` (a discriminated
 * union with `{ kind, id?, remove?, ...style }`) into the renderer-facing
 * `{ kind, style }` shape. Strips the resolver-only `id` and `remove`
 * fields — they're consumed during {@link resolveNodeDecorations} /
 * {@link resolveEdgeDecorations} and aren't part of the decoration's
 * style payload.
 */
function splitDecorationSpec(
  spec: NodeDecorationSpec | EdgeDecorationSpec,
): { kind: string; style: Record<string, unknown> } {
  const { kind, id: _id, remove: _remove, ...style } = spec as NodeDecorationSpec & {
    id?: string;
    remove?: boolean;
  };
  return { kind, style: style as Record<string, unknown> };
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
