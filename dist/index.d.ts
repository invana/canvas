import { ElkExtendedEdge } from 'elkjs/lib/elk-api.js';
import { LayoutRunOptions } from '@invana/canvas-core';
import { OneShotLayoutOptions, GraphNode, GraphEdge, OneShotPositionLayout, GraphLayer, LayoutPositions } from '@invana/graph';

/**
 * `ElkLayout` options. See the
 * [ELK reference](https://eclipse.dev/elk/reference.html) for the full
 * catalogue of algorithms and properties.
 *
 * Every field defaults to `undefined`. When omitted, ELK's own algorithm
 * defaults apply. The {@link ElkLayoutOptions.layoutOptions} escape hatch
 * passes raw property keys (`'elk.algorithm'`, `'elk.spacing.nodeNode'`,
 * etc.) straight through and wins over every convenience field above.
 *
 * @example
 * new ElkLayout({
 *   algorithm: 'layered',
 *   direction: 'RIGHT',
 *   nodeSpacing: 40,
 *   layerSpacing: 80,
 * });
 */

/**
 * Built-in ELK algorithm names shipped in `elkjs/lib/elk.bundled.js`.
 *
 * `'layered'` (Sugiyama hierarchical, the default) is the right choice for
 * most directed graphs. The other algorithms cover specialised cases:
 *
 *  - `'mrtree'` — tidy tree, single root.
 *  - `'radial'` — radial tree.
 *  - `'force'` — Eades / Fruchterman–Reingold force-directed.
 *  - `'stress'` — multi-dimensional scaling stress majorisation.
 *  - `'disco'` — disconnected-component packing wrapper.
 *  - `'sporeOverlap'` / `'sporeCompaction'` — SPOrE post-processors.
 *  - `'box'` / `'rectpacking'` — pack rectangles without edges.
 *  - `'random'` — debugging baseline.
 *  - `'fixed'` — keep user-supplied coordinates; only resolves edges.
 *
 * Pass any string to use a custom-registered algorithm.
 */
type ElkAlgorithmName = 'layered' | 'mrtree' | 'radial' | 'force' | 'stress' | 'disco' | 'sporeOverlap' | 'sporeCompaction' | 'box' | 'rectpacking' | 'random' | 'fixed' | (string & {});
/** Direction of the primary layout axis. Mapped to `elk.direction`. */
type ElkDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
/** Symmetric or per-side padding around the graph. Mapped to `elk.padding`. */
type ElkPadding = number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};
/**
 * Resolved node bounding box, in canvas units. ELK needs concrete width +
 * height for every node to place them — `ElkLayout` derives these from the
 * resolved node style by default, but you can override per-node via
 * {@link ElkLayoutOptions.nodeSize}.
 */
interface NodeSize {
    width: number;
    height: number;
}
/**
 * `ElkLayout` constructor options. See top-level module doc.
 *
 * Extends {@link OneShotLayoutOptions}, so it also accepts `id` / `targetLayerId`
 * (registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
 * (glide nodes to the ELK result instead of snapping — owned by the shared
 * `OneShotPositionLayout` base).
 */
