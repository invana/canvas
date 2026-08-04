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

import {
  OneShotPositionLayout,
  buildGroupForest,
  collectLayoutEdges,
  collectPlaceableNodes,
  groupInsets,
  groupSizeFloor,
  isMergedEdgeId,
  resolveNodeSize,
  type GraphLayer,
  type GraphNode,
  type EdgeStyle,
  type GroupForestNode,
  type LayoutPositions,
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
   * synchronous `elk.bundled.js` only when no `Worker` global exists or worker
   * construction throws synchronously (Node / SSR / test runners).
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
        return new ELK({ workerFactory: factory });
      } catch {
        /* fall through to the synchronous bundle */
      }
    }
    // No Worker (Node / SSR / tests) or worker construction failed: use the
    // in-process build. Dynamically imported so the 1.6 MB bundle stays out of
    // the worker-path code chunk. This re-introduces main-thread blocking, but
    // only where workers don't exist at all.
    const { default: BundledELK } = await import('elkjs/lib/elk.bundled.js');
    return new BundledELK();
  }

  /**
   * Snapshot the store, run ELK (async), and return centre-converted positions.
   * The base writes them (snap or glide per `transition`) and then calls
   * {@link onPositionsApplied} with the routed edges. A throw here is surfaced
   * by the base (emits `end`, rejects the awaited `apply()`); a run superseded
   * while ELK was in flight is dropped by the base's staleness check.
   */
  protected async computeLayout(layer: GraphLayer): Promise<LayoutPositions<ElkExtendedEdge[] | null> | null> {
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
    const edges: ElkExtendedEdge[] = collectLayoutEdges(layer, placeable).map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

    // 4. Build the ELK graph + merge convenience options with the free-form
    //    passthrough (passthrough wins).
    const graph: ElkNode = { id: 'root', layoutOptions: buildLayoutOptions(this.opts, nests), children, edges };

    // 5. Dispatch ELK (async; runs in a worker — see class docs).
    const elk = await this.getElk();
    const result = await elk.layout(graph);

    // 6. ELK reports child coordinates **relative to their parent**, so flatten
    //    by accumulating offsets: absolute top-left → canvas centre. Group
    //    containers get positions too; `GraphLayer`'s auto-fit then draws the
    //    frame around the packed members.
    const ids: string[] = [];
    const xy: number[] = [];
    const walk = (node: ElkNode, parentX: number, parentY: number): void => {
      const absX = parentX + (node.x ?? 0);
      const absY = parentY + (node.y ?? 0);
      if (node.id !== 'root') {
        ids.push(node.id);
        xy.push(absX + (node.width ?? 0) / 2, absY + (node.height ?? 0) / 2);
      }
      for (const child of node.children ?? []) walk(child, absX, absY);
    };
    walk(result, 0, 0);

    // Thread routed edges to onPositionsApplied (only when edge routing is on).
    const meta = this.opts.edgeRouting !== undefined ? ((result.edges ?? []) as ElkExtendedEdge[]) : null;
    return { ids, positions: new Float32Array(xy), meta };
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
   * When ELK edge routing is on, read back each edge's computed bend points and
   * write them as `style.shape.waypoints` (pathType 'orth') — once node positions
   * have settled, in their own flush.
   *
   * This must NOT share a flush with the position write: a position flush marks
   * every incident connector dirty and re-routes them via a plain
   * `updateConnector(id, {})` at flush end; bundling the waypoint write into that
   * same flush lets that re-route run alongside the waypoint-applying `edge:update`,
   * and the routed path doesn't stick. A separate flush (no concurrent node moves)
   * mirrors the hover/`rerenderEdge` path that applies cleanly.
   *
   * ELK works in the same coordinate frame as the stored centres, and — for
   * centre-origin shapes (circle, and `composite` via GraphLayer's centre-fit) —
   * the rendered node occupies exactly ELK's node box, so bend points line up with
   * the cards without any per-edge offset.
   */
  protected override onPositionsApplied(layer: GraphLayer, meta: unknown): void {
    const routedEdges = meta as ElkExtendedEdge[] | null;
    if (!routedEdges) return;
    const store = layer.store;
    store.batch(() => {
      for (const e of routedEdges) {
        // A merged id stands for several store edges that collapsed onto the
        // same endpoint pair (members of a collapsed group). It addresses none
        // of them, so there is no edge to write this route onto.
        if (isMergedEdgeId(e.id)) continue;
        // Use the FULL section path — startPoint + bends + endPoint — not just
        // the interior bends. The start/end points sit on the node border where
        // ELK's route leaves/enters perpendicularly, so the `orth` router connects
        // the boundary-anchored endpoints to them without inventing a spurious
        // out-and-back corner. (Interior bends only made orth L-bend across a long
        // misaligned first/last leg → visible "peaks" at both ends.)
        const section = e.sections?.[0];
        const waypoints = section
          ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map((p) => ({
              x: p.x,
              y: p.y,
            }))
          : [];
        const prev = (store.getEdge(e.id)?.style as EdgeStyle | undefined) ?? {};
        store.updateEdge(e.id, {
          style: { ...prev, shape: { ...(prev.shape ?? {}), pathType: 'orth', waypoints } },
        });
      }
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Default Web Worker factory: load elkjs's worker build relative to this
 * module. The `new Worker(new URL(specifier, import.meta.url))` form is the
 * web-standard worker pattern that modern bundlers (Vite, webpack 5, Rollup)
 * statically detect and rewrite to a bundled worker asset. `elk-worker.min.js`
 * is a classic worker script, hence `{ type: 'classic' }`.
 */
function defaultElkWorkerFactory(): Worker {
  return new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url), {
    type: 'classic',
  });
}

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
