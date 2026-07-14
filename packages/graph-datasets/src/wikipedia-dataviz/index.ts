/**
 * **Wikipedia Data-Visualization Cartography** — a cartography of ~2,000
 * Wikipedia pages around data visualization, connected by the hyperlinks
 * between them. This is the flagship [sigma.js](https://www.sigmajs.org) demo
 * graph ([`packages/demo`](https://github.com/jacomyal/sigma.js/tree/main/packages/demo)),
 * re-authored here in this package's property-graph shape.
 *
 * A **single-mode network**: every vertex is a Wikipedia page, discriminated by
 * its {@link WdvNodeLabel} `tag` (`Tool`, `Person`, `Field`, `Chart type`,
 * `Concept`, `Method`, `Company`, `Organization`, `Technology`, `List`,
 * `unknown`), and every edge is one directed `links_to` hyperlink. Each page
 * carries its precomputed **ForceAtlas2 position** (`x` / `y` — the "cartography"),
 * a PageRank-like importance `score`, and its **community-detected topic
 * `cluster`** (denormalised `clusterLabel` alongside the raw key).
 *
 * The 24 topic clusters (colour + label) and the 11 tag icon-asset names ride on
 * {@link WdvMeta} as {@link WdvMeta.clusters} / {@link WdvMeta.tags} registries —
 * they describe the whole graph, not any single vertex, so they don't belong in a
 * node's property bag.
 *
 * `./wikipedia-dataviz.json` is authored **directly** in this contract — vertices
 * are `{ id, label, properties }`, edges are `{ id, label, source, target,
 * properties }` — so this module is a thin typed view over it, not a translator.
 * The interfaces below ARE the on-disk contract; the JSON is its serialisation.
 * Regenerate it offline with `node scripts/prepare-wikipedia-dataviz.mjs` (the raw
 * upstream `dataset.json` is never stored).
 *
 * The graph is large (~1.1 MB), so it ships on its **own subpath entry**
 * (`@invana/graph-datasets/wikipedia-dataviz`) to keep the main bundle lean.
 *
 * `label` / `properties` don't match `@invana/graph`'s `GraphNode`
 * (`type` / `data`) one-to-one, so a consuming story maps `label → type` and
 * `properties → data` at `setData` time.
 *
 * @example
 * import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
 * graphLayer.setData({
 *   nodes: wikipediaDataViz.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
 *   edges: wikipediaDataViz.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
 * });
 */

import raw from './wikipedia-dataviz.json';

/**
 * Vertex label — the entity kind, taken verbatim from sigma's per-node `tag`.
 * Drives shape + palette downstream; each has an icon asset in {@link WdvMeta.tags}.
 */
export type WdvNodeLabel =
  | 'Chart type'
  | 'Company'
  | 'Concept'
  | 'Field'
  | 'List'
  | 'Method'
  | 'Organization'
  | 'Person'
  | 'Technology'
  | 'Tool'
  | 'unknown';

/** Edge label — the sole relation kind: a directed Wikipedia hyperlink. */
export type WdvEdgeLabel = 'links_to';

/**
 * A Wikipedia page. Every vertex shares this shape regardless of its
 * {@link WdvNodeLabel} — the label is the only thing that varies.
 */
export interface WdvPageProperties {
  /** Display title of the page (`Cytoscape`, `Radar chart`, …). */
  readonly name: string;
  /** Canonical Wikipedia article URL. */
  readonly url: string;
  /** Community-detected topic cluster key — see {@link WdvClusterMeta}. */
  readonly cluster: string;
  /** Denormalised {@link WdvClusterMeta.clusterLabel}, or `null` if unmapped. */
  readonly clusterLabel: string | null;
  /** Precomputed ForceAtlas2 x-coordinate (the source cartography). */
  readonly x: number;
  /** Precomputed ForceAtlas2 y-coordinate. */
  readonly y: number;
  /** PageRank-like importance in `[0, 1]` — good for node sizing. */
  readonly score: number;
}

/** Node property bag. Single-mode graph → one shape for every vertex kind. */
export type WdvNodeProperties = WdvPageProperties;

/** Edge property bag — hyperlinks carry no attributes. */
export type WdvEdgeProperties = Record<string, never>;

