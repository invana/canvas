/**
 * `ElkLayout` — [ELK](https://eclipse.dev/elk/) `Layout` for `@invana/graph`.
 *
 * ELK is a *one-shot* layout engine: a single `apply()` call snapshots the
 * graph, dispatches it to the wasm-free JS port (`elkjs`), waits for the
 * Promise to settle, then writes positions back to the store in one bulk
 * call. There is no iterative simulation — the run emits exactly one
 * `tick` event, immediately followed by `end`.
 *
 * ## Off-main-thread solve
 *
 * The ELK solve runs in a **Web Worker** (`elkjs/lib/elk-worker.min.js` via
 * the `elk-api` build), created lazily on the first run and reused for the
 * instance's lifetime. The algorithm is CPU-heavy and super-linear in graph
 * size; running it on the main thread (as `elk.bundled.js`'s synchronous
 * "fake worker" does) blocks paint and input for the whole computation — a
 * multi-second freeze when a one-shot layout re-runs on every streaming
 * update. The worker keeps the UI responsive while ELK works. Override the
 * worker construction via {@link ElkLayoutOptions.workerFactory}; when no
 * `Worker` global exists (Node / SSR / tests) the layout falls back to the
 * synchronous bundle.
 *
 * ## Coordinate convention
 *
 * ELK returns top-left corner coordinates for every node. `@invana/graph`
 * stores **centre** coordinates. The layout converts on write-back using
 * each node's resolved width / height (same numbers it fed to ELK).
 *
 * ## Cancellation
 *
 * `elkjs` does not expose mid-layout cancellation. `stop()` (and a second
 * `apply()` call) instead bump a run token: when the in-flight Promise
 * settles for an obsolete token, its result is dropped on the floor and
 * `end` fires with `reason: 'stopped'`.
 *
 * @example
 * const layout = new ElkLayout({
 *   algorithm: 'layered',
 *   direction: 'RIGHT',
 *   nodeSpacing: 30,
 *   layerSpacing: 80,
 * });
 * layout.events.on('end', () => canvas.camera.fitContent(graphLayer.getBounds(), 80));
 * await layout.apply(graphLayer);
 */

import ELK, {
  type ELK as ElkInstance,
  type ElkExtendedEdge,
  type ElkNode,
  type LayoutOptions,
} from 'elkjs/lib/elk-api.js';
import type { LayoutRunOptions } from '@invana/canvas-core';

import {
  OneShotPositionLayout,
  buildGroupForest,
  collectLayoutEdges,
  collectPlaceableNodes,
  groupInsets,
  groupSizeFloor,
  isMergedEdgeId,
  resolveLayoutRoot,
  resolveNodeSize,
  type EdgePathType,
  type GraphLayer,
  type GraphNode,
  type GroupForestNode,
  type LayoutEdge,
  type LayoutPositions,
  type LayoutRoute,
} from '@invana/graph';

import type {
  ElkLayoutOptions,
  ElkPadding,
  NodeSize,
} from './types';

/** Fallback bounding box when no shape and no override give us a size. */
const FALLBACK_NODE_SIZE: NodeSize = { width: 40, height: 40 };

/**
 * Algorithms that honour `elk.hierarchyHandling: INCLUDE_CHILDREN` — i.e. that
 * lay a compound graph out as one problem, with edges free to cross container
 * boundaries.
 *
 * Only `layered` genuinely does. `force` / `stress` / `radial` / `disco` ignore
 * the property and fall back to laying each container out as its own separate
 * problem — still nested, just solved level by level. Setting the flag for them
 * would change their output without buying the cross-boundary routing it
 * promises, so it's gated rather than global.
 */
const CROSS_HIERARCHY_ALGORITHMS = new Set(['layered']);

/**
 * The path type each `edgeRouting` mode's points are drawn with. `SPLINES`
 * sections are Bézier control points (start, `3k − 1` bends, end), which only
 * `spline` reads as such.
 */
const ROUTE_PATH_TYPE: Record<NonNullable<ElkLayoutOptions['edgeRouting']>, EdgePathType> = {
  ORTHOGONAL: 'orth',
  SPLINES: 'spline',
  POLYLINE: 'straight',
};

/** Prefix of the edges `radialTree` adds to hang a component off the centre. */
const RADIAL_LINK_PREFIX = '__radial:';

