import { SubgraphLayoutOptions, SubgraphPositionLayout, LayoutSubgraph, LayoutPositions, GraphLayer } from '@invana/graph';
import { HierarchyNode } from 'd3-hierarchy';

/**
 * Layout mode.
 *
 * - `'tree'` — `d3.tree()` tidy layout, Cartesian (x, y) positions.
 * - `'cluster'` — `d3.cluster()` dendrogram (leaves aligned), Cartesian positions.
 * - `'radial-tree'` — `d3.tree()` projected to polar coordinates.
 * - `'radial-cluster'` — `d3.cluster()` projected to polar coordinates.
 * - `'pack'` — `d3.pack()` enclosure layout. Each node is sized by the
 *   accumulated `value` and positioned so children are packed inside the
 *   parent's circle. The layout also writes per-node sizes onto each node
 *   (`data.size = 2 * r`), so the renderer can draw the correct circle
 *   diameter; this is unique to pack and is why it needs `value`.
 * - `'sunburst'` — `d3.partition()` over polar coordinates. Each node becomes
 *   an annular sector; positions all collapse to `(center.x, center.y)` and
 *   the per-node shape (innerR / outerR / startAngle / endAngle) is written
 *   onto `data` so the renderer can paint it as an `'arc'` shape. Sized off
 *   the accumulated `value` like pack. Ring radii grow with `sqrt(y)` so
 *   every ring covers an area proportional to its summed leaves — the
 *   convention d3's example uses.
 */
type D3HierarchyLayoutMode = 'tree' | 'cluster' | 'radial-tree' | 'radial-cluster' | 'pack' | 'sunburst';
/**
 * Per-pair separation accessor — passed straight through to d3's
 * `.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.
 */
type SeparationFn = (a: HierarchyNode<{
    id: string;
}>, b: HierarchyNode<{
    id: string;
}>) => number;
/**
 * Cartesian-mode orientation.
 *
 * - `'vertical'` (default) — depth axis runs top-to-bottom; root at top,
 *   leaves at bottom. Pairs naturally with `pathType: 'bezier'` (axis 'auto'
 *   picks vertical) or `pathType: 'smooth'`.
 * - `'horizontal'` — depth axis runs left-to-right; root on the left,
 *   leaves aligned on the right. Matches the d3 cluster / tidy-tree
 *   examples. Pairs with `pathType: 'bezier'` (axis 'auto' picks horizontal).
 *
 * Ignored in `radial-*` modes.
 */
type CartesianOrientation = 'vertical' | 'horizontal';
/**
 * `D3HierarchyLayout` options.
 *
 * **All options default to `undefined`.** Only `mode` has an internal default
 * (`'radial-tree'`). Anything you omit falls through to d3-hierarchy's own
 * defaults — no setter is called when you don't provide a value.
 *
 * Extends {@link OneShotLayoutOptions}, so it also accepts `id` / `targetLayerId`
 * (for registry / `config.activeLayout` wiring) and `transition` /
 * `transitionEase` (glide nodes to the computed layout instead of snapping —
 * vetoed for `pack` / `sunburst`, which replace node geometry rather than move it).
 */
interface D3HierarchyLayoutOptions extends SubgraphLayoutOptions {
    /** Layout mode. Default `'radial-tree'`. */
    mode?: D3HierarchyLayoutMode;
    /**
     * Explicit root node id. If omitted, the layout auto-detects the root as
     * the unique node with no incoming edge in the snapshot. Throws if there
     * is none or more than one.
     */
    rootId?: string;
    /**
     * `tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes default
     * to `[640, 480]` if neither `size` nor `nodeSize` is provided.
     *
     * For radial modes, the underlying d3 layout uses `[2π, radius]` —
     * configure the polar layout with `radius` (and optionally `nodeSize` for
     * per-node angular spacing) instead.
     */
    size?: [number, number];
    /**
     * `tree.nodeSize([dx, dy])` / `cluster.nodeSize([dx, dy])`. Mutually
     * exclusive with `size`.
     */
    nodeSize?: [number, number];
    /**
     * Polar radius for `radial-*` modes. Default `400`. Ignored for Cartesian
     * modes.
     */
    radius?: number;
    /**
     * Cartesian orientation. Default `'vertical'`. See {@link CartesianOrientation}.
     * Ignored in `radial-*` modes.
     */
    orientation?: CartesianOrientation;
    /** Custom separation function. See d3-hierarchy `tree.separation`. */
    separation?: SeparationFn;
    /**
     * Translate the projected coordinates by `(x, y)` after layout. Default
     * `{ x: 0, y: 0 }`. Useful for centring the cluster around the world
     * origin in radial modes (the default already does this).
     */
    center?: {
        x?: number;
        y?: number;
    };
    /**
     * Pack-only: padding between sibling circles, in world units. Default `0`
     * (d3's default). Ignored in non-pack modes.
     */
    padding?: number;
    /**
     * Pack-only: per-node value accessor used by `hierarchy.sum()`. Defaults
     * to reading `node.data.value` (treats missing as `1`). The accumulated
     * sum drives each circle's radius. Ignored in non-pack modes.
     *
     * Note: the input is the raw `GraphNode<unknown>`, not the d3 hierarchy
     * node. Cast `data` if you know its shape.
     */
    value?: (node: {
        id: string;
        data?: unknown;
    }) => number;
    /**
     * Pack-only: sibling sort comparator. Defaults to `(a, b) => b.value - a.value`
     * (descending by value, which gives a tighter pack). Set to `null` to
     * leave d3's input order. Ignored in non-pack modes.
     */
    sort?: ((a: {
        value?: number;
    }, b: {
        value?: number;
    }) => number) | null;
}