interface ElkLayoutOptions extends OneShotLayoutOptions {
    /**
     * Lay **groups** out as true nested containers — a compound layout. Each
     * group's members are nested under it in the ELK graph and ELK packs them
     * *inside* the group box, sized from the group's own `padding` /
     * `headerHeight`, so the group renders as one crisp contained cluster.
     *
     * A "group" here means what it means everywhere else in the engine: a node
     * whose resolved style carries `group` (`GraphLayer.isGroupNode`). A plain
     * `parentId` **tree** is *not* a group and lays out flat — `parentId` is the
     * shared hierarchy field, so nesting on it alone would box up ordinary trees.
     * A **collapsed** group is laid out as the single node the renderer draws in
     * its members' place; the members themselves keep their frozen positions.
     *
     * Default `true`. It costs nothing on a graph without groups — the compound
     * builder degenerates to exactly the flat graph — so pass `false` only to
     * force group members to be placed as ordinary free-floating nodes.
     *
     * Note that `elk.hierarchyHandling: INCLUDE_CHILDREN` (edges routed across
     * container boundaries) is applied only for algorithms that honour it —
     * `layered` today. Other algorithms still nest, but solve each container
     * separately.
     */
    includeGroups?: boolean;
    /** `elk.algorithm`. Default: `'layered'`. */
    algorithm?: ElkAlgorithmName;
    /** `elk.direction`. Algorithms that respect direction: `layered`, `mrtree`, ... */
    direction?: ElkDirection;
    /** `elk.spacing.nodeNode` — minimum gap between sibling nodes. */
    nodeSpacing?: number;
    /**
     * `elk.layered.spacing.nodeNodeBetweenLayers` — gap between consecutive
     * layers in the `layered` algorithm. Ignored by other algorithms.
     */
    layerSpacing?: number;
    /** `elk.spacing.edgeNode` — gap between an edge and a node. */
    edgeNodeSpacing?: number;
    /** `elk.spacing.edgeEdge` — gap between parallel edges. */
    edgeSpacing?: number;
    /**
     * `elk.edgeRouting`. When set, ELK computes node-avoiding edge geometry and
     * `ElkLayout` writes the resulting bend points back as each edge's
     * `style.shape.waypoints` (with `pathType: 'orth'`). Leaving it unset keeps
     * the previous behaviour — only node positions are written, no edge geometry.
     *
     * `'ORTHOGONAL'` is the intended value for `layered` graphs. Routing assumes
     * nodes whose `node.position` is their CENTRE (circle natively; the
     * `composite` shape via `GraphLayer`'s centre-fit). Top-left-origin shapes
     * (e.g. `rect`) would render offset from the computed routes.
     */
    edgeRouting?: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';
    /** `elk.padding` — graph-level padding. */
    padding?: ElkPadding;
    /**
     * Fallback bounding box used when {@link nodeSize} is not provided and
     * the node has no resolvable `style.shape`. Default `{ width: 40, height: 40 }`.
     */
    defaultNodeSize?: NodeSize;
    /**
     * Per-node bounding box override. Called once per node at the start of
     * `apply()` with the underlying `GraphNode`. When omitted, `ElkLayout`
     * reads `style.shape` via the layer's `resolveNodeStyle` and falls back
     * to {@link defaultNodeSize} when no shape is found.
     *
     * Return tight bounds — ELK adds spacing on top, so over-sized boxes
     * blow up the final layout.
     */
    nodeSize?: (node: GraphNode) => NodeSize;
    /**
     * Names the edges that are **returns** rather than forward flow — a retry
     * arc, a state-machine transition back to an earlier state, a BPMN loop.
     *
     * A layered algorithm cannot draw a cycle, so ELK breaks it: it reverses one
     * edge of the cycle and threads **dummy nodes** through every layer the
     * reversed edge spans. Those dummies take real vertical slots, which pushes
     * the nodes either side of them out of line — the "staggered band" a
     * feedback loop always produces. ELK is doing the right general thing; it
     * just has no way of knowing the edge *means* "go back".
     *
     * Edges this predicate accepts are **withheld from the ELK graph entirely**,
     * so ELK lays out the remaining DAG with no cycle to break and no dummies.
     * They are then routed afterwards along a reserved lane clear of every node
     * box (see `elk.layered.spacing` notes in the package CLAUDE.md), which is
     * how BPMN and yFiles draw the same picture.
     *
     * Opt-in, and deliberately a predicate rather than automatic cycle
     * detection: which edge of a cycle is "the return" is a question about what
     * the diagram means, not about its topology, and the answer belongs to the
     * author. Mirrors {@link ElkLayoutOptions.nodeSize} in shape.
     *
     * Withholding an edge changes only its **routing**; both endpoints are still
     * laid out, and an edge whose removal disconnects the graph simply leaves
     * ELK placing the two components independently.
     *
     * @example
     * ```ts
     * new ElkLayout({ feedbackEdges: (e) => e.type === 'RETRY' })
     * ```
     */
    feedbackEdges?: (edge: GraphEdge) => boolean;
    /**
     * Gap between the outermost node box and the first return lane, and between
     * consecutive lanes when several returns stack. Default `36`.
     */
    feedbackLaneGap?: number;
    /**
     * Free-form ELK property bag, merged into the root graph's
     * `layoutOptions` after the convenience fields above. Use for any
     * property the typed surface doesn't cover (`elk.layered.crossingMinimization.strategy`,
     * `elk.aspectRatio`, etc.). Later keys win.
     */
    layoutOptions?: Record<string, string>;
    /**
     * Factory for the Web Worker that runs the ELK solver off the main thread.
     *
     * `ElkLayout` runs ELK in a worker by default — the solve is CPU-heavy and
     * super-linear in graph size, so running it on the main thread freezes the
     * UI (no paint, no input) for the whole computation. That is especially
     * visible when a one-shot algorithm re-runs on every streaming update. The
     * worker keeps the main thread responsive while ELK works.
     *
     * The default factory does
     * `new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url), { type: 'classic' })`,
     * which modern bundlers (Vite, webpack 5, Rollup) resolve and bundle as a
     * worker asset. Override this when your bundler needs a different idiom to
     * locate the worker (e.g. Vite's `new ElkWorker()` from a `?worker` import).
     *
     * When no `Worker` global exists (Node, SSR, test runners) or worker
     * construction throws, `ElkLayout` falls back to the synchronous
     * `elkjs/lib/elk.bundled.js` build — correct, but main-thread-blocking.
     */
    workerFactory?: (url?: string) => Worker;
}

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