export class ElkLayout extends OneShotPositionLayout<ElkLayoutOptions> {
  override readonly kind = 'elk-layout';
  /**
   * Shared ELK instance — `elkjs` is happy to be reused across runs, and we
   * keep one worker alive for the layout's lifetime instead of spinning one up
   * per solve. Created lazily on the first {@link computeLayout} (so a layout
   * that's registered but never run never spawns a worker), and memoised as a
   * Promise because the no-worker fallback needs an async dynamic import.
   */
  private elkInstance?: Promise<ElkInstance>;
  /**
   * Rejects when the worker reports an error — its script did not load (a bad
   * URL, an HTML fallback) or threw. `elk-api` listens for replies only, so a
   * dead worker would leave every solve pending for ever; a run races this.
   */
  private workerFailed?: { readonly promise: Promise<never>; dead: boolean };

  constructor(opts: ElkLayoutOptions = {}) {
    // `ElkLayoutOptions` extends `OneShotLayoutOptions`, so `id` / `targetLayerId`
    // (registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
    // (snap-or-glide, owned by the base) flow straight through to `super`. ELK-only
    // fields are read from `this.opts` (owned by the base, merged on `setOptions`).
    super(opts);
  }

  /**
   * Lazily construct (and memoise) the ELK instance. Prefers the worker-backed
   * `elk-api` build so the solve stays off the main thread; falls back to the
   * synchronous `elk.bundled.js` when no `Worker` global exists, when worker
   * construction throws (Node / SSR / test runners), or when the worker fails
   * after it was made (see {@link solve}).
   */
  private getElk(): Promise<ElkInstance> {
    return (this.elkInstance ??= this.createElk());
  }

  private async createElk(): Promise<ElkInstance> {
    if (typeof Worker !== 'undefined') {
      try {
        const factory = this.opts.workerFactory ?? defaultElkWorkerFactory;
        // `elk-api`'s ctor calls the factory eagerly, so a thrown worker
        // construction is caught here and drops us to the sync fallback.
        return new ELK({ workerFactory: (url) => this.watch(factory(url)) });
      } catch {
        /* fall through to the synchronous bundle */
      }
    }
    return bundledElk();
  }

  /** Arm {@link workerFailed} on `worker`'s first error. */
  private watch(worker: Worker): Worker {
    let reject!: (err: Error) => void;
    const promise = new Promise<never>((_, r) => (reject = r));
    // Observed by every run's race; never an unhandled rejection on its own.
    promise.catch(() => {});
    const watched = { promise, dead: false };
    worker.addEventListener(
      'error',
      (e) => {
        e.preventDefault();
        watched.dead = true;
        reject(new Error(`ElkLayout: the ELK worker failed (${e.message || 'its script did not load'})`));
      },
      { once: true },
    );
    this.workerFailed = watched;
    return worker;
  }

  /**
   * Run ELK. A worker that fails is dropped for the synchronous build and the
   * same graph solved again, so a layout never hangs on a dead worker.
   */
  private async solve(graph: ElkNode): Promise<ElkNode> {
    const elk = await this.getElk();
    const watched = this.workerFailed;
    if (!watched) return elk.layout(graph);
    try {
      return await Promise.race([elk.layout(graph), watched.promise]);
    } catch (err) {
      // A solve's own error is not the worker's: only a dead worker falls back.
      if (!watched.dead) throw err;
      if (this.workerFailed === watched) {
        (elk as { terminateWorker?: () => void }).terminateWorker?.();
        this.workerFailed = undefined;
        this.elkInstance = bundledElk();
      }
      return (await this.getElk()).layout(graph);
    }
  }

