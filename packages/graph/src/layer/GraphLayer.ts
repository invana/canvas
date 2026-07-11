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

import { PrimitivesRenderer, WorldLayer, jsonSafe } from '@invana/canvas';
import type {
  BaseConnectorSpec,
  BaseShapeSpec,
  CanvasContext,
  ConnectorLabelStyle,
  LayerOptions,
  ShapeLabelStyle,
  WorldLayerHit,
} from '@invana/canvas';
import type {
  BadgeOptions,
  DecorationSpec,
  EffectSpec,
  Rect,
  ShapeFillLayer,
} from '@invana/canvas/primitives';

import { GraphStore } from '../store/GraphStore';
import type { EdgeDirection, GraphEdge, GraphNode } from '../store/types';

import {
  DEFAULT_EDGE_STATES,
  DEFAULT_NODE_STATES,
  resolveField,
  type EdgeAnchor,
  type EdgeBadge,
  type EdgeDecorationSpec,
  type EdgeOption,
  type EdgePathType,
  type EdgeStyle,
  type GraphData,
  type GraphLayerEvents,
  type GraphLayerOptions,
  type GroupOptions,
  type NodeBadge,
  type NodeDecorationSpec,
  type NodeOption,
  type NodeShapeOptions,
  type NodeStyle,
  type ArcShapeOption,
  type CircleShapeOption,
  type RectShapeOption,
  type RegularPolygonShapeOption,
  type StarShapeOption,
  type ResolvableEdgeStyle,
  type ResolvableNodeStyle,
} from './types';
import {
  hasAny,
  paletteToEdgeDefaults,
  paletteToGroupStyle,
  paletteToNodeDefaults,
  type RolePalette,
} from '../theme/roles';
import { DEFAULT_THEME } from '../theme/themes';
import { compileCard, compileFreeform, compileSimple } from '../template/compile';
import { BUILT_IN_STRUCTURES, BUILT_IN_STYLINGS } from '../template/structures';
import type {
  NodeStructureRegistry,
  NodeStylingRegistry,
  NodeTypeBinding,
  NodeTypeRegistry,
} from '../template/types';

/** Fallback palette (default theme, light) used before any theme is published,
 * so role-based node templates always resolve to concrete numbers. */
