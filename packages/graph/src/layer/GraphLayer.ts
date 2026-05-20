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
  BaseShapeSpec,
  CanvasContext,
  ConnectorLabelStyle,
  LayerOptions,
  ShapeLabelStyle,
  WorldLayerHit,
} from '@invana/canvas';
import type { Rect, ShapeFillLayer } from '@invana/canvas/primitives';

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
  type GroupOptions,
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
    case 'quadratic':
      return { router: 'straight', pathStyle: 'quadratic' };
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
    case 'loop-curve':
    case 'loop-polyline':
      // Self-loop styles: source and target reference the same shape, so
      // the anchor/router stage emits a degenerate two-coincident-point
      // polyline. The pathStyle generates the loop geometry from its own
      // opts; `straight` is the cheapest pass-through router.
      return { router: 'straight', pathStyle: t };
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
   * Last-projected collapsed flag per group node id. Read by the
   * `node:update` handler so it can detect a collapse → expand (or
   * expand → collapse) flip — the patch itself doesn't carry the
   * previous style, and the store has already overwritten it by the
   * time the event fires. Updated by {@link syncGroupSyntheticDecorations}
   * on every group render.
   */
  private readonly lastCollapsedByGroup: Map<string, boolean> = new Map();

  /**
   * Group node ids whose visible frame may need re-projection (auto-fit
   * recompute, descendant visibility change, collapse / expand toggle).
   * Drained per flush in deepest-first order — see {@link drainDirtyGroups}.
   *
   * Populated by store subscriptions when:
   * - a group's own spec changes (add / update with `style.group` patch),
   * - a child's position changes and its parent is a group with `autoFit`,
   * - a child is added / removed from a group.
   *
   * Holding ids (not full snapshots) keeps the bucket idempotent — multiple
   * mutations within a single batch coalesce to one rerender per group.
   */
  private dirtyGroups: Set<string> = new Set();

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
      if (this.isGroupNode(node)) this.dirtyGroups.add(node.id);
    }
    for (const edge of this.store.edges()) {
      this.installEdgeConnector(edge);
      this.syncDataDrivenEdgeStates(edge, undefined);
    }
    // Settle every group's auto-fit frame and visibility state in one pass
    // before the first user input — `installNodeShape` iterated linearly,
    // so a parent inserted before its children rendered against zero
    // children. Drain now to re-fit those frames against the freshly-mounted
    // descendants.
    this.drainDirtyGroups();

    // Subscribe to fine-grained store events.
    const s = this.store.events;
    this.subs.push(
      s.on('node:add', ({ nodeId }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        this.installNodeShape(node);
        this.syncDataDrivenNodeStates(node, undefined);
        // Inserting a child node may extend an ancestor group's auto-fit
        // bbox; mark the parent chain for recompute. Also re-mark this
        // node if it is itself a group, so its initial frame projects with
        // whatever children landed first.
        if (this.isGroupNode(node)) this.dirtyGroups.add(node.id);
        if (node.parentId) this.markGroupAncestorsDirty(node.parentId);
      }),
      s.on('node:update', ({ nodeId, patch }) => {
        const node = this.store.getNode(nodeId);
        if (!node) return;
        const wasCollapsed = this.lastCollapsedByGroup.get(nodeId) === true;
        this.updateNodeShape(node, patch);
        if ('states' in patch) {
          this.syncDataDrivenNodeStates(node, patch.states ?? null);
        }
        // A position patch on a child propagates up to any auto-fit group
        // ancestor; their frames re-shrink / grow on the next flush.
        if (patch.position && node.parentId) {
          this.markGroupAncestorsDirty(node.parentId);
        }
        // A re-parent triggers a recompute on the *new* parent chain. We
        // can't reach the *previous* parent through the patch alone (the
        // store has already mutated the index), so old-parent shrinkage
        // mirrors the `node:remove` limitation: explicit `recomputeGroup`
        // is the escape hatch when the feed re-parents individually.
        if ('parentId' in patch && node.parentId) {
          this.markGroupAncestorsDirty(node.parentId);
        }
        // A group's own style patch (collapsed flip, padding change, size
        // change) re-projects this group; if collapsed changed, descendants'
        // visibility and incident-edge endpoints need a refresh too.
        if (this.isGroupNode(node)) {
          this.dirtyGroups.add(node.id);
          const isNowCollapsed = this.isCollapsedGroup(node);
          if (wasCollapsed !== isNowCollapsed) {
            this.refreshDescendantsAndIncidentEdges(node.id);
          }
        }
      }),
      s.on('node:remove', ({ nodeId }) => {
        this.nodeStates.delete(nodeId);
        this.nodeDecorationSlots.delete(nodeId);
        this._renderer?.removeShape(nodeId);
        this.dirtyGroups.delete(nodeId);
        this.lastCollapsedByGroup.delete(nodeId);
        // We can't infer the removed node's parentId from the event payload
        // (the store has already cleaned it up). For an auto-fit group whose
        // child was just removed, the frame will not auto-shrink on its own
        // — call `recomputeGroup(parentId)` explicitly if your feed removes
        // children individually and you want the frame to track. Frames
        // grow / shrink correctly on add and on every position change.
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
        // Groups first — their frames may grow / shrink based on freshly-
        // mutated child positions, which in turn shifts the anchor points
        // every incident connector sees on the next route.
        this.drainDirtyGroups();
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
   * Build the renderer-facing shape spec from the resolved {@link NodeStyle}.
   * Geometry is driven by the discriminated `style.shape` union; paint comes
   * from the flat `bg*` fields.
   *
   * The `kind` discriminator and any spec params on `style.shape` pass
   * straight through to the renderer, so any shape registered via
   * `canvas.primitives.registerShape(name, ctor)` is usable by name — built-
   * ins (`rect` / `circle` / `arc` / `regular-polygon` / `star` / `polygon`)
   * and custom shapes alike. An unknown `kind` errors loudly in the
   * renderer's `addShape` rather than silently falling back to a circle.
   */
  /**
   * Local AABB for `node`'s resolved shape. Delegates to the registered
   * shape's `static boundsOf` via `PrimitivesRenderer.boundsOfSpec`, so
   * built-in and custom shape kinds flow through the same hook.
   *
   * Returns `undefined` when:
   * - the renderer isn't mounted yet,
   * - the resolved `style.shape.kind` isn't registered, or
   * - the registered ctor doesn't implement `boundsOf`.
   *
   * The returned rect is in the shape's local (centre-relative) frame —
   * `node.position` is *not* baked in. Consumers that only need a size
   * read `width` / `height`; consumers that need world-space corners
   * offset by `node.position` themselves.
   *
   * Used by `MiniMapLayer` to estimate node footprint before the source
   * renderer mounts and by `ElkLayout` (and other layouts) to read node
   * sizes for layout-time placement — both without switching over a
   * closed shape-kind enum.
   */
  boundsOfNode(node: GraphNode): Rect | undefined {
    if (!this._renderer) return undefined;
    return this._renderer.boundsOfSpec(this.nodeSpec(node));
  }

  private nodeSpec(node: GraphNode): BaseShapeSpec {
    const style = this.resolveNodeStyle(node);
    let shape: NodeShapeOptions = style.shape ?? { kind: 'circle', radius: 10 };
    let pos = node.position ?? { x: 0, y: 0 };

    // Group projection — frame-size / position recompute for expanded
    // auto-fit groups, and zIndex push-back so descendants paint on top.
    // Collapsed groups skip the recompute and project as a regular node;
    // children are hidden separately via the `visible: false` branch below.
    const group = style.group;
    if (group && !group.collapsed) {
      const fitted = this.projectGroupShape(node.id, shape, group, pos);
      shape = fitted.shape;
      pos = fitted.pos;
    }

    // Visibility — a node is hidden when any ancestor is a collapsed group.
    // We still emit a spec (so decorations / size are valid for any incident
    // edge re-route math against the group node), but with `visible: false`
    // so PixiJS skips drawing it.
    const hiddenByGroup = this.collapsedAncestor(node.id) !== undefined;

    // Project the resolved style into a `ShapeFill` for the renderer.
    // Layers stack bottom-up:
    //   1. `bgFill` — `number` (shorthand solid), single `ShapeFillLayer`,
    //      or `ReadonlyArray<ShapeFillLayer>`. Arrays are passed through
    //      so consumers can express e.g. tint + glow / image-cover +
    //      colour-wash compositions directly.
    //   2. `style.image` — projects 1:1 to a `kind: 'image'` layer. The
    //      canvas renderer cover-fits the texture into the silhouette.
    //   3. `style.icon` — projects verbatim to a `glyph` / `svg` /
    //      `svg-url` layer. The discriminated union mirrors
    //      `ShapeFillLayer` field-for-field.
    // The fast path (no image, no icon, `bgFill` is a number) collapses
    // to the bare-number shorthand so simple solid nodes stay cheap.
    const bg = style.bgFill;
    const hasImage = style.image !== undefined;
    const hasIcon = style.icon !== undefined;
    let fill: number | ReadonlyArray<ShapeFillLayer> | undefined;
    if (!hasImage && !hasIcon && typeof bg === 'number') {
      fill = bg;
    } else if (bg === undefined && !hasImage && !hasIcon) {
      fill = undefined;
    } else {
      const layers: ShapeFillLayer[] = [];
      if (typeof bg === 'number') {
        layers.push({ kind: 'solid', color: bg });
      } else if (Array.isArray(bg)) {
        for (const l of bg) layers.push(l as ShapeFillLayer);
      } else if (bg !== undefined) {
        layers.push(bg as ShapeFillLayer);
      }
      if (style.image !== undefined) {
        const img = style.image;
        layers.push({
          kind: 'image',
          url: img.url,
          ...(img.alpha !== undefined ? { alpha: img.alpha } : {}),
          ...(img.fit !== undefined ? { fit: img.fit } : {}),
          ...(img.padding !== undefined ? { padding: img.padding } : {}),
        });
      }
      if (style.icon !== undefined) {
        layers.push(style.icon as ShapeFillLayer);
      }
      fill = layers.length > 0 ? layers : undefined;
    }

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

    // Compute the effective zIndex. Expanded group nodes paint underneath
    // their descendants by default (`behindChildren !== false`); subtract
    // one from any declared zIndex so children (at zIndex 0 by default)
    // sit on top. Collapsed groups skip this — they render like a regular
    // interactive node.
    const baseZ = (style as { zIndex?: number }).zIndex;
    let zIndex: number | undefined = baseZ;
    if (group && !group.collapsed && group.behindChildren !== false) {
      zIndex = (baseZ ?? 0) - 1;
    }

    return {
      ...(shape as unknown as Record<string, unknown>),
      x: pos.x,
      y: pos.y,
      ...(style.bgAlpha !== undefined ? { alpha: style.bgAlpha } : {}),
      ...(fill !== undefined ? { fill } : {}),
      ...(stroke ? { stroke } : {}),
      ...(zIndex !== undefined ? { zIndex } : {}),
      // Always emit `visible` — the renderer partial-merges patches onto
      // the cached spec, so omitting the field on the "now visible" pass
      // after a collapse → expand transition would leave the previous
      // `visible: false` in place and the descendant would stay hidden.
      visible: !hiddenByGroup,
    } as BaseShapeSpec;
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

    // When an endpoint sits under a collapsed group ancestor, re-route the
    // connector to that ancestor so the line ends at the visible super-node
    // instead of pointing at a hidden descendant. The store edge is not
    // mutated — `edge.source` / `edge.target` stay authoritative.
    const sourceShapeId = this.effectiveEndpoint(edge.source);
    const targetShapeId = this.effectiveEndpoint(edge.target);

    // Collapse-induced self-loop: an intra-group edge whose both endpoints
    // now resolve to the same collapsed group. Rendering it would produce
    // a degenerate stub at the group's silhouette — visible as a stray
    // segment near the super-node. Hide it. Always emit `visible` so the
    // renderer's partial-merge restores the field on re-expand.
    const isCollapseSelfLoop =
      sourceShapeId === targetShapeId && edge.source !== edge.target;

    return {
      kind: 'connector',
      source: { kind: 'shape', shapeId: sourceShapeId, anchor: sourceAnchorSpec },
      target: { kind: 'shape', shapeId: targetShapeId, anchor: targetAnchorSpec },
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
      visible: !isCollapseSelfLoop,
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
      // Kind already matches — instance-preserving partial update.
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
    this.syncGroupSyntheticDecorations(id);
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
    this.syncGroupSyntheticDecorations(node.id);
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
      this._renderer.updateShape<BaseShapeSpec>(node.id, {
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
    this.syncGroupSyntheticDecorations(node.id);
    // Connectors anchored to this shape may need re-routing in either
    // branch — the shape's bounds can shift on a size/kind change.
    this.queueIncidentConnectors(node.id);
  }

  private queueIncidentConnectors(nodeId: string): void {
    for (const edge of this.store.edgesOf(nodeId, 'both')) {
      this.dirtyConnectors.add(edge.id);
    }
    // When the moved node is a collapsed group, the renderer-side anchor
    // for any descendant's edge has been re-routed to *this* group via
    // `effectiveEndpoint`. Those edges live under the descendants in the
    // store (`edge.source` / `edge.target` are never mutated), so the
    // top-level `edgesOf(group)` walk doesn't see them. Sweep the
    // descendant subtree explicitly so the connector re-routes when the
    // collapsed group is dragged.
    const node = this.store.getNode(nodeId);
    if (node && this.isCollapsedGroup(node)) {
      for (const descId of this.store.descendantsOf(nodeId)) {
        for (const edge of this.store.edgesOf(descId, 'both')) {
          this.dirtyConnectors.add(edge.id);
        }
      }
    }
  }

  // ─── Group helpers ────────────────────────────────────────────────────

  /**
   * True iff `node`'s resolved style carries a `group` field — the only
   * signal that promotes the node from a regular renderable into a
   * compound-group frame.
   *
   * Cheap to call: reads {@link resolveNodeStyle} which is already
   * memoised per render cycle through `Object.assign` of the merged
   * contributions.
   */
  isGroupNode(node: GraphNode): boolean {
    const style = this.resolveNodeStyle(node);
    return style.group !== undefined;
  }

  /** True when this group node's resolved style carries `group.collapsed === true`. */
  isCollapsedGroup(node: GraphNode): boolean {
    const style = this.resolveNodeStyle(node);
    return style.group?.collapsed === true;
  }

  /**
   * Public predicate behaviours can use to filter group nodes out of their
   * own hit pipeline. Hover / select / drag should typically skip groups
   * when the group is *expanded* (the frame is interaction-less) but treat
   * a collapsed group as a regular node. Returns one of:
   *
   * - `'none'`  — the id is not a group (treat as a regular node).
   * - `'expanded'` — group, currently expanded. Behaviours wanting to honour
   *   the "interaction-less frame" intent should early-return.
   * - `'collapsed'` — group, currently collapsed. Behaviours that act on
   *   regular nodes should treat this as a normal target.
   * - `undefined` — no such node.
   *
   * The string form is preferred over a boolean pair so a future
   * `'collapsed-locked'` (or similar) can be added without breaking callers.
   */
  getGroupRole(nodeId: string): 'none' | 'expanded' | 'collapsed' | undefined {
    const node = this.store.getNode(nodeId);
    if (!node) return undefined;
    if (!this.isGroupNode(node)) return 'none';
    return this.isCollapsedGroup(node) ? 'collapsed' : 'expanded';
  }

  /**
   * Climb the `parentId` chain from `nodeId` (exclusive) and return the
   * first ancestor whose resolved style has `group.collapsed === true`, or
   * `undefined` if no such ancestor exists. Used to decide whether a node
   * is currently hidden (any collapsed ancestor → hidden) and where to
   * re-route an incident edge (to that collapsed ancestor).
   */
  collapsedAncestor(nodeId: string): string | undefined {
    let cur = this.store.getNode(nodeId);
    while (cur?.parentId) {
      const parent = this.store.getNode(cur.parentId);
      if (!parent) return undefined;
      if (this.isCollapsedGroup(parent)) return parent.id;
      cur = parent;
    }
    return undefined;
  }

  /**
   * Resolve which renderer-side shape id an edge endpoint should attach to
   * for `nodeId`. Returns the nearest collapsed-group ancestor when the
   * node is hidden, or `nodeId` unchanged when the node is visible. Pure
   * read — the store's `edge.source` / `edge.target` are never mutated.
   */
  effectiveEndpoint(nodeId: string): string {
    return this.collapsedAncestor(nodeId) ?? nodeId;
  }

  /**
   * Walk the `parentId` chain from `nodeId` and `add` every group ancestor
   * to {@link dirtyGroups}. Called whenever a descendant moves, is added,
   * or otherwise triggers an auto-fit recompute.
   */
  private markGroupAncestorsDirty(nodeId: string): void {
    let cur: GraphNode | undefined = this.store.getNode(nodeId);
    while (cur) {
      if (this.isGroupNode(cur)) this.dirtyGroups.add(cur.id);
      if (!cur.parentId) break;
      cur = this.store.getNode(cur.parentId);
    }
  }

  /**
   * After a group flips `collapsed`, every descendant changes visibility
   * and every incident edge of every descendant needs re-routing (the
   * endpoint now resolves to either the original node or to the collapsed
   * group ancestor). Walk the subtree once, re-render each descendant
   * (which re-projects `visible`), and queue incident edges for re-route.
   */
  private refreshDescendantsAndIncidentEdges(groupId: string): void {
    // Avoid re-rendering the same connector twice when both endpoints are
    // descendants of the toggled group.
    const seenEdges = new Set<string>();
    const refreshEdge = (edgeId: string): void => {
      if (seenEdges.has(edgeId)) return;
      seenEdges.add(edgeId);
      // Full rerender (not just dirtyConnectors → empty partial). On a
      // collapse-induced self-loop the new spec carries `visible: false`,
      // and on re-expand it switches back to `visible: true`. The empty
      // partial path only re-routes the path; it doesn't refresh the
      // spec's `visible` field, so the renderer's cached value would
      // survive the transition.
      this.rerenderEdge(edgeId);
    };
    for (const descId of this.store.descendantsOf(groupId)) {
      const desc = this.store.getNode(descId);
      if (!desc) continue;
      this.rerenderNode(descId);
      for (const edge of this.store.edgesOf(descId, 'both')) refreshEdge(edge.id);
    }
    // Edges of the group node itself can swap from a "real" endpoint to
    // the same ancestor's id when there's a nested-collapse scenario.
    for (const edge of this.store.edgesOf(groupId, 'both')) refreshEdge(edge.id);
  }

  /**
   * Compute the world-space AABB of the direct (one-level) children of
   * `groupId`. Returns `undefined` when the group has no children — the
   * caller falls back to whatever floor size the group's declared
   * width/height/radius provides.
   *
   * Recurses into child groups via {@link boundsOfNode} so a child whose
   * own frame has already been auto-fit contributes its current size, not
   * its stored declared size.
   */
  private directChildrenWorldBounds(
    groupId: string,
  ): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (const childId of this.store.childrenOf(groupId)) {
      const child = this.store.getNode(childId);
      if (!child) continue;
      const local = this.boundsOfNode(child);
      if (!local) continue;
      const pos = child.position ?? { x: 0, y: 0 };
      const wx = pos.x + local.x;
      const wy = pos.y + local.y;
      if (wx < minX) minX = wx;
      if (wy < minY) minY = wy;
      if (wx + local.width > maxX) maxX = wx + local.width;
      if (wy + local.height > maxY) maxY = wy + local.height;
      any = true;
    }
    return any ? { minX, minY, maxX, maxY } : undefined;
  }

  /**
   * Project an expanded group's spec — apply auto-fit (when enabled),
   * compose the children-derived width/height/radius with the group's
   * declared floor, and shift `pos` so the frame wraps the bbox correctly.
   *
   * For `kind: 'rect'`: `pos` becomes top-left of the framed area; size is
   * `max(declared, childrenAABB) + 2 · padding (+ headerHeight on y)`.
   *
   * For `kind: 'circle'`: `pos` becomes the AABB centroid; `radius` is
   * `max(declared, AABB half-diagonal) + padding`. The half-diagonal is
   * the smallest enclosing-circle approximation that's still cheap
   * (`Math.hypot` over AABB half-extents); true minimum-enclosing-circle
   * (Welzl) is out of scope.
   *
   * Non-rect / non-circle group shapes pass through untouched — autoFit is
   * a no-op outside those two kinds. Domain shapes that want their own
   * fit math can extend the layer's projection later.
   */
  private projectGroupShape(
    groupId: string,
    shape: NodeShapeOptions,
    group: GroupOptions,
    pos: { x: number; y: number },
  ): { shape: NodeShapeOptions; pos: { x: number; y: number } } {
    const padding = group.padding ?? 16;
    const header = group.headerHeight ?? 0;
    const bbox = group.autoFit ? this.directChildrenWorldBounds(groupId) : undefined;

    if (shape.kind === 'rect') {
      const rectShape = shape as { kind: 'rect'; width: number; height: number; cornerRadius?: number };
      let width = group.width ?? rectShape.width;
      let height = group.height ?? rectShape.height;
      let nextPos = pos;
      if (bbox) {
        const childW = bbox.maxX - bbox.minX;
        const childH = bbox.maxY - bbox.minY;
        width = Math.max(width ?? 0, childW) + 2 * padding;
        height = Math.max(height ?? 0, childH) + 2 * padding + header;
        nextPos = { x: bbox.minX - padding, y: bbox.minY - padding - header };
      } else {
        // No children: honour declared dims; ensure non-zero so the frame
        // still renders something rather than a 0×0 silhouette.
        width = Math.max(width ?? 0, 1);
        height = Math.max(height ?? 0, 1);
      }
      const out: NodeShapeOptions = { ...rectShape, width, height };
      return { shape: out, pos: nextPos };
    }
    if (shape.kind === 'circle') {
      const circleShape = shape as { kind: 'circle'; radius: number };
      let radius = group.radius ?? circleShape.radius;
      let nextPos = pos;
      if (bbox) {
        const halfW = (bbox.maxX - bbox.minX) / 2;
        const halfH = (bbox.maxY - bbox.minY) / 2;
        const halfDiag = Math.hypot(halfW, halfH);
        radius = Math.max(radius ?? 0, halfDiag) + padding;
        nextPos = {
          x: bbox.minX + halfW,
          y: bbox.minY + halfH,
        };
      } else {
        radius = Math.max(radius ?? 0, 1);
      }
      const out: NodeShapeOptions = { ...circleShape, radius };
      return { shape: out, pos: nextPos };
    }
    // Non-fit-aware shape kind — pass through.
    return { shape, pos };
  }

  /**
   * Force a group's frame to re-project right now (outside the normal
   * flush cycle). Public escape hatch for feeds that remove children
   * individually without triggering a position change on a sibling — the
   * `node:remove` event doesn't carry the parentId, so the layer can't
   * mark the parent dirty on its own. Domain code can call this after
   * `store.removeNode` to make the auto-fit frame catch up.
   */
  recomputeGroup(groupId: string): void {
    this.dirtyGroups.add(groupId);
    this.drainDirtyGroups();
  }

  /**
   * Drain {@link dirtyGroups} in deepest-first order. Each pop re-renders
   * the group (re-running `nodeSpec` with the latest auto-fit math) and
   * marks the group's own parent chain dirty so a multi-level nested
   * group cascade settles in one flush.
   *
   * Bounded by `MAX_PASSES` to defend against a pathological cycle (which
   * the cycle-rejecting store should already prevent on insert, but the
   * extra guard is cheap).
   */
  private drainDirtyGroups(): void {
    const MAX_PASSES = 32;
    let pass = 0;
    while (this.dirtyGroups.size > 0 && pass++ < MAX_PASSES) {
      // Sort current set by ancestor-chain depth, deepest first. New ids
      // that get added during the pass will be processed in the next
      // outer iteration — bounded by MAX_PASSES.
      const ids = [...this.dirtyGroups];
      this.dirtyGroups.clear();
      ids.sort((a, b) => this.depthOf(b) - this.depthOf(a));
      for (const id of ids) {
        const node = this.store.getNode(id);
        if (!node) continue;
        this.rerenderNode(id);
        // Mark the group's incident edges dirty — the frame may have
        // moved or resized, shifting where boundary anchors land.
        for (const edge of this.store.edgesOf(id, 'both')) {
          this.dirtyConnectors.add(edge.id);
        }
        // Propagate the size change up to the parent group, if any.
        if (node.parentId) {
          const parent = this.store.getNode(node.parentId);
          if (parent && this.isGroupNode(parent)) {
            this.dirtyGroups.add(parent.id);
          }
        }
      }
    }
  }

  /**
   * Count of ancestors between `nodeId` and the root (`parentId === undefined`).
   * Used by {@link drainDirtyGroups} to order deepest first so a child
   * group recomputes before any group that depends on its bounds.
   */
  private depthOf(nodeId: string): number {
    let d = 0;
    let cur = this.store.getNode(nodeId);
    while (cur?.parentId) {
      d++;
      cur = this.store.getNode(cur.parentId);
    }
    return d;
  }

  /**
   * Project the synthetic group-only decorations onto the renderer:
   * - the `+` / `−` toggle button at the group's bottom anchor; and
   * - a centred count badge (label decoration) when the group is
   *   collapsed, showing the number of hidden descendants.
   *
   * Called on every node lifecycle event for group nodes. Cleared
   * automatically when `style.group` goes away (the slots get `null` so
   * any previous mount disposes).
   */
  private syncGroupSyntheticDecorations(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const style = this.resolveNodeStyle(node);
    const group = style.group;
    if (!group) {
      this._renderer.setDecoration(id, 'group-toggle', null);
      this._renderer.setDecoration(id, 'group-count', null);
      this.lastCollapsedByGroup.delete(id);
      return;
    }
    const isCollapsed = group.collapsed === true;
    this.lastCollapsedByGroup.set(id, isCollapsed);
    // Toggle button — present on every group, glyph mirrors collapsed state.
    // Placement is configurable via `group.togglePlacement`: a keyword
    // (`'bottom'`, `'inside-bottom'`, …) resolves against the host AABB,
    // or a `{ x, y }` object pins the toggle to exact shape-local coords.
    // Default `'bottom'` — centred just below the silhouette, matching
    // the "small bubble attached to the rim" pattern in the reference UI.
    // The behaviour does its own canvas-level hit math, so outside-
    // silhouette placements remain fully clickable.
    const tp = group.togglePlacement;
    const placementStyle =
      typeof tp === 'object' && tp !== null
        ? { position: tp }
        : { placement: tp ?? 'bottom' };
    this._renderer.setDecoration(id, 'group-toggle', {
      kind: 'toggle',
      style: {
        state: isCollapsed ? 'plus' : 'minus',
        radius: 10,
        ...placementStyle,
      },
    });
    if (isCollapsed) {
      let count = 0;
      for (const _ of this.store.descendantsOf(id)) count++;
      this._renderer.setDecoration(id, 'group-count', {
        kind: 'label',
        style: {
          content: {
            kind: 'text',
            text: String(count),
            fill: 0xffffff,
            fontSize: 14,
            fontWeight: 700,
          },
          placement: 'inside-center',
        },
      });
    } else {
      this._renderer.setDecoration(id, 'group-count', null);
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
