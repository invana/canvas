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

/** `ElkLayout` constructor options. See top-level module doc. */
export interface ElkLayoutOptions {
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
}