const { categorical: _fallbackCategorical, ...FALLBACK_PALETTE } = DEFAULT_THEME.light;

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
   * Vector-SVG projection of this layer's nodes + edges — delegates to the
   * internal `PrimitivesRenderer.toSVG()`. Consumed by `Canvas.exportSVG`
   * (duck-typed via the engine's `SvgExportableLayer` contract). Returns `''`
   * before mount. Coverage caveats (raster-only fills, non-label decorations,
   * effects) are documented on `PrimitivesRenderer.toSVG`.
   */
  toSVG(): string {
    return this._renderer?.toSVG() ?? '';
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
   * Nodes / edges whose active-state set changed since the last flush — drained
   * once per flush into `rerenderNode` / `rerenderEdge`. Populated from the
   * store's `node:state` / `edge:state` events; the dedup + once-per-flush drain
   * keeps an N-item highlight to ≤1 rebuild per item (mirrors
   * {@link dirtyConnectors}). State itself is owned by the `GraphStore` (presence
   * compartment) — the layer holds none, just reads `store.nodeStatesOf` at
   * render. See `store-owns-state-plan.md` § 0 / § 2.5.
   */
  private readonly dirtyStateNodes: Set<string> = new Set();
  private readonly dirtyStateEdges: Set<string> = new Set();

  /**
   * Currently-mounted decoration slot ids per node / edge, so the resolver
   * can diff (mount new / dispose removed / replace changed) against the
   * previous render's set. Slot ids are synthesized from `spec.id` or
   * `${kind}#<index>`. The `'label'` slot is managed separately by
   * `syncNodeLabel` / `syncEdgeLabel` and never appears in these maps.
   */
  private readonly nodeDecorationSlots: Map<string, Set<string>> = new Map();
  private readonly edgeDecorationSlots: Map<string, Set<string>> = new Map();

  /**
   * Currently-mounted badge slot ids per node, mirroring
   * {@link nodeDecorationSlots} for badge diffing. Slot id falls back to
   * `${badge.placement-name}#<index>` when `NodeBadge.id` is absent so
   * id-less badges stack rather than collapse.
   */
  private readonly nodeBadgeSlots: Map<string, Set<string>> = new Map();

  /** Edge-side counterpart of {@link nodeBadgeSlots}. */
  private readonly edgeBadgeSlots: Map<string, Set<string>> = new Map();

  // ─── v3 G6-aligned layer template ────────────────────────────────────
  // `options.node` and `options.edge` carry layer-level NodeOption /
  // EdgeOption templates (style + state catalogue, resolver-aware).
  private nodeOption: NodeOption | undefined;
  private edgeOption: EdgeOption | undefined;

  // ─── Per-type structure / styling templates (built-ins ∪ consumer) ────
  private nodeStructures: NodeStructureRegistry;
  private nodeStylings: NodeStylingRegistry;
  private nodeTypes: NodeTypeRegistry | undefined;
  /** Current resolved palette (role → number), used to resolve per-type
   * templates. Seeded from the default theme until a theme is published. */
  private themePalette: RolePalette = FALLBACK_PALETTE;

  /** Initial data from `options.initData`, applied once in `onMount`. */
  private readonly initialData: GraphData | undefined;

  constructor(opts: LayerOptions<GraphLayerOptions>) {
    super(opts);
    this.initialData = opts.options.initData;
    // Stamp the store's telemetry source id with the layer id so multiple
    // graphs are distinguishable on the tap channel (§ 6).
    this.store = opts.options.store ?? new GraphStore({ id: this.id });
    // v3 G6-aligned layer template — single source of truth for style /
    // state catalogue. Both fields are resolver-aware via the
    // `ResolvableNodeStyle` / `ResolvableEdgeStyle` shape. The canonical
    // state defaults are auto-merged underneath so a layer that touches
    // no state code still renders distinct hover / select / error / etc.
    // visuals. Opt out with `useDefaultStates: false`.
    const useDefaults = opts.options.useDefaultStates !== false;
    this.nodeOption = mergeNodeOptionWithDefaults(opts.options.node, useDefaults);
    this.edgeOption = mergeEdgeOptionWithDefaults(opts.options.edge, useDefaults);

    // Per-type templates: built-ins first, consumer overrides on top.
    this.nodeStructures = { ...BUILT_IN_STRUCTURES, ...opts.options.nodeStructureTemplates };
    this.nodeStylings = { ...BUILT_IN_STYLINGS, ...opts.options.nodeStylingTemplates };
    this.nodeTypes = opts.options.nodeTypes;
  }

  protected createState(): GraphLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    // Route the store's events onto the canvas tap channel so telemetry sees
    // every data + interaction-state mutation (§ 6). Detached in onUnmount.
    this.store.bindBus(ctx.events);
    // Register the store as this source on the kernel (D13, Phase 3.2). The store
    // (which `implements DataSource`) becomes `CanvasStore.data[this.id]`, so the
    // kernel bridges its `onFlush` onto `data:flush` and a single rAF loop can
    // drive it. The layer still owns the reference + renders from its granular
    // events — registration is additive.
    ctx.store.setSource(this.id, this.store);
    this._renderer = new PrimitivesRenderer({
      container: this.container,
      camera: ctx.camera,
      ...(this.options.hitFloorPx !== undefined
        ? { hitFloorPx: this.options.hitFloorPx }
        : {}),
      // Forwarded so the renderer's pointer router can apply
      // `cursor: pointer` on shape / connector hover.
      ...(ctx.canvasElement ? { canvasElement: ctx.canvasElement } : {}),
    });

    // Initial sync — render anything the store already has. Document `states`
    // fold into the resolved style via `store.nodeStatesOf` at render time, so
    // there's no separate state-mirror step.
    for (const node of this.store.nodes()) {
      this.installNodeShape(node);
      if (this.isGroupNode(node)) this.dirtyGroups.add(node.id);
    }
    for (const edge of this.store.edges()) {
      this.installEdgeConnector(edge);
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
        // Document states (`node.states`) are folded in by `resolveNodeStyle`
        // via `store.nodeStatesOf` at render — no mirror step needed.
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
        // `updateNodeShape` re-resolves the style (incl. document `states` via
        // `store.nodeStatesOf`), so a `states` patch repaints with no mirror.
        this.updateNodeShape(node, patch);
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
        this.dirtyStateNodes.delete(nodeId);
        this.nodeDecorationSlots.delete(nodeId);
        this.nodeBadgeSlots.delete(nodeId);
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
      }),
      s.on('edge:update', ({ edgeId, patch }) => {
        const edge = this.store.getEdge(edgeId);
        if (!edge) return;
        this.updateEdgeConnector(edge, patch);
      }),
      s.on('edge:remove', ({ edgeId }) => {
        this.dirtyStateEdges.delete(edgeId);
        this.edgeDecorationSlots.delete(edgeId);
        this.edgeBadgeSlots.delete(edgeId);
        this._renderer?.removeConnector(edgeId);
      }),
      // Runtime (presence) state toggles — mark dirty; the flush handler drains
      // them once each (dedup), keeping an N-item highlight to one paint (§2.5).
      s.on('node:state', ({ nodeId }) => {
        this.dirtyStateNodes.add(nodeId);
      }),
      s.on('edge:state', ({ edgeId }) => {
        this.dirtyStateEdges.add(edgeId);
      }),
      // Explicit per-element visibility. Re-render the node (its spec now
      // carries `visible: false`) and cascade to every incident edge, whose
      // *effective* visibility follows this endpoint (derived — the store fires
      // no per-edge event). Both drain once via the `flush` handler below.
      s.on('node:visibility', ({ nodeId }) => {
        this.dirtyStateNodes.add(nodeId);
        for (const edge of this.store.edgesOf(nodeId, 'both')) {
          this.dirtyStateEdges.add(edge.id);
        }
      }),
      s.on('edge:visibility', ({ edgeId }) => {
        this.dirtyStateEdges.add(edgeId);
      }),
      s.on('flush', (counters) => {
        // Groups first — their frames may grow / shrink based on freshly-
        // mutated child positions, which in turn shifts the anchor points
        // every incident connector sees on the next route.
        this.drainDirtyGroups();
        // Then state-driven re-renders (selected/highlighted/… overlays, which
        // may change node size) — drained once per dirty id before connectors
        // reroute, so anchors see the updated geometry.
        if (this.dirtyStateNodes.size > 0) {
          for (const nodeId of this.dirtyStateNodes) this.rerenderNode(nodeId);
          this.dirtyStateNodes.clear();
        }
        if (this.dirtyStateEdges.size > 0) {
          for (const edgeId of this.dirtyStateEdges) this.rerenderEdge(edgeId);
          this.dirtyStateEdges.clear();
        }
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

    // Recolour from the active theme. The `ThemeBehaviour` is the sole
    // publisher; we re-resolve the base node/edge defaults + group frames from
    // its palette so the whole graph stays in sync on every theme switch.
    this.subs.push(ctx.events.on('theme:change', (theme) => this.applyTheme(theme.palette)));
    // Adopt any theme already published before this layer mounted.
    const currentTheme = ctx.theme.current();
    if (currentTheme) this.applyTheme(currentTheme.palette);

    // Load initial data now that the renderer + subscriptions are live — this
    // fires `data:changed`, which auto-triggers the active layout.
    if (this.initialData) this.setData(this.initialData);
  }

  /**
   * Apply a resolved theme palette to the layer's base look: node label +
   * border, edge stroke + arrowheads + labels, and group-frame fills. Only
   * roles present in the palette are written, so the single-layer shorthand's
   * empty palette is a no-op. Per-type styling templates (Phase B) layer their
   * role-based styling on top of this base.
   */
  private applyTheme(palette: Readonly<Record<string, number>>): void {
    // Keep a complete palette (published over the default fallback) so per-type
    // templates always resolve every role to a number, even from a partial /
    // empty (shorthand) publish. Set before any re-render reads it.
    this.themePalette = { ...FALLBACK_PALETTE, ...palette };

    const nodePatch = paletteToNodeDefaults(palette);
    if (hasAny(nodePatch)) this.setNodeDefaults(nodePatch);
    const edgePatch = paletteToEdgeDefaults(palette);
    if (hasAny(edgePatch)) this.setEdgeDefaults(edgePatch);

    const groupPatch = paletteToGroupStyle(palette);
    if (hasAny(groupPatch)) {
      for (const node of this.store.nodes()) {
        if (!this.isGroupNode(node)) continue;
        const prevStyle = (node.style ?? {}) as NodeStyle;
        this.store.updateNode(node.id, { style: { ...prevStyle, ...groupPatch } });
      }
    }

    // Per-type templates resolve roles → numbers, so a theme switch must
    // recompile them. `setNodeDefaults` above already re-rendered when it had a
    // patch; if it didn't (empty palette) but types are configured, redraw.
    if (this.nodeTypes && !hasAny(nodePatch)) this.redraw();
  }

  /**
   * Resolve a per-type binding into a `NodeStyle` fragment. Card structures
   * compile to a `composite` shape; simple structures to shape + label fields.
   * All colour roles are resolved against the current palette here, so nothing
   * role-shaped reaches the renderer. A missing structure yields no fragment.
   */
  private resolveTypeBinding(node: GraphNode, binding: NodeTypeBinding): Partial<NodeStyle> {
    const struct = this.nodeStructures[binding.structure];
    if (!struct) return {};
    // Free-form templates are self-contained (own bindings + colour roles), so
    // they ignore the styling/binding split.
    if (struct.kind === 'freeform') return compileFreeform(struct, node, this.themePalette);
    const styling = this.nodeStylings[binding.styling];
    return struct.kind === 'card'
      ? compileCard(struct, styling, binding.bindings, node, this.themePalette)
      : compileSimple(struct, styling, binding.bindings, node, this.themePalette);
  }

  protected override onUnmount(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.store.bindBus(undefined);
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
    // Pure wipe — delegate to `clear()` so the renderer teardown, store reset,
    // and `data:changed` notification all live in one place.
    if (data.nodes.length === 0 && data.edges.length === 0) {
      this.clear();
      return;
    }
    // Replace: `store.clear()` is a silent fast-wipe — it emits no per-node
    // `node:remove` events, so the renderer (which projects those events into
    // `removeShape` / `removeConnector`) would keep the old shapes painted.
    // Detach them explicitly first; the new data's `node:add` / `edge:add`
    // events then repaint on the batch's flush.
    this.detachAllFromRenderer();
    this.store.batch(() => {
      this.store.clear();
      this.store.addNodesBulk(data.nodes);
      this.store.addEdgesBulk(data.edges);
    });
  }

  /**
   * Serialise this layer's graph data — every node (with its live position,
   * `pinned` flag, style, states and payload) and every edge — to a plain
   * {@link GraphData} object safe to `JSON.stringify`.
   *
   * Implements the engine's structural `DataSerializableLayer` contract, so
   * `Canvas.exportState()` picks this layer's data up automatically. Round-trips
   * through {@link importData}.
   */
  exportData(): GraphData {
    return { nodes: [...this.store.nodes()], edges: [...this.store.edges()] };
  }

  /**
   * Replace this layer's data from a {@link GraphData} snapshot produced by
   * {@link exportData} — the import half of the `DataSerializableLayer`
   * contract. Delegates to {@link setData}, so the renderer teardown/repaint and
   * dependent-layer notifications all run.
   */
  importData(data: GraphData): void {
    this.setData(data);
  }

  /**
   * Contribute this layer's **serialisable config** to a canvas-state snapshot —
   * the layer-level styling template (`node` / `edge`), the card/structure/
   * styling template registries, and a couple of scalar options. Implements the
   * engine's `DefinitionSerializable` contract, so `Canvas.exportState()` picks
   * it up into `definition.layers[id]` even on a declarative canvas whose options
   * were passed to the constructor.
   *
   * Excludes `store` (a live instance) and `initData` (data is captured
   * separately, positions and all). The result is passed through {@link jsonSafe},
   * so **function-valued style resolvers** (e.g. `labelText: (n) => …`) are
   * dropped — they can't serialise. On import, `setOptions` shallow-merges this
   * slice, preserving any live resolver the serialised template omitted.
   */
  serializeDefinition(): Record<string, unknown> | undefined {
    return jsonSafe({
      // Whole-layer visibility so a hidden layer restores hidden. Only emitted
      // when hidden (default is visible) to keep the definition slice lean.
      ...(this.visible === false ? { visible: false } : {}),
      ...(this.nodeOption ? { node: this.nodeOption } : {}),
      ...(this.edgeOption ? { edge: this.edgeOption } : {}),
      ...(this.options.useDefaultStates !== undefined
        ? { useDefaultStates: this.options.useDefaultStates }
        : {}),
      ...(this.options.hitFloorPx !== undefined ? { hitFloorPx: this.options.hitFloorPx } : {}),
      nodeStructureTemplates: this.nodeStructures,
      nodeStylingTemplates: this.nodeStylings,
      nodeTypes: this.nodeTypes,
    });
  }

  /**
   * Remove every node and edge — tearing down their rendered shapes /
   * connectors and notifying full-repaint consumers (e.g. `MiniMapLayer`). The
   * canonical way to empty the graph; prefer it over
   * `setData({ nodes: [], edges: [] })`.
   *
   * Note the difference from the low-level `graph.store.clear()`: that is a
   * silent fast-wipe (no events, drops the pending queues), so on its own it
   * would leave the canvas painted and dependent layers stale. This method
   * keeps the renderer and store in sync and fires a single `data:changed`
   * (which `store.clear()` alone never produces, since `doFlush` skips an empty
   * flush) so consumers update immediately rather than on some later event.
   */
  clear(): void {
    const removedNodes = this.store.nodeCount();
    const removedEdges = this.store.edgeCount();
    this.detachAllFromRenderer();
    this.store.clear();
    this.events.emit('data:changed', {
      addedNodes: 0,
      updatedNodes: 0,
      removedNodes,
      addedEdges: 0,
      updatedEdges: 0,
      removedEdges,
    });
  }

  /**
   * Force a full re-render of every node and edge from current store state +
   * active states. Does **not** mutate data and is **not** undoable — it is a
   * pure render pass. Use it after an external style/theme change that bypassed
   * the store (e.g. swapping the renderer's palette) or to recover from a
   * suspected render desync. For data edits prefer the store mutators, which
   * re-render the affected items automatically.
   */
  override redraw(): void {
    for (const node of this.store.nodes()) this.rerenderNode(node.id);
    for (const edge of this.store.edges()) this.rerenderEdge(edge.id);
  }

  /**
   * Keep hit-testing in step with whole-layer visibility. `WorldLayer` hides the
   * pixi container; graph picking runs through the renderer's own pointer router
   * (not `layer.hitTest`), so a hidden layer would otherwise stay clickable. Gate
   * the renderer's `hitTest` so a hidden layer's nodes/edges are non-interactive
   * too (decision 11 of the visibility plan).
   */
  protected override onVisibleChange(value: boolean): void {
    super.onVisibleChange(value);
    this._renderer?.setHitTestEnabled(value);
  }

  /**
   * Drop every shape / connector this layer has mounted on the renderer and
   * reset transient routing state. Shared by `clear` / `setData`: `store.clear()`
   * is silent, so it never drives the renderer's event-based removal path —
   * the layer must detach explicitly.
   */
  private detachAllFromRenderer(): void {
    const renderer = this._renderer;
    if (!renderer) return;
    for (const node of this.store.nodes()) renderer.removeShape(node.id);
    for (const edge of this.store.edges()) renderer.removeConnector(edge.id);
    this.dirtyConnectors.clear();
  }

  // ─── Layer-level template (defaults) ──────────────────────────────────────

  /**
   * Patch the layer-level node template (`options.node.style`) and re-render
   * every node so the change takes effect immediately. Use this for global
   * "apply to all nodes" changes (e.g. a toolbar default-fill picker) instead
   * of looping `store.updateNode` per node.
   *
   * Merge is shallow (top-level): structured fields (`shape`, `decorations`,
   * `badges`, `effects`) are replaced wholesale — spread the prior value if you
   * mean to patch a single sub-field. Per-node `style`, active states, and
   * resolver functions still win over the template at resolve time (see
   * {@link resolveNodeStyle}). No-op visually if the layer isn't mounted yet,
   * but the template is still updated so later mounts pick it up.
   */
  setNodeDefaults(patch: Partial<NodeStyle>): void {
    this.nodeOption = {
      ...this.nodeOption,
      style: {
        ...(this.nodeOption?.style ?? {}),
        ...patch,
      } as ResolvableNodeStyle<GraphNode>,
    };
    for (const node of this.store.nodes()) this.rerenderNode(node.id);
    // Notify mirrors (minimap, etc.) at the *setter* level so direct calls,
    // `applyOptions` patches, and behaviours that write the template all fire.
    this.events.emit('style:changed', { scope: 'node' });
  }

  /**
   * Sibling of {@link setNodeDefaults} for the edge template
   * (`options.edge.style`). Patches the shared edge styling and re-renders
   * every edge. Same shallow-merge contract — e.g. changing edge "type" means
   * `setEdgeDefaults({ shape: { ...prevShape, pathType: 'bezier' } })`.
   */
  setEdgeDefaults(patch: Partial<EdgeStyle>): void {
    this.edgeOption = {
      ...this.edgeOption,
      style: {
        ...(this.edgeOption?.style ?? {}),
        ...patch,
      } as ResolvableEdgeStyle<GraphEdge>,
    };
    for (const edge of this.store.edges()) this.rerenderEdge(edge.id);
    this.events.emit('style:changed', { scope: 'edge' });
  }

  /**
   * Patch the layer-level state *catalogues* (`options.node.state` /
   * `options.edge.state`) — the named overlays applied while a state is active
   * (`hover`, `selected`, …). Entries are merged by name (shallow, per the
   * `setNodeDefaults` contract: declare a full `NodeStyle` / `EdgeStyle` to
   * replace an entry; spread the prior value to patch one field). Re-renders
   * every node/edge so active states pick up the new appearance immediately.
   *
   * This is the runtime counterpart to the construction-time
   * `DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES` merge — there was no setter
   * for state overlays before. Used by `GraphCanvas.update()` to live-patch
   * the state catalogue (e.g. theme the `selected` ring colour).
   */
  setStateConfigs(patch: {
    node?: Record<string, NodeStyle>;
    edge?: Record<string, EdgeStyle>;
  }): void {
    if (patch.node) {
      this.nodeOption = {
        ...this.nodeOption,
        state: { ...(this.nodeOption?.state ?? {}), ...patch.node },
      };
    }
    if (patch.edge) {
      this.edgeOption = {
        ...this.edgeOption,
        state: { ...(this.edgeOption?.state ?? {}), ...patch.edge },
      };
    }
    this.redraw();
    this.events.emit('style:changed', { scope: 'state' });
  }

  /**
   * Live-update entry point. Dispatches a `GraphLayerOptions` slice to the
   * concrete setters: `node.style` → {@link setNodeDefaults}, `edge.style` →
   * {@link setEdgeDefaults}, `node.state` / `edge.state` →
   * {@link setStateConfigs}. Called by `GraphCanvas.update()` per id.
   */
  setOptions(patch: Partial<GraphLayerOptions>): void {
    if (patch.node?.style) this.setNodeDefaults(patch.node.style as Partial<NodeStyle>);
    if (patch.edge?.style) this.setEdgeDefaults(patch.edge.style as Partial<EdgeStyle>);
    if (patch.node?.state || patch.edge?.state) {
      this.setStateConfigs({
        node: patch.node?.state as Record<string, NodeStyle> | undefined,
        edge: patch.edge?.state as Record<string, EdgeStyle> | undefined,
      });
    }

    // Per-type structure / styling templates + bindings — merge and re-render.
    let templatesChanged = false;
    if (patch.nodeStructureTemplates) {
      this.nodeStructures = { ...this.nodeStructures, ...patch.nodeStructureTemplates };
      templatesChanged = true;
    }
    if (patch.nodeStylingTemplates) {
      this.nodeStylings = { ...this.nodeStylings, ...patch.nodeStylingTemplates };
      templatesChanged = true;
    }
    if (patch.nodeTypes) {
      this.nodeTypes = { ...this.nodeTypes, ...patch.nodeTypes };
      templatesChanged = true;
    }
    if (templatesChanged && this.mounted) this.redraw();
  }

  /** Read-only snapshot of the current node template style (resolved per node at render). */
  get nodeDefaults(): ResolvableNodeStyle<GraphNode> | undefined {
    return this.nodeOption?.style;
  }

  /** Read-only snapshot of the current edge template style. */
  get edgeDefaults(): ResolvableEdgeStyle<GraphEdge> | undefined {
    return this.edgeOption?.style;
  }

  // ─── State sugar ──────────────────────────────────────────────────────────
  //
  // Interaction state is owned by the `GraphStore` (presence compartment) — set
  // it via `layer.store.addNodeState` / `removeNodeState` / `clearNodeState`
  // (+ edge variants). The layer only adds graph-domain *sugar* that composes
  // several store writes; the layer itself holds no state.

  /**
   * Highlight a node together with its neighbours (in `dir`) and incident edges
   * — adds the runtime state `state` to all of them in a single
   * {@link GraphStore.batch}, so the whole neighbourhood repaints in one flush.
   * No-op if the seed id is unknown. Clear with `store.clearNodeState(state)` +
   * `store.clearEdgeState(state)`.
   *
   * @param id    Seed node id.
   * @param dir   Adjacency direction for neighbours + incident edges. Default `'both'`.
   * @param state Runtime state name to apply. Default `'highlighted'`.
   */
  highlightNeighbourhood(
    id: string,
    dir: EdgeDirection = 'both',
    state = 'highlighted',
  ): void {
    if (!this.store.hasNode(id)) return;
    this.store.batch(() => {
      this.store.addNodeState(id, state);
      for (const nb of this.store.neighborsOf(id, dir)) this.store.addNodeState(nb, state);
      for (const e of this.store.edgesOf(id, dir)) this.store.addEdgeState(e.id, state);
    });
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
    // Per-type template (structure + styling + bindings) sits above the layer
    // template and below per-node style: a node of a bound `type` gets its
    // card/simple skeleton + role-resolved colours, still overridable per node.
    if (this.nodeTypes && node.type) {
      const binding = this.nodeTypes[node.type];
      if (binding) Object.assign(merged, this.resolveTypeBinding(node, binding));
    }
    Object.assign(merged, (node.style as Partial<NodeStyle> | undefined) ?? {});

    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
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

    // Apply the unified `style.size` override. Done here (not in `nodeSpec`)
    // so every consumer of the resolved style — `boundsOfNode`, D3's
    // collide.radius callback (which reads `style.shape.radius` directly off
    // a `resolveNodeStyle` result), and ELK's bounds query — observes the
    // same normalized geometry. Skips shape kinds with no canonical size axis
    // (polygon, custom) and is a no-op when `size` is undefined.
    if (merged.size !== undefined) {
      // Synthesize a default circle shape when `size` is set but no `shape`
      // was contributed by template / per-node / state overlays — keeps the
      // contract "setting `size` resizes the node" honest in the no-shape
      // case (which still flows through `nodeSpec`'s default circle).
      const baseShape: NodeShapeOptions =
        merged.shape ?? ({ kind: 'circle', radius: 0 } as NodeShapeOptions);
      const normalized = normalizeShapeSize(baseShape, merged.size);
      if (normalized !== baseShape || merged.shape === undefined) {
        (merged as { shape?: NodeShapeOptions }).shape = normalized;
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

    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
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

  /**
   * World-space AABB of everything currently **visible** on this layer — the
   * "fit to content" rect. Overrides {@link WorldLayer.getBounds} to exclude
   * effectively-hidden elements deterministically (explicitly-hidden nodes/edges
   * and collapsed-group descendants), rather than depending on the renderer's
   * scene-graph bounds semantics for `visible: false` display objects.
   *
   * @param opts `includeHidden: true` unions hidden elements back in (default
   *   `false`). Falls back to the base scene-graph bounds before the renderer
   *   mounts or when nothing visible is aggregated.
   */
  override getBounds(opts?: { includeHidden?: boolean }): Rect {
    const includeHidden = opts?.includeHidden ?? false;
    const renderer = this._renderer;
    if (!renderer) return super.getBounds();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    const union = (r: Rect | null): void => {
      if (!r) return;
      any = true;
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    };

    for (const node of this.store.nodes()) {
      if (!includeHidden && node.hidden === true) continue;
      if (!includeHidden && this.collapsedAncestor(node.id) !== undefined) continue;
      union(renderer.getShapeWorldBounds(node.id));
    }
    for (const edge of this.store.edges()) {
      if (!includeHidden && !this.store.isEdgeVisible(edge.id)) continue;
      const poly = renderer.getConnectorPolyline(edge.id);
      if (!poly || poly.length === 0) continue;
      for (const p of poly) union({ x: p.x, y: p.y, width: 0, height: 0 });
    }

    if (!any) return super.getBounds();
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // ─── Visibility (hide / show) ─────────────────────────────────────────────
  //
  // Convenience wrappers over the store so callers that already hold the layer
  // (they call `focusNode` / `focusEdges`) don't reach into the store. The store
  // owns the effective-visibility rule + events; the renderer culls hidden
  // elements via the `visible` flag in `nodeSpec` / `edgeSpec`, and the
  // node-hide path cascades to incident edges through the store's
  // `node:visibility` handler above.

  /** Hide a node (culls it + its incident edges). Delegates to the store. */
  hideNode(id: string): void {
    this.store.hideNode(id);
  }

  /** Show a previously-hidden node. Delegates to the store. */
  showNode(id: string): void {
    this.store.showNode(id);
  }

  /** Flip a node's hidden flag. Returns the resulting hidden state. */
  toggleNodeHidden(id: string): boolean {
    return this.store.toggleNodeHidden(id);
  }

  /** True iff the node is explicitly hidden. */
  isNodeHidden(id: string): boolean {
    return this.store.isNodeHidden(id);
  }

  /** Effective visibility of a node (live and not explicitly hidden). */
  isNodeVisible(id: string): boolean {
    return this.store.isNodeVisible(id);
  }

  /** Hide many nodes in one batch → one paint. */
  hideNodes(ids: Iterable<string>): void {
    this.store.hideNodes(ids);
  }

  /** Show many nodes in one batch → one paint. */
  showNodes(ids: Iterable<string>): void {
    this.store.showNodes(ids);
  }

  /** Hide an edge. Delegates to the store. */
  hideEdge(id: string): void {
    this.store.hideEdge(id);
  }

  /** Show a previously-hidden edge. Delegates to the store. */
  showEdge(id: string): void {
    this.store.showEdge(id);
  }

  /** Flip an edge's hidden flag. Returns the resulting hidden state. */
  toggleEdgeHidden(id: string): boolean {
    return this.store.toggleEdgeHidden(id);
  }

  /** True iff the edge's explicit hidden flag is set. */
  isEdgeHidden(id: string): boolean {
    return this.store.isEdgeHidden(id);
  }

  /** Effective visibility of an edge (not hidden and both endpoints visible). */
  isEdgeVisible(id: string): boolean {
    return this.store.isEdgeVisible(id);
  }

  /** Hide many edges in one batch → one paint. */
  hideEdges(ids: Iterable<string>): void {
    this.store.hideEdges(ids);
  }

  /** Show many edges in one batch → one paint. */
  showEdges(ids: Iterable<string>): void {
    this.store.showEdges(ids);
  }

  /** Clear every explicit hidden flag (nodes + edges). */
  showAllHidden(): void {
    this.store.showAllHidden();
  }

  // ─── Viewport framing ─────────────────────────────────────────────────────

  /**
   * Centre the camera on a set of nodes — pan so the midpoint of their
   * positions sits at the viewport centre, **without changing zoom**. Unknown
   * ids are skipped; a no-op when none resolve or the layer isn't mounted.
   *
   * Graph-domain sugar over the geometry-only {@link Camera.centerOn}: it
   * resolves ids → positions so callers (e.g. a "focus on node" context-menu
   * action) don't have to. Focus locates a target; zooming stays a separate,
   * explicit gesture (wheel / pinch / fit-to-content).
   *
   * @param ids  Node ids to centre on.
   * @param opts `includeHidden: true` also considers explicitly-hidden nodes
   *   (default `false` — hidden nodes are skipped so framing tracks what's
   *   visible).
   */
  focusNodes(ids: Iterable<string>, opts?: { includeHidden?: boolean }): void {
    const includeHidden = opts?.includeHidden ?? false;
    const pts: Array<{ x: number; y: number }> = [];
    for (const id of ids) {
      if (!includeHidden && this.store.isNodeHidden(id)) continue;
      const pos = this.store.getPosition(id);
      if (pos) pts.push(pos);
    }
    this.centerOnPoints(pts);
  }

  /**
   * Centre the camera on a single node, optionally zooming in. Sugar over
   * {@link focusNodes} for the common "focus on this node" action.
   *
   * Camera-only: it moves the view, nothing else. Selecting / highlighting the
   * node is a separate, opt-in concern (a `ClickSelectBehaviour`) the caller
   * composes — focus stays orthogonal to selection.
   *
   * @param id        Node id to centre on.
   * @param opts.zoom Minimum zoom: the camera zooms *in* to at least this
   *   scale, but never zooms out (a no-op if already closer). Omit for a pure
   *   pan at the current zoom.
   */
  focusNode(id: string, opts?: { zoom?: number; includeHidden?: boolean }): void {
    this.focusNodes([id], { includeHidden: opts?.includeHidden ?? false });
    const camera = this.ctx?.camera;
    if (camera && opts?.zoom !== undefined) {
      camera.setZoom(Math.max(camera.scale, opts.zoom));
    }
  }

  /**
   * Centre the camera on a set of edges — pan so the midpoint of their
   * endpoints sits at the viewport centre, **without changing zoom**. Unknown
   * ids (or edges with an unplaced endpoint) are skipped; a no-op when none
   * resolve or the layer isn't mounted.
   *
   * @param ids  Edge ids to centre on.
   * @param opts `includeHidden: true` also considers effectively-hidden edges
   *   (default `false` — hidden edges, including those hidden because an
   *   endpoint is, are skipped).
   */
  focusEdges(ids: Iterable<string>, opts?: { includeHidden?: boolean }): void {
    const includeHidden = opts?.includeHidden ?? false;
    const pts: Array<{ x: number; y: number }> = [];
    for (const id of ids) {
      const edge = this.store.getEdge(id);
      if (!edge) continue;
      if (!includeHidden && !this.store.isEdgeVisible(id)) continue;
      const a = this.store.getPosition(edge.source);
      const b = this.store.getPosition(edge.target);
      if (a) pts.push(a);
      if (b) pts.push(b);
    }
    this.centerOnPoints(pts);
  }

  /** Pan the camera to the centre of the AABB spanning `pts`. No-op if empty / unmounted. */
  private centerOnPoints(pts: ReadonlyArray<{ x: number; y: number }>): void {
    const camera = this.ctx?.camera;
    if (!camera || pts.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    camera.centerOn((minX + maxX) / 2, (minY + maxY) / 2);
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

    // Visibility — a node is culled when any ancestor is a collapsed group, or
    // when it is explicitly hidden (first-class per-element visibility). We
    // still emit a spec (so decorations / size are valid for any incident edge
    // re-route math against the node), but with `visible: false` so the
    // renderer skips drawing AND hit-testing it.
    const hiddenByGroup = this.collapsedAncestor(node.id) !== undefined;
    const culled = hiddenByGroup || node.hidden === true;

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

    // Map the canonical `node.position` to the shape's render origin. The
    // `composite` shape draws from its top-left corner (unlike `circle`,
    // centred at (x,y)), so it's shifted by -size/2 to sit centred on `pos`.
    // MUST match the fast-path in `updateNodeShape`, or a position-only update
    // (layout / drag) would place the card differently than a full rebuild
    // (add / hover), making it visibly jump. See {@link shapeRenderXY}.
    const { x, y } = shapeRenderXY(shape, pos);

    return {
      ...(shape as unknown as Record<string, unknown>),
      x,
      y,
      // Always emit `alpha` (default opaque) — same partial-merge reasoning as
      // `visible` below. A transient state (e.g. `dimmed`, `bgAlpha: 0.25`) sets
      // it; when that state clears and the base style doesn't pin `bgAlpha`,
      // omitting the field here would leave the dimmed alpha stuck on the cached
      // spec. Emitting `1` restores opacity on state removal.
      alpha: style.bgAlpha ?? 1,
      ...(fill !== undefined ? { fill } : {}),
      ...(stroke ? { stroke } : {}),
      ...(zIndex !== undefined ? { zIndex } : {}),
      // Always emit `visible` — the renderer partial-merges patches onto
      // the cached spec, so omitting the field on the "now visible" pass
      // after a collapse → expand (or show) transition would leave the previous
      // `visible: false` in place and the node would stay hidden.
      visible: !culled,
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

    // First-class visibility: an edge is culled when it is a collapse self-loop
    // OR effectively hidden — explicitly hidden, or either endpoint is hidden
    // (the store owns the rule; `isEdgeVisible` derives it). Emitting
    // `visible: false` keeps it out of both drawing and hit-testing.
    const edgeVisible = !isCollapseSelfLoop && this.store.isEdgeVisible(edge.id);

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
      visible: edgeVisible,
      // Always emit the marker keys (as `undefined` when off), never omit them.
      // `updateConnector` shallow-merges the spec, so an omitted key would keep a
      // previously-drawn marker — e.g. an edge that first renders with the default
      // `'triangle'` then re-renders with `'none'` (config/layout applied after the
      // first paint, as in the sankey story) would otherwise keep its arrowhead.
      targetMarker:
        arrowTargetShape !== 'none' ? { kind: 'arrow', fill: arrowTargetColor } : undefined,
      sourceMarker:
        style.arrowSourceShape && style.arrowSourceShape !== 'none'
          ? { kind: 'arrow', fill: style.arrowSourceColor ?? strokeColor }
          : undefined,
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
      // `removeShape` disposes every mounted decoration AND badge on the
      // host. Drop our tracking so the next sync treats it as a full mount
      // instead of diffing against ghost slots.
      this.nodeDecorationSlots.delete(id);
      this.nodeBadgeSlots.delete(id);
      this._renderer.addShape(id, spec);
    }
    // `syncNodeLabel` / `syncNodeDecorations` / `syncNodeBadges` are
    // idempotent — `setDecoration` / `setBadge` replace a slot whether or
    // not one was already there. Cheap to call in both branches.
    this.syncNodeLabel(id);
    this.syncNodeDecorations(id);
    this.syncNodeBadges(id);
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
    this.syncEdgeBadges(id);
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
    this.syncNodeBadges(node.id);
    this.syncGroupSyntheticDecorations(node.id);
  }

  private installEdgeConnector(edge: GraphEdge): void {
    if (!this._renderer) return;
    this._renderer.addConnector(edge.id, this.edgeSpec(edge));
    this.syncEdgeLabel(edge.id);
    this.syncEdgeDecorations(edge.id);
    this.syncEdgeBadges(edge.id);
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

    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
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

    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
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

  /**
   * Resolve the final list of badges for a node by concatenating every
   * contributing layer (layer template + per-node base + each active state
   * overlay) and deduping by `id`. Later precedence wins. Entries without an
   * explicit `id` fall back to `badge#<combined-index>` so id-less badges
   * stack rather than collapsing.
   */
  private resolveNodeBadges(node: GraphNode): Map<string, NodeBadge> {
    const collected: NodeBadge[] = [];

    const pushFrom = (style: Partial<NodeStyle> | undefined): void => {
      const badges = style?.badges;
      if (badges && badges.length > 0) collected.push(...badges);
    };

    if (this.nodeOption?.style) {
      pushFrom(resolveNodeStyleFields(this.nodeOption.style, node));
    }
    pushFrom(node.style as Partial<NodeStyle> | undefined);

    const activeStates = this.store.nodeStatesOf(node.id);
    if (activeStates.length > 0) {
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

    const out = new Map<string, NodeBadge>();
    for (let i = 0; i < collected.length; i++) {
      const badge = collected[i]!;
      const slotId = badge.id ?? `badge#${i}`;
      out.set(slotId, badge);
    }
    return out;
  }

  /**
   * Project the resolved badge map onto the canvas renderer for the given
   * node. Diffs against the previous render's slot set tracked in
   * {@link nodeBadgeSlots}: mounts new ids, removes vanished ones, replaces
   * specs whose slot id appears in both.
   */
  private syncNodeBadges(id: string): void {
    if (!this._renderer) return;
    const node = this.store.getNode(id);
    if (!node) return;
    const next = this.resolveNodeBadges(node);
    const prev = this.nodeBadgeSlots.get(id);

    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.removeBadge(id, slotId);
      }
    }
    for (const [slotId, badge] of next) {
      this._renderer.setBadge(id, slotId, nodeBadgeToCanvasOptions(badge));
    }

    if (next.size === 0) this.nodeBadgeSlots.delete(id);
    else this.nodeBadgeSlots.set(id, new Set(next.keys()));
  }

  /** Sibling of {@link resolveNodeBadges} for edges. */
  private resolveEdgeBadges(edge: GraphEdge): Map<string, EdgeBadge> {
    const collected: EdgeBadge[] = [];

    const pushFrom = (style: Partial<EdgeStyle> | undefined): void => {
      const badges = style?.badges;
      if (badges && badges.length > 0) collected.push(...badges);
    };

    if (this.edgeOption?.style) {
      pushFrom(resolveEdgeStyleFields(this.edgeOption.style, edge));
    }
    pushFrom(edge.style as Partial<EdgeStyle> | undefined);

    const activeStates = this.store.edgeStatesOf(edge.id);
    if (activeStates.length > 0) {
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

    const out = new Map<string, EdgeBadge>();
    for (let i = 0; i < collected.length; i++) {
      const badge = collected[i]!;
      const slotId = badge.id ?? `badge#${i}`;
      out.set(slotId, badge);
    }
    return out;
  }

  /** Sibling of {@link syncNodeBadges} for edges. */
  private syncEdgeBadges(id: string): void {
    if (!this._renderer) return;
    const edge = this.store.getEdge(id);
    if (!edge) return;
    const next = this.resolveEdgeBadges(edge);
    const prev = this.edgeBadgeSlots.get(id);

    if (prev) {
      for (const slotId of prev) {
        if (!next.has(slotId)) this._renderer.removeBadge(id, slotId);
      }
    }
    for (const [slotId, badge] of next) {
      this._renderer.setBadge(id, slotId, edgeBadgeToCanvasOptions(badge));
    }

    if (next.size === 0) this.edgeBadgeSlots.delete(id);
    else this.edgeBadgeSlots.set(id, new Set(next.keys()));
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
    // need re-routing too; queue them for the flush-time drain. Run the
    // position through `shapeRenderXY` so the render origin matches the full
    // `nodeSpec` rebuild — otherwise a `composite` card lands at its raw
    // top-left here but centred on a rebuild, so it jumps on hover / restyle.
    if ('position' in patch && patch.position && patchKeys.length === 1) {
      const shape = (this.resolveNodeStyle(node).shape ?? { kind: 'circle', radius: 10 }) as NodeShapeOptions;
      const { x, y } = shapeRenderXY(shape, patch.position);
      // Transform-only fast path: moves the node body AND its label / decoration
      // children in one `gfx.position.set`, skipping the geometry redraw and
      // decoration re-anchor `updateShape` would do (profiled as ~90% of the
      // per-tick cost during a force settle). Hit-bounds reindex lazily.
      this._renderer.moveShape(node.id, x, y);
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
      // `removeShape` disposes attached decorations + badges — drop our tracking.
      this.nodeDecorationSlots.delete(node.id);
      this.nodeBadgeSlots.delete(node.id);
      this._renderer.addShape(node.id, spec);
    }
    this.syncNodeLabel(node.id);
    this.syncNodeDecorations(node.id);
    this.syncNodeBadges(node.id);
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
 * Map a node's canonical `position` to the render origin its shape expects.
 *
 * Most shapes (`circle`, `regular-polygon`, …) are centred at `(x, y)`, so the
 * position passes through unchanged. The `composite` shape draws from its
 * top-left corner, so it's shifted by `-size/2` to sit centred on `position` —
 * matching how layouts (and edge anchoring / obstacle bounds) treat the
 * position as the node centre.
 *
 * Both the full {@link GraphLayer.nodeSpec} rebuild and the position-only fast
 * path in `updateNodeShape` route through this, so a `composite` card lands at
 * the same place whether it's added, dragged, re-laid-out, or re-rendered on
 * hover — otherwise it visibly jumps between the two paths.
 */
function shapeRenderXY(
  shape: NodeShapeOptions,
  pos: { x: number; y: number },
): { x: number; y: number } {
  const sc = shape as { kind?: string; width?: number; height?: number };
  if (sc.kind === 'composite' && typeof sc.width === 'number' && typeof sc.height === 'number') {
    return { x: pos.x - sc.width / 2, y: pos.y - sc.height / 2 };
  }
  return { x: pos.x, y: pos.y };
}

/**
 * Rewrite a {@link NodeShapeOptions} so its intrinsic size fields express
 * the unified `style.size` value. Returns the *same* reference for shape
 * kinds with no canonical size axis (`polygon`, custom) — callers can use
 * `===` to short-circuit a write.
 *
 * Per-kind mapping (see {@link NodeStyle.size} TSDoc):
 *
 *   circle / regular-polygon   → radius = size
 *   rect                       → width = height = 2 * size
 *   arc                        → outerR = size, innerR scaled proportionally
 *   star                       → outerRadius = size, innerRadius scaled
 *   polygon / custom           → passthrough (no normalized size axis)
 */
function normalizeShapeSize(shape: NodeShapeOptions, size: number): NodeShapeOptions {
  // CustomShapeOption widens `kind` to `string & {}`, which intersects the
  // built-in literal kinds in TS's type system — so a plain `switch` on
  // `shape.kind` doesn't narrow the spread away from the custom branch.
  // We dispatch via the literal kind explicitly and re-assert the specific
  // shape type per branch.
  switch (shape.kind) {
    case 'circle':
      return { ...(shape as CircleShapeOption), radius: size };
    case 'regular-polygon':
      return { ...(shape as RegularPolygonShapeOption), radius: size };
    case 'rect': {
      const side = size * 2;
      return { ...(shape as RectShapeOption), width: side, height: side };
    }
    case 'arc': {
      const arc = shape as ArcShapeOption;
      const ratio = arc.outerR > 0 ? arc.innerR / arc.outerR : 0;
      return { ...arc, outerR: size, innerR: size * ratio };
    }
    case 'star': {
      const star = shape as StarShapeOption;
      const ratio = star.outerRadius > 0 ? star.innerRadius / star.outerRadius : 0;
      return { ...star, outerRadius: size, innerRadius: size * ratio };
    }
    default:
      // `polygon` carries its own vertex array; `custom` is opaque. Neither
      // has a uniform size axis we can rewrite without ambiguity, so we
      // leave them alone and signal "no-op" via referential equality.
      return shape;
  }
}

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
 * Translate a graph-level {@link NodeBadge} into the canvas-level
 * {@link BadgeOptions} `setBadge` expects.
 *
 * Sugar fields collapse onto the structured shape spec:
 * - `fill` → first `solid` fill layer; `icon` → second fill layer stacked
 *   on top (mirrors the node-body fill stack in `nodeSpec`).
 * - `strokeColor` + `strokeWidth` → `stroke` on the shape spec.
 * - `labelText` (+ colour / size) → a `'label'` decoration on the badge,
 *   centred on the plate.
 *
 * Nested `decorations` are id-keyed (slot id falls back to `${kind}#<i>`);
 * `effects` flatten into a `{ [kind]: { kind, style } }` record. The
 * canvas-level `setBadge` projects both maps internally.
 */
function nodeBadgeToCanvasOptions(badge: NodeBadge): BadgeOptions {
  const fillLayers: ShapeFillLayer[] = [];
  if (badge.fill !== undefined) {
    fillLayers.push({ kind: 'solid', color: badge.fill });
  }
  if (badge.icon !== undefined) {
    fillLayers.push(badge.icon as ShapeFillLayer);
  }

  const strokeWidth = badge.strokeWidth ?? 0;
  const stroke =
    badge.strokeColor !== undefined && strokeWidth > 0
      ? { color: badge.strokeColor, width: strokeWidth }
      : undefined;

  const shape = {
    ...(badge.shape as unknown as Record<string, unknown>),
    ...(fillLayers.length > 0 ? { fill: fillLayers } : {}),
    ...(stroke ? { stroke } : {}),
    ...(badge.alpha !== undefined ? { alpha: badge.alpha } : {}),
    ...(badge.zIndex !== undefined ? { zIndex: badge.zIndex } : {}),
  } as BadgeOptions['shape'];

  const decorations: Record<string, DecorationSpec> = {};
  if (badge.decorations) {
    badge.decorations.forEach((spec, i) => {
      if (spec.remove) return;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      const { kind, style } = splitDecorationSpec(spec);
      decorations[slotId] = { kind, style } as DecorationSpec;
    });
  }
  if (badge.labelText !== undefined) {
    decorations.label = {
      kind: 'label',
      style: {
        content: {
          kind: 'text',
          text: badge.labelText,
          ...(badge.labelColor !== undefined ? { fill: badge.labelColor } : {}),
          ...(badge.labelFontSize !== undefined ? { fontSize: badge.labelFontSize } : {}),
        },
        placement: 'center',
      },
    } as DecorationSpec;
  }

  const effects: Record<string, EffectSpec> = {};
  if (badge.effects) {
    for (const [kind, style] of Object.entries(badge.effects)) {
      if (style === undefined || style === null) continue;
      effects[kind] = { kind, style } as EffectSpec;
    }
  }

  return {
    shape,
    placement: badge.placement,
    ...(badge.origin !== undefined ? { origin: badge.origin } : {}),
    ...(badge.offsetX !== undefined ? { offsetX: badge.offsetX } : {}),
    ...(badge.offsetY !== undefined ? { offsetY: badge.offsetY } : {}),
    ...(Object.keys(decorations).length > 0 ? { decorations } : {}),
    ...(Object.keys(effects).length > 0 ? { effects } : {}),
  };
}

/**
 * Edge-side counterpart of {@link nodeBadgeToCanvasOptions}. Translates a
 * graph-level {@link EdgeBadge} into the canvas-level {@link BadgeOptions}
 * `setBadge` expects, carrying the path-only fields (`pathOffset`,
 * `autoRotate`, `keepUpright`) through verbatim. The sugar-to-canvas
 * collapse is identical to the node-side helper — the only structural
 * difference is the `placement` is an {@link EdgeBadgePlacement}, which
 * `setBadge` dispatches on at runtime when the host is a connector.
 */
function edgeBadgeToCanvasOptions(badge: EdgeBadge): BadgeOptions {
  const fillLayers: ShapeFillLayer[] = [];
  if (badge.fill !== undefined) {
    fillLayers.push({ kind: 'solid', color: badge.fill });
  }
  if (badge.icon !== undefined) {
    fillLayers.push(badge.icon as ShapeFillLayer);
  }

  const strokeWidth = badge.strokeWidth ?? 0;
  const stroke =
    badge.strokeColor !== undefined && strokeWidth > 0
      ? { color: badge.strokeColor, width: strokeWidth }
      : undefined;

  const shape = {
    ...(badge.shape as unknown as Record<string, unknown>),
    ...(fillLayers.length > 0 ? { fill: fillLayers } : {}),
    ...(stroke ? { stroke } : {}),
    ...(badge.alpha !== undefined ? { alpha: badge.alpha } : {}),
    ...(badge.zIndex !== undefined ? { zIndex: badge.zIndex } : {}),
  } as BadgeOptions['shape'];

  const decorations: Record<string, DecorationSpec> = {};
  if (badge.decorations) {
    badge.decorations.forEach((spec, i) => {
      if (spec.remove) return;
      const slotId = spec.id ?? `${spec.kind}#${i}`;
      const { kind, style } = splitDecorationSpec(spec);
      decorations[slotId] = { kind, style } as DecorationSpec;
    });
  }
  if (badge.labelText !== undefined) {
    decorations.label = {
      kind: 'label',
      style: {
        content: {
          kind: 'text',
          text: badge.labelText,
          ...(badge.labelColor !== undefined ? { fill: badge.labelColor } : {}),
          ...(badge.labelFontSize !== undefined ? { fontSize: badge.labelFontSize } : {}),
        },
        placement: 'center',
      },
    } as DecorationSpec;
  }

  const effects: Record<string, EffectSpec> = {};
  if (badge.effects) {
    for (const [kind, style] of Object.entries(badge.effects)) {
      if (style === undefined || style === null) continue;
      effects[kind] = { kind, style } as EffectSpec;
    }
  }

  return {
    shape,
    placement: badge.placement,
    ...(badge.origin !== undefined ? { origin: badge.origin } : {}),
    ...(badge.offsetX !== undefined ? { offsetX: badge.offsetX } : {}),
    ...(badge.offsetY !== undefined ? { offsetY: badge.offsetY } : {}),
    ...(badge.pathOffset !== undefined ? { pathOffset: badge.pathOffset } : {}),
    ...(badge.autoRotate !== undefined ? { autoRotate: badge.autoRotate } : {}),
    ...(badge.keepUpright !== undefined ? { keepUpright: badge.keepUpright } : {}),
    ...(Object.keys(decorations).length > 0 ? { decorations } : {}),
    ...(Object.keys(effects).length > 0 ? { effects } : {}),
  };
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