declare class ElkLayout extends OneShotPositionLayout<ElkLayoutOptions> {
    readonly kind = "elk-layout";
    /**
     * Shared ELK instance — `elkjs` is happy to be reused across runs, and we
     * keep one worker alive for the layout's lifetime instead of spinning one up
     * per solve. Created lazily on the first {@link computeLayout} (so a layout
     * that's registered but never run never spawns a worker), and memoised as a
     * Promise because the no-worker fallback needs an async dynamic import.
     */
    private elkInstance?;
    constructor(opts?: ElkLayoutOptions);
    /**
     * Lazily construct (and memoise) the ELK instance. Prefers the worker-backed
     * `elk-api` build so the solve stays off the main thread; falls back to the
     * synchronous `elk.bundled.js` only when no `Worker` global exists or worker
     * construction throws synchronously (Node / SSR / test runners).
     */
    private getElk;
    private createElk;
    /**
     * Snapshot the store, run ELK (async), and return centre-converted positions.
     * The base writes them (snap or glide per `transition`) and then calls
     * {@link onPositionsApplied} with the routed edges. A throw here is surfaced
     * by the base (emits `end`, rejects the awaited `apply()`); a run superseded
     * while ELK was in flight is dropped by the base's staleness check.
     */
    protected computeLayout(layer: GraphLayer, run?: Readonly<LayoutRunOptions>): Promise<LayoutPositions<ElkRouteMeta | null> | null>;
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
    private buildElkNode;
    /**
     * Shift the routed geometry with an anchored run's translation — the edge
     * sections (start / bend / end points) and the node boxes the feedback router
     * clears are absolute coordinates, so they must move with the positions.
     */
    protected translateMeta(meta: unknown, dx: number, dy: number): unknown;
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
    protected onPositionsApplied(layer: GraphLayer, meta: unknown): void;
}
/** Absolute centre + extent of one ELK-placed node, in canvas coordinates. */
interface ElkNodeRect {
    readonly cx: number;
    readonly cy: number;
    readonly w: number;
    readonly h: number;
}
/** What `computeLayout` threads to `onPositionsApplied` when routing is on. */
interface ElkRouteMeta {
    readonly edges: ElkExtendedEdge[];
    readonly rects: ReadonlyMap<string, ElkNodeRect>;
    /** Edges withheld from ELK, routed by {@link routeFeedbackEdges} instead. */
    readonly feedbackIds: readonly string[];
}

export { type ElkAlgorithmName, type ElkDirection, ElkLayout, type ElkLayoutOptions, type ElkPadding, type NodeSize };