  /**
   * Snapshot the store, run ELK (async), and return centre-converted positions.
   * The base writes them (snap or glide per `transition`) and then calls
   * {@link onPositionsApplied} with the routed edges. A throw here is surfaced
   * by the base (emits `end`, rejects the awaited `apply()`); a run superseded
   * while ELK was in flight is dropped by the base's staleness check.
   */
  protected async computeLayout(
    layer: GraphLayer,
    run: Readonly<LayoutRunOptions> = {},
  ): Promise<LayoutPositions<ElkRouteMeta | null> | null> {
    const store = layer.store;
    const fallback = this.opts.defaultNodeSize ?? FALLBACK_NODE_SIZE;
    const sizeOf = (n: GraphNode): NodeSize =>
      this.opts.nodeSize?.(n) ?? resolveNodeSize(layer, n, fallback);

    // 1. Snapshot the placeable nodes. This drops explicitly-hidden nodes *and*
    //    the members of collapsed groups — the latter are hidden derivedly, so a
    //    plain `hidden` check would lay out nodes nobody can see.
    const placeable = collectPlaceableNodes(layer, this.opts.includeHidden === true);
    if (placeable.size === 0) return null;

    // 2. Build the node tree. `includeGroups` (default on) nests each group's
    //    members inside it; with it off — or with no groups in the graph — the
    //    forest is flat and this produces exactly the graph the old flat path
    //    built, which is why there is only one path now.
    const nested = this.opts.includeGroups !== false;
    const children: ElkNode[] = nested
      ? buildGroupForest(layer, placeable).map((n) => this.buildElkNode(layer, n, sizeOf, fallback))
      : [...placeable].map((id) => {
          const node = store.getNode(id);
          const size = node ? sizeOf(node) : fallback;
          return { id, width: size.width, height: size.height };
        });
    if (children.length === 0) return null;
    const nests = nested && children.some((c) => (c.children?.length ?? 0) > 0);

    // 3. Edges, with endpoints inside collapsed groups re-pointed at the frame
    //    that stands in for them (and the resulting duplicates merged).
    // A **return** edge is withheld from ELK entirely (see
    // `ElkLayoutOptions.feedbackEdges`): handing it over makes ELK break a cycle
    // it cannot draw, reversing the edge and threading dummy nodes through every
    // spanned layer — which is what staggers the band either side of a loop.
    // Without it ELK lays out a clean DAG; the withheld edges are routed along
    // their own lane in `onPositionsApplied`.
    const isFeedback = this.opts.feedbackEdges;
    const feedbackIds: string[] = [];
    const forward: LayoutEdge[] = [];
    for (const e of collectLayoutEdges(layer, placeable)) {
      const stored = isFeedback ? store.getEdge(e.id) : undefined;
      if (stored && isFeedback?.(stored)) {
        feedbackIds.push(e.id);
        continue;
      }
      forward.push(e);
    }

    // 3b. The root. `radial` lays out a tree around one centre, so it gets a
    //     spanning tree pointed outward from it (see `radialTree`). `layered`
    //     starts from its sources on its own and only needs a root named when
    //     the caller asked for one or the graph has no source.
    const algorithm = this.opts.algorithm ?? 'layered';
    const topLevel = children.map((c) => c.id);
    const rootId =
      algorithm === 'radial' || algorithm === 'layered'
        ? this.resolveRoot(layer, topLevel, forward, algorithm === 'radial' ? 'centre' : 'tree')
        : undefined;
    const edges: ElkExtendedEdge[] =
      algorithm === 'radial' && rootId !== undefined
        ? radialTree(topLevel, forward, rootId)
        : forward.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }));
    if (algorithm === 'layered' && rootId !== undefined) {
      const root = children.find((c) => c.id === rootId);
      if (root) root.layoutOptions = { ...root.layoutOptions, 'elk.layered.layering.layerConstraint': 'FIRST' };
    }

    // 4. Build the ELK graph + merge convenience options with the free-form
    //    passthrough (passthrough wins).
    const graph: ElkNode = { id: 'root', layoutOptions: buildLayoutOptions(this.opts, nests), children, edges };
    if (algorithm === 'radial') graph.layoutOptions!['elk.radial.centerOnRoot'] = 'true';

    // 4b. A re-flow (an anchored run — e.g. after a group frame toggles) keeps
    //     the current order instead of re-solving from scratch: seed every box
    //     at its current place and switch the layered phases that would
    //     otherwise reorder (cycle breaking, layering, crossing minimisation) to
    //     their INTERACTIVE strategies, which read those seeds. Without it one
    //     frame shrinking can swap unrelated frames round.
    if (run.anchorNodeId !== undefined && (this.opts.algorithm ?? 'layered') === 'layered') {
      seedCurrentPositions(layer, graph, 0, 0);
      applyInteractive(graph);
    }

    // 5. Dispatch ELK (async; runs in a worker — see class docs).
    const result = await this.solve(graph);

    // 6. ELK reports child coordinates **relative to their parent**, so flatten
    //    by accumulating offsets: absolute top-left → canvas centre. Group
    //    containers get positions too; `GraphLayer`'s auto-fit then draws the
    //    frame around the packed members.
    const ids: string[] = [];
    const xy: number[] = [];
    // Node rects come along so the feedback router can place its lane clear of
    // every box rather than guessing an offset.
    const rects = new Map<string, ElkNodeRect>();
    const walk = (node: ElkNode, parentX: number, parentY: number): void => {
      const absX = parentX + (node.x ?? 0);
      const absY = parentY + (node.y ?? 0);
      if (node.id !== 'root') {
        const w = node.width ?? 0;
        const h = node.height ?? 0;
        const cx = absX + w / 2;
        const cy = absY + h / 2;
        ids.push(node.id);
        xy.push(cx, cy);
        rects.set(node.id, { cx, cy, w, h });
      }
      for (const child of node.children ?? []) walk(child, absX, absY);
    };
    walk(result, 0, 0);

    // Thread the edge geometry to onPositionsApplied. ELK's own routes only when
    // `edgeRouting` is on, and never for `radial`, whose tree edges are not the
    // store's (some point the other way, some are links this layout invented).
    // Feedback edges are routed whether or not `edgeRouting` is on — they were
    // never handed to ELK, so nothing else places them.
    const routePathType =
      this.opts.edgeRouting !== undefined && algorithm !== 'radial'
        ? ROUTE_PATH_TYPE[this.opts.edgeRouting]
        : null;
    const centre = algorithm === 'radial' && rootId !== undefined ? rects.get(rootId) : undefined;
    const meta: ElkRouteMeta = {
      edges: routePathType ? ((result.edges ?? []) as ElkExtendedEdge[]) : [],
      routePathType,
      rects,
      feedbackIds,
      ...(centre ? { origin: { x: centre.cx, y: centre.cy } } : {}),
    };
    return { ids, positions: new Float32Array(xy), meta };
  }

  /**
   * The root this run starts from: {@link ElkLayoutOptions.rootNodeId} when it
   * names a top-level node of this run, else the shared rule
   * (`resolveLayoutRoot`) — for `'tree'` that is `undefined` while the graph
   * has sources.
   */
  private resolveRoot(
    layer: GraphLayer,
    topLevel: readonly string[],
    edges: readonly LayoutEdge[],
    rule: 'tree' | 'centre',
  ): string | undefined {
    const named = this.opts.rootNodeId;
    if (named !== undefined && topLevel.includes(named)) return named;
    if (this.opts.root === 'selection') {
      const selected = topLevel.find((id) => layer.store.nodeStatesOf(id).includes('selected'));
      if (selected !== undefined) return selected;
    }
    return resolveLayoutRoot(layer, topLevel, edges, rule);
  }

  /**
   * Turn one node of the group forest into an ELK node, nesting a group's
   * members as `children` so ELK packs them inside the container box.
   *
   * A container's insets come from its own {@link GroupOptions} (`padding`, plus
   * `headerHeight` on top for the title band / `tabbed-rect` tab), so the box
   * ELK computes is the box `GraphLayer` will draw — rather than a hardcoded
   * guess the layer then has to grow.
   *
   * An `autoFit` container is deliberately handed **no** width/height. Its
   * stored size is the previous frame's computed fit; feeding that back as a
   * `MINIMUM_SIZE` floor would ratchet the frame — free to grow as members
   * spread, never able to shrink when they contract. A fixed-size group (`autoFit:
   * false`) does get its declared size as the floor, which is what "fixed" means.
   */
  private buildElkNode(
    layer: GraphLayer,
    forestNode: GroupForestNode,
    sizeOf: (n: GraphNode) => NodeSize,
    fallback: NodeSize,
  ): ElkNode {
    const node = layer.store.getNode(forestNode.id);
    const size = node ? sizeOf(node) : fallback;
    const elkNode: ElkNode = { id: forestNode.id, width: size.width, height: size.height };
    if (forestNode.children.length === 0) return elkNode;

    elkNode.children = forestNode.children.map((child) =>
      this.buildElkNode(layer, child, sizeOf, fallback),
    );
    const insets = node
      ? groupInsets(layer, node)
      : { top: 16, right: 16, bottom: 16, left: 16 };
    elkNode.layoutOptions = {
      // Spacing/algorithm keys are repeated on every container because **ELK
      // resolves layout options per node and a node that declares its own
      // `layoutOptions` does not inherit its parent's.** Without this the root
      // graph honoured `nodeSpacing` / `layerSpacing` between the containers
      // while every container laid its own members out with ELK's built-in
      // defaults (`elk.spacing.nodeNode` = 20) — so raising the spacing pushed
      // the frames apart and left the nodes inside them jammed together, at a
      // fixed 20px no matter what the caller configured.
      ...nestedLayoutOptions(this.opts),
      // Container-specific, so they must win over the inherited set above.
      'elk.padding': `[top=${insets.top},left=${insets.left},bottom=${insets.bottom},right=${insets.right}]`,
      'elk.nodeSize.constraints': 'MINIMUM_SIZE',
    };
    const floor = node ? groupSizeFloor(layer, node) : undefined;
    if (floor) {
      elkNode.width = floor.width;
      elkNode.height = floor.height;
    } else {
      delete elkNode.width;
      delete elkNode.height;
    }
    return elkNode;
  }

  /**
   * Shift the routed geometry with an anchored run's translation — the edge
   * sections (start / bend / end points) and the node boxes the feedback router
   * clears are absolute coordinates, so they must move with the positions.
   */
  protected override translateMeta(meta: unknown, dx: number, dy: number): unknown {
    const route = meta as ElkRouteMeta | null;
    if (!route) return route;
    const shift = (p: { x: number; y: number }) => ({ ...p, x: p.x + dx, y: p.y + dy });
    const edges = route.edges.map((e) => ({
      ...e,
      ...(e.sections
        ? {
            sections: e.sections.map((sec) => ({
              ...sec,
              startPoint: shift(sec.startPoint),
              endPoint: shift(sec.endPoint),
              ...(sec.bendPoints ? { bendPoints: sec.bendPoints.map(shift) } : {}),
            })),
          }
        : {}),
    }));
    const rects = new Map<string, ElkNodeRect>();
    for (const [id, r] of route.rects) rects.set(id, { ...r, cx: r.cx + dx, cy: r.cy + dy });
    return { ...route, edges, rects, ...(route.origin ? { origin: shift(route.origin) } : {}) };
  }

  /**
   * Hand this run's edge geometry to the layer as **layout geometry**
   * (`GraphLayer.setLayoutGeometry`) once node positions have settled: ELK's
   * routes when `edgeRouting` is on, typed by {@link ROUTE_PATH_TYPE}, the
   * feedback lanes, and — for `radial` — the centre as the frame origin that
   * `bump-radial` curves around. Nothing is written onto the edges, so the
   * geometry ends with this layout: the next run of another layout clears it.
   *
   * The geometry is read when each edge resolves its style, which happens
   * after the position flush has moved the shapes, so the route and the
   * boundary anchors agree without a separate flush.
   *
   * ELK works in the same coordinate frame as the stored centres, and — for
   * centre-origin shapes (circle, and `composite` via GraphLayer's centre-fit) —
   * the rendered node occupies exactly ELK's node box, so bend points line up with
   * the cards without any per-edge offset.
   */
  protected override onPositionsApplied(layer: GraphLayer, meta: unknown): void {
    const run = meta as ElkRouteMeta | null;
    if (!run) {
      layer.setLayoutGeometry(this, {});
      return;
    }
    const routes = new Map<string, LayoutRoute>();
    routeFeedbackEdges(layer.store, run.rects, run.feedbackIds, this.opts, routes);
    if (run.routePathType) {
      for (const e of run.edges) {
        // A merged id stands for several store edges that collapsed onto the
        // same endpoint pair (members of a collapsed group). It addresses none
        // of them, so there is no edge to route.
        if (isMergedEdgeId(e.id)) continue;
        // An edge ELK returned no section for has no route, and draws as the
        // layer's edge type says.
        const section = e.sections?.[0];
        if (!section) continue;
        // The FULL section path — startPoint + bends + endPoint — not just the
        // interior bends. The start/end points sit on the node border where
        // ELK's route leaves/enters perpendicularly, so the `orth` router
        // connects the boundary-anchored endpoints to them without inventing a
        // spurious out-and-back corner, and a `SPLINES` section is a complete
        // Bézier chain only with both ends.
        //
        // Pinning both endpoints to ELK's ports with the `edge-port` anchor was
        // tried and reverted — that anchor answers the outward face normal as
        // its tangent, and it makes the endpoint coincide with the first/last
        // waypoint, which pointed every arrowhead back into its own node. See
        // the History section of
        // rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read.
        const waypoints = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map((p) => ({
          x: p.x,
          y: p.y,
        }));
        routes.set(e.id, { pathType: run.routePathType, waypoints });
      }
    }
    layer.setLayoutGeometry(this, {
      ...(routes.size > 0 ? { routes } : {}),
      ...(run.origin ? { frame: { origin: run.origin } } : {}),
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Route the edges withheld from ELK along a reserved lane that clears every
 * node box.
 *
 * The shape is a staple: leave the source through the face that points *away*
 * from the flow, run along the lane, drop into the target through the same
 * face. Several returns stack into parallel lanes, longest span outermost, so
 * they nest instead of crossing.
 *
 * **Endpoints are left on the default `boundary` anchor deliberately.** That
 * anchor intersects the silhouette along the line to the neighbouring
 * waypoint, and the first/last waypoint here sits directly above (or beside)
 * the node centre — so the anchor lands exactly on the face midpoint with no
 * correction needed. Pinning the endpoint with `edge-port` instead was tried
 * and reverted: it answers the outward face normal as its tangent, which
 * turned every arrowhead back into its own node
 * (rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read).
 */
function routeFeedbackEdges(
  store: GraphLayer['store'],
  rects: ReadonlyMap<string, ElkNodeRect>,
  feedbackIds: readonly string[],
  opts: ElkLayoutOptions,
  routes: Map<string, LayoutRoute>,
): void {
  if (feedbackIds.length === 0) return;

  // Flow runs along one axis; the lane is offset along the other. For a
  // left-to-right flow the return rides above the band, for top-to-bottom it
  // rides to its left.
  const direction = opts.direction ?? 'RIGHT';
  const horizontalFlow = direction === 'RIGHT' || direction === 'LEFT';
  const gap = opts.feedbackLaneGap ?? 36;

  // The outer edge of everything laid out — the lane starts clear of it.
  let extent = Infinity;
  for (const r of rects.values()) {
    extent = Math.min(extent, horizontalFlow ? r.cy - r.h / 2 : r.cx - r.w / 2);
  }
  if (!Number.isFinite(extent)) return;

  // Longest span outermost so nested returns don't cross one another.
  const spans = feedbackIds
    .map((id) => {
      const edge = store.getEdge(id);
      const from = edge ? rects.get(edge.source) : undefined;
      const to = edge ? rects.get(edge.target) : undefined;
      if (!edge || !from || !to) return null;
      const span = horizontalFlow ? Math.abs(from.cx - to.cx) : Math.abs(from.cy - to.cy);
      return { id, from, to, span };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.span - b.span);

  spans.forEach(({ id, from, to }, i) => {
    const lane = extent - gap * (i + 1);
    const waypoints = horizontalFlow
      ? [
          { x: from.cx, y: lane },
          { x: to.cx, y: lane },
        ]
      : [
          { x: lane, y: from.cy },
          { x: lane, y: to.cy },
        ];
    routes.set(id, { pathType: 'orth', waypoints });
  });
}

/**
 * A spanning tree of the drawn graph for ELK `radial`, which needs a tree:
 * handed a cyclic graph it stacks nodes onto a few points.
 *
 * Breadth-first from `rootId` over the edges taken as undirected, each tree
 * edge pointed parent → child, so `rootId` is the only node with no incoming
 * edge and ELK centres it. Each further component hangs off the root by an
 * invented link to that component's most-connected node. Edges left out of
 * the tree are still drawn — ELK just doesn't place by them. Only edges
 * between top-level nodes take part; a group's members are placed inside it.
 */
function radialTree(
  nodes: readonly string[],
  edges: readonly LayoutEdge[],
  rootId: string,
): ElkExtendedEdge[] {
  const inScope = new Set(nodes);
  const adjacent = new Map<string, Array<{ id: string; other: string }>>();
  for (const e of edges) {
    if (e.source === e.target || !inScope.has(e.source) || !inScope.has(e.target)) continue;
    (adjacent.get(e.source) ?? adjacent.set(e.source, []).get(e.source)!).push({ id: e.id, other: e.target });
    (adjacent.get(e.target) ?? adjacent.set(e.target, []).get(e.target)!).push({ id: e.id, other: e.source });
  }
  const out: ElkExtendedEdge[] = [];
  const seen = new Set<string>();
  const grow = (from: string): void => {
    seen.add(from);
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const parent = queue[i]!;
      for (const { id, other } of adjacent.get(parent) ?? []) {
        if (seen.has(other)) continue;
        seen.add(other);
        out.push({ id, sources: [parent], targets: [other] });
        queue.push(other);
      }
    }
  };
  const component = (from: string): string[] => {
    const members = [from];
    const local = new Set(members);
    for (let i = 0; i < members.length; i++) {
      for (const { other } of adjacent.get(members[i]!) ?? []) {
        if (!local.has(other)) {
          local.add(other);
          members.push(other);
        }
      }
    }
    return members;
  };
  grow(rootId);
  for (const id of nodes) {
    if (seen.has(id)) continue;
    const members = component(id);
    const hub = members.reduce((a, b) => ((adjacent.get(b)?.length ?? 0) > (adjacent.get(a)?.length ?? 0) ? b : a));
    out.push({ id: `${RADIAL_LINK_PREFIX}${hub}`, sources: [rootId], targets: [hub] });
    grow(hub);
  }
  return out;
}

/** Absolute centre + extent of one ELK-placed node, in canvas coordinates. */
interface ElkNodeRect {
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}

/** What `computeLayout` threads to `onPositionsApplied`: the run's edge geometry. */
interface ElkRouteMeta {
  /** ELK's routed edges; empty unless {@link routePathType} is set. */
  readonly edges: ElkExtendedEdge[];
  /** The path type ELK's routes draw with, or `null` when this run routes nothing. */
  readonly routePathType: EdgePathType | null;
  readonly rects: ReadonlyMap<string, ElkNodeRect>;
  /** Edges withheld from ELK, routed by {@link routeFeedbackEdges} instead. */
  readonly feedbackIds: readonly string[];
  /** The radial centre — the frame origin `bump-radial` curves around. */
  readonly origin?: { readonly x: number; readonly y: number };
}


/**
 * Default Web Worker factory: elkjs's worker build, shipped beside this module
 * as `dist/elk-worker.min.js`. A relative `new URL('./…', import.meta.url)` is
 * correct unbundled and is the form bundlers (Vite, webpack 5, Rollup) detect
 * and emit as a worker asset; a bare package specifier in the URL is neither.
 * `elk-worker.min.js` is a classic worker script, hence `{ type: 'classic' }`.
 */
function defaultElkWorkerFactory(): Worker {
  return new Worker(new URL('./elk-worker.min.js', import.meta.url), { type: 'classic' });
}

/**
 * The in-process ELK build. Dynamically imported so the 1.6 MB bundle stays out
 * of the worker path; main-thread-blocking, so only where a worker cannot run.
 * `elk.bundled.js` is a UMD: as CommonJS its export is the class (with a
 * `default` on it); served raw as ESM it has no exports and sets `ELK` on the
 * global instead — all three are accepted.
 */
async function bundledElk(): Promise<ElkInstance> {
  const mod = (await import('elkjs/lib/elk.bundled.js')) as unknown as {
    default?: ElkCtor & { default?: ElkCtor };
  };
  const Ctor = mod.default?.default ?? mod.default ?? (globalThis as { ELK?: ElkCtor }).ELK;
  if (!Ctor) throw new Error('ElkLayout: elkjs/lib/elk.bundled.js exported no ELK constructor');
  return new Ctor();
}

type ElkCtor = new () => ElkInstance;

/**
 * Merge the convenience option fields and the free-form `layoutOptions`
 * passthrough into a single ELK property bag. The passthrough is applied
 * last so users can always override.
 */
function buildLayoutOptions(opts: ElkLayoutOptions, nests = false): LayoutOptions {
  const out: LayoutOptions = {};
  const algorithm = opts.algorithm ?? 'layered';
  out['elk.algorithm'] = algorithm;
  // Only meaningful when something actually nests, and only honoured by the
  // algorithms in `CROSS_HIERARCHY_ALGORITHMS` — set unconditionally it would
  // change `force` / `stress` output without buying cross-boundary routing.
  // Applied before the passthrough below so a caller can still force it.
  if (nests && CROSS_HIERARCHY_ALGORITHMS.has(algorithm)) {
    out['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
  }
  if (opts.direction !== undefined) out['elk.direction'] = opts.direction;
  if (opts.nodeSpacing !== undefined) out['elk.spacing.nodeNode'] = String(opts.nodeSpacing);
  if (opts.layerSpacing !== undefined) {
    out['elk.layered.spacing.nodeNodeBetweenLayers'] = String(opts.layerSpacing);
  }
  if (opts.edgeNodeSpacing !== undefined) out['elk.spacing.edgeNode'] = String(opts.edgeNodeSpacing);
  if (opts.edgeSpacing !== undefined) out['elk.spacing.edgeEdge'] = String(opts.edgeSpacing);
  if (opts.edgeRouting !== undefined) out['elk.edgeRouting'] = opts.edgeRouting;
  if (opts.ringSpacing !== undefined) out['elk.radial.radius'] = String(opts.ringSpacing);
  if (opts.padding !== undefined) out['elk.padding'] = formatPadding(opts.padding);
  if (opts.layoutOptions) Object.assign(out, opts.layoutOptions);
  return out;
}

/**
 * The subset of {@link buildLayoutOptions} a **nested container** re-declares.
 *
 * ELK resolves layout options per node: a node carrying its own `layoutOptions`
 * does **not** inherit the ones set on its parent. A container has to declare
 * `elk.padding` (its `GroupOptions` insets), so it silently opted out of every
 * spacing key the caller configured on the root and fell back to ELK's defaults
 * — `elk.spacing.nodeNode` = 20 regardless of {@link ElkLayoutOptions.nodeSpacing}.
 * The visible symptom was a graph whose *frames* respected the spacing while the
 * *nodes inside them* stayed jammed at 20px.
 *
 * Two keys are deliberately dropped:
 * - **`elk.padding`** — each container computes its own from its `GroupOptions`,
 *   and the caller's graph-level padding must not overwrite it.
 * - **`elk.hierarchyHandling`** — root-only; passing `nests = false` omits it.
 */
function nestedLayoutOptions(opts: ElkLayoutOptions): LayoutOptions {
  const out = buildLayoutOptions(opts);
  delete out['elk.padding'];
  return out;
}

/**
 * ELK's `elk.padding` is a string in the form `'[top=N,right=N,bottom=N,left=N]'`.
 * Symmetric `number` shorthand fills all four sides.
 */
function formatPadding(p: ElkPadding): string {
  if (typeof p === 'number') {
    return `[top=${p},right=${p},bottom=${p},left=${p}]`;
  }
  const top = p.top ?? 0;
  const right = p.right ?? 0;
  const bottom = p.bottom ?? 0;
  const left = p.left ?? 0;
  return `[top=${top},right=${right},bottom=${bottom},left=${left}]`;
}

/** The layered phases switched to `INTERACTIVE` for a re-flow — see {@link applyInteractive}. */
const INTERACTIVE_KEYS = [
  'elk.layered.cycleBreaking.strategy',
  'elk.layered.layering.strategy',
  'elk.layered.crossingMinimization.strategy',
] as const;

/**
 * Give `node` and every nested container ELK's `INTERACTIVE` strategies for
 * the phases that decide order, so they follow the seeded coordinates. Applied
 * per container because ELK does not inherit `layoutOptions` from a parent
 * that declares its own (see {@link nestedLayoutOptions}).
 */
function applyInteractive(node: ElkNode): void {
  if (node.layoutOptions) {
    for (const key of INTERACTIVE_KEYS) node.layoutOptions[key] = 'INTERACTIVE';
  }
  for (const child of node.children ?? []) {
    if (child.children?.length) applyInteractive(child);
  }
}

/**
 * Seed each ELK box with where it is drawn now, as ELK expects it: top-left,
 * **relative to its parent box**. Read from the renderer's world bounds (the
 * box the user sees — for a group, the frame drawn around its members); a node
 * never drawn falls back to its stored centre and ELK size, and a node with
 * neither is left unseeded for ELK to place.
 */
function seedCurrentPositions(layer: GraphLayer, node: ElkNode, parentX: number, parentY: number): void {
  for (const child of node.children ?? []) {
    const box = currentBox(layer, child);
    if (box) {
      child.x = box.x - parentX;
      child.y = box.y - parentY;
    }
    if (child.children?.length) {
      seedCurrentPositions(layer, child, box ? box.x : parentX, box ? box.y : parentY);
    }
  }
}

/** The absolute top-left of `node`'s current box, or `null` when unknown. */
function currentBox(layer: GraphLayer, node: ElkNode): { x: number; y: number } | null {
  const bounds = layer.getRenderer()?.getShapeWorldBounds(node.id);
  if (bounds) return { x: bounds.x, y: bounds.y };
  if (!layer.store.hasPosition(node.id)) return null;
  const p = layer.store.getPosition(node.id)!;
  return { x: p.x - (node.width ?? 0) / 2, y: p.y - (node.height ?? 0) / 2 };
}