/** A Wikipedia page as a property-graph vertex: `{ id, label, properties }`. */
export interface WdvNode {
  readonly id: string;
  readonly label: WdvNodeLabel;
  readonly properties: WdvNodeProperties;
}

/** A hyperlink as a property-graph edge: `{ id, label, source, target, properties }`. */
export interface WdvEdge {
  readonly id: string;
  readonly label: WdvEdgeLabel;
  readonly source: string;
  readonly target: string;
  readonly properties: WdvEdgeProperties;
}

/** One community-detected topic cluster — its colour and human label. */
export interface WdvClusterMeta {
  /** Cluster key, matching {@link WdvPageProperties.cluster}. */
  readonly key: string;
  /** Hex swatch used by the source viz for members of this cluster. */
  readonly color: string;
  /** Topic label (`Graph theory`, `Business intelligence`, …). */
  readonly clusterLabel: string;
}

/** One tag kind — its key ({@link WdvNodeLabel}) and sigma's icon-asset filename. */
export interface WdvTagMeta {
  /** Tag key — equals a {@link WdvNodeLabel}. */
  readonly key: WdvNodeLabel;
  /** SVG icon asset name from the source demo (`tool.svg`, `person.svg`, …). */
  readonly image: string;
}

/** One vertex kind in the {@link WdvSchema} — its label, tally, and property types. */
export interface WdvNodeTypeSchema {
  readonly label: WdvNodeLabel;
  /** Number of vertices carrying this label. */
  readonly count: number;
  /**
   * Property key → primitive type string, unioned across every vertex of this
   * kind (`'string'`, `'number'`, `'string | null'`, …).
   */
  readonly properties: Readonly<Record<string, string>>;
}

/** A permitted `{ source → target }` vertex pairing for a relation kind. */
export interface WdvEndpointSchema {
  readonly source: WdvNodeLabel;
  readonly target: WdvNodeLabel;
}

/** One relation kind in the {@link WdvSchema} — its endpoints, tally, and property types. */
export interface WdvEdgeTypeSchema {
  readonly label: WdvEdgeLabel;
  /** Number of edges carrying this label. */
  readonly count: number;
  /** `true` — hyperlinks are directional. */
  readonly directed: boolean;
  /** Every `{ source, target }` label-pair observed for this relation. */
  readonly endpoints: readonly WdvEndpointSchema[];
  /** Property key → primitive type string; `{}` for `links_to`. */
  readonly properties: Readonly<Record<string, string>>;
}

/**
 * The graph schema (meta-graph / ontology) — the vertex and relation kinds the
 * dataset contains, each with counts, property types, and (for edges) endpoint
 * constraints. Derived by the generator from the emitted data, so it always
 * matches {@link WikipediaDataVizData.nodes} / `.edges`.
 */
export interface WdvSchema {
  readonly nodeTypes: readonly WdvNodeTypeSchema[];
  readonly edgeTypes: readonly WdvEdgeTypeSchema[];
}

/** Self-describing provenance, counts, and sidecar registries baked into the JSON. */
export interface WdvMeta {
  readonly name: string;
  readonly description: string;
  /** The site that publishes the underlying demo (sigma.js). */
  readonly source: string;
  /** The GitHub repo the raw dataset is fetched from. */
  readonly sourceRepo: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  /** The 24 community-detected topic clusters — colour + label per key. */
  readonly clusters: readonly WdvClusterMeta[];
  /** The 11 tag kinds — each {@link WdvNodeLabel} with its source icon asset. */
  readonly tags: readonly WdvTagMeta[];
  /** The graph's meta-graph — vertex/relation kinds, their property types + endpoints. */
  readonly schema: WdvSchema;
}

/** The full dataset: provenance + registries + the property graph. */
export interface WikipediaDataVizData {
  readonly meta: WdvMeta;
  readonly nodes: readonly WdvNode[];
  readonly edges: readonly WdvEdge[];
}

// The JSON is already valid `WikipediaDataVizData`; the cast only narrows the
// string-literal unions (`label`) that JSON import widens to `string`.
// No per-record reshaping.
export const wikipediaDataViz = raw as unknown as WikipediaDataVizData;