/**
 * `D3HierarchyLayout` — `Layout` for `@invana/graph` that wraps
 * `d3-hierarchy`'s `tree()` / `cluster()` / `pack()` algorithms (with optional
 * polar projection for radial variants).
 *
 * One-shot synchronous: `apply()` snapshots the store, computes positions in
 * a single pass, bulk-writes them back, emits `start` → `tick` → `end`, and
 * resolves. There is no tick loop — radial / tidy / pack layouts all have a
 * closed-form solution.
 *
 * Tree topology is derived from edges. Each `edge.source → edge.target` is
 * read as "source is parent of target". The snapshot must form a single
 * tree (one root, every non-root has exactly one parent, no cycles); the
 * layout throws otherwise.
 *
 * Pack mode is special: in addition to writing positions, it writes a
 * per-node `data.size = 2 * r` so the renderer can draw each node at the
 * pack-computed diameter. The other modes leave node sizes alone.
 *
 * @example
 * const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400 });
 * await layout.apply(graphLayer);
 */

/** Pack-only: per-node circle diameter the layout assigns, applied post-position. */
type SizeMap = Map<string, number>;
/** Sunburst-only: per-node arc params, applied post-position. */
type ArcMap = Map<string, {
    innerR: number;
    outerR: number;
    startAngle: number;
    endAngle: number;
}>;
/** Per-run geometry threaded from `computeLayout` to `onPositionsApplied`. */
interface HierarchyMeta {
    sizes: SizeMap | null;
    arcs: ArcMap | null;
}
declare class D3HierarchyLayout extends SubgraphPositionLayout<D3HierarchyLayoutOptions> {
    readonly kind = "d3-hierarchy-layout";
    /**
     * `pack` / `sunburst` replace node *geometry* (circle sizes / arc sectors)
     * rather than move nodes, so tweening their positions would look wrong — snap
     * those. Position modes (tree / cluster / radial-*) honour `transition`.
     */
    protected shouldTransition(): boolean;
    /**
     * `pack` / `sunburst` can't be run per group: their real output is the
     * per-node geometry threaded through the run's `meta` (circle radii, arc
     * sectors), and there is no meaningful way to merge that across one run per
     * group. They fall back to a single flat run — an `autoFit` frame still wraps
     * whatever its members occupy, it just isn't packed into a box.
     */
    protected canRecurseGroups(): boolean;
    /**
     * Compute positions for one subgraph — the whole graph for a flat run, or a
     * single group's members when `includeGroups` nests them. The base writes the
     * result (snap or tween), then calls {@link onPositionsApplied} to flush any
     * pack / sunburst geometry. Lifecycle (`start` → `tick` → `end`) is the base's.
     */
    protected computeSubgraphLayout(sub: LayoutSubgraph): LayoutPositions<HierarchyMeta> | null;
    /**
     * Flush pack circle sizes / sunburst arc geometry onto `style.shape` once the
     * node positions have settled. Each in its own store batch so the renderer
     * sees a single coalesced flush. No-op for the position-only modes.
     */
    protected onPositionsApplied(layer: GraphLayer, meta: unknown): void;
    /**
     * Find the tree's root, validating that the snapshot is a tree at all.
     *
     * `groupId` names the group whose members are being laid out, when this run is
     * one level of a `includeGroups` recursion. It only affects the error text —
     * but it's the difference between "your graph isn't a tree" and "*this* group
     * isn't a subtree", and the latter is the only one a caller can act on.
     *
     * Failing loudly is deliberate. A group whose members don't form a subtree
     * has no tidy-tree solution, and quietly falling back to some other
     * arrangement inside one box — while every other box is a tree — produces a
     * picture whose inconsistency is much harder to diagnose than an error naming
     * the group.
     */
    private resolveRoot;
    /** The parentless node, if there is exactly one. See {@link resolveRoot}. */
    private findSingleRoot;
}

export { type CartesianOrientation, D3HierarchyLayout, type D3HierarchyLayoutMode, type D3HierarchyLayoutOptions, type SeparationFn };
