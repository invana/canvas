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

import type { OneShotLayoutOptions } from '@invana/graph';
import type { GraphNode } from '@invana/graph';

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
export type ElkAlgorithmName =
  | 'layered'
  | 'mrtree'
  | 'radial'
  | 'force'
  | 'stress'
  | 'disco'
  | 'sporeOverlap'
  | 'sporeCompaction'
  | 'box'
  | 'rectpacking'
  | 'random'
  | 'fixed'
  | (string & {});

/** Direction of the primary layout axis. Mapped to `elk.direction`. */
export type ElkDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/** Symmetric or per-side padding around the graph. Mapped to `elk.padding`. */
export type ElkPadding =
  | number
  | { top?: number; right?: number; bottom?: number; left?: number };

/**
 * Resolved node bounding box, in canvas units. ELK needs concrete width +
 * height for every node to place them — `ElkLayout` derives these from the
 * resolved node style by default, but you can override per-node via
 * {@link ElkLayoutOptions.nodeSize}.
 */
export interface NodeSize {
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
export interface ElkLayoutOptions extends OneShotLayoutOptions {
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
