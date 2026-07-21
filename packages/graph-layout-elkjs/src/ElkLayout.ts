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

import { OneShotPositionLayout, type GraphLayer, type GraphNode, type EdgeStyle, type LayoutPositions } from '@invana/graph';

import type {
  ElkLayoutOptions,
  ElkPadding,
  NodeSize,
} from './types';

/** Fallback bounding box when no shape and no override give us a size. */
const FALLBACK_NODE_SIZE: NodeSize = { width: 40, height: 40 };

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

    // 1. Snapshot nodes + edges, resolving width/height per node.
    const sizeOf = this.opts.nodeSize ?? ((n: GraphNode) => resolveSizeFromLayer(layer, n));

    // Compound path — nest `parentId` groups so ELK packs members inside their
    // container box. Falls through to the flat path when `includeGroups` is off.
    if (this.opts.includeGroups) return this.computeCompound(store, sizeOf);
    const ids: string[] = [];
    const sizes: NodeSize[] = [];
    const children: ElkNode[] = [];
    // Exclude explicitly-hidden nodes (unless `includeHidden`) — they keep their
    // frozen positions and don't influence the solve. `placeable` tracks which
    // ids made it in so incident edges to hidden nodes can be dropped.
    const placeable = new Set<string>();
    for (const n of store.nodes()) {
      if (!this.shouldPlaceNode(n)) continue;
      const size = sizeOf(n) ?? FALLBACK_NODE_SIZE;
      ids.push(n.id);
      sizes.push(size);
      children.push({ id: n.id, width: size.width, height: size.height });
      placeable.add(n.id);
    }
    if (children.length === 0) return null;

    const edges: ElkExtendedEdge[] = [];
    for (const e of store.edges()) {
      if (!placeable.has(e.source) || !placeable.has(e.target)) continue;
      edges.push({ id: e.id, sources: [e.source], targets: [e.target] });
    }

    // 2. Build the ELK graph + merge convenience options with the
    //    free-form passthrough (passthrough wins).
    const layoutOptions = buildLayoutOptions(this.opts);
    const graph: ElkNode = { id: 'root', layoutOptions, children, edges };

    // 3. Dispatch ELK (async; runs in a worker — see class docs).
    const elk = await this.getElk();
    const result = await elk.layout(graph);

    // 4. Convert ELK top-left coordinates to canvas centre coordinates into the
    //    target buffer. Iterate `result.children` (its child order is the order
    //    we passed in), pairing with `sizes` by index.
    const resultChildren = result.children ?? [];
    const target = new Float32Array(resultChildren.length * 2);
    for (let i = 0; i < resultChildren.length; i++) {
      const child = resultChildren[i]!;
      const size = sizes[i]!;
      target[i * 2] = (child.x ?? 0) + size.width / 2;
      target[i * 2 + 1] = (child.y ?? 0) + size.height / 2;
    }

    // Thread routed edges to onPositionsApplied (only when edge routing is on).
    const meta = this.opts.edgeRouting !== undefined ? ((result.edges ?? []) as ElkExtendedEdge[]) : null;
    return { ids, positions: target, meta };
  }

  /**
   * Compound (nested) layout for `parentId` groups — each group node's members
   * are nested under it as ELK `children`, and ELK packs them inside the group
   * box (sized to fit + padding). `elk.hierarchyHandling: INCLUDE_CHILDREN` lets
   * edges cross container boundaries. ELK reports child coordinates **relative to
   * their parent**, so the result is flattened back to absolute world positions
   * by accumulating parent offsets. Group container nodes get positions too (the
   * `GraphLayer`'s `autoFit` then draws a tight frame around the packed members).
   */
  private async computeCompound(
    store: GraphLayer['store'],
    sizeOf: (n: GraphNode) => NodeSize | undefined,
  ): Promise<LayoutPositions<ElkExtendedEdge[] | null> | null> {
    const placeable = new Set<string>();
    const sizeById = new Map<string, NodeSize>();
    for (const n of store.nodes()) {
      if (!this.shouldPlaceNode(n)) continue;
      placeable.add(n.id);
      sizeById.set(n.id, sizeOf(n) ?? FALLBACK_NODE_SIZE);
    }
    if (placeable.size === 0) return null;

    // Recursively build an ELK node, nesting its placeable children.
    const buildNode = (id: string): ElkNode => {
      const size = sizeById.get(id) ?? FALLBACK_NODE_SIZE;
      const node: ElkNode = { id, width: size.width, height: size.height };
      const kids: ElkNode[] = [];
      for (const child of store.childrenOf(id)) {
        if (placeable.has(child)) kids.push(buildNode(child));
      }
      if (kids.length > 0) {
        node.children = kids;
        // Size the container to fit its members + padding (the "auto-fit" box).
        node.layoutOptions = {
          'elk.padding': '[top=24,left=24,bottom=24,right=24]',
          'elk.nodeSize.constraints': 'MINIMUM_SIZE',
        };
      }
      return node;
    };

    // Roots = placeable nodes with no placeable parent.
    const roots: ElkNode[] = [];
    for (const n of store.nodes()) {
      if (!placeable.has(n.id)) continue;
      if (n.parentId && placeable.has(n.parentId)) continue;
      roots.push(buildNode(n.id));
    }

    // Edges reference leaf ids; declared on the root, resolved across levels.
    const edges: ElkExtendedEdge[] = [];
    for (const e of store.edges()) {
      if (!placeable.has(e.source) || !placeable.has(e.target)) continue;
      edges.push({ id: e.id, sources: [e.source], targets: [e.target] });
    }

    const graph: ElkNode = {
      id: 'root',
      layoutOptions: { ...buildLayoutOptions(this.opts), 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' },
      children: roots,
      edges,
    };

    const elk = await this.getElk();
    const result = await elk.layout(graph);

    // Flatten the result: accumulate parent offsets → absolute top-left → centre.
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

    const meta = this.opts.edgeRouting !== undefined ? ((result.edges ?? []) as ElkExtendedEdge[]) : null;
    return { ids, positions: new Float32Array(xy), meta };
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
 * Read the resolved shape's local AABB from {@link GraphLayer.boundsOfNode}
 * and project it to a `{ width, height }`. The layer routes through the
 * shape registry's `static boundsOf` hook, so every registered kind
 * (built-in or custom) flows through the same code path here without a
 * per-kind switch.
 *
 * Falls back to {@link FALLBACK_NODE_SIZE} when the renderer isn't
 * mounted yet, the resolved shape kind isn't registered, or the
 * registered ctor doesn't expose `boundsOf`. Consumers that need a
 * tighter override on a per-node basis can pass `nodeSize: (node) =>
 * ({ width, height })` to bypass this hook entirely.
 */
function resolveSizeFromLayer(layer: GraphLayer, node: GraphNode): NodeSize {
  // Prefer the cached render size — the layer writes `node.boundingBox` after
  // each draw, so we avoid recomputing the shape spec (rebuilding every part of
  // a composite card) per node. Falls back to `boundsOfNode` when the node
  // hasn't rendered yet (first layout pass before mount).
  if (node.boundingBox) return { width: node.boundingBox.width, height: node.boundingBox.height };
  const local = layer.boundsOfNode(node);
  if (!local) return FALLBACK_NODE_SIZE;
  return { width: local.width, height: local.height };
}

/**
 * Merge the convenience option fields and the free-form `layoutOptions`
 * passthrough into a single ELK property bag. The passthrough is applied
 * last so users can always override.
 */
function buildLayoutOptions(opts: ElkLayoutOptions): LayoutOptions {
  const out: LayoutOptions = {};
  out['elk.algorithm'] = opts.algorithm ?? 'layered';
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
