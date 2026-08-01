/**
 * **Topic Cartography — the generator.**
 *
 * Builds a **fictional** knowledge-base link graph: ~2,000 topic pages of eleven
 * kinds, wired by directed `links_to` hyperlinks, each page carrying a
 * precomputed 2D position, a community cluster, and a PageRank-like importance
 * score. Every page name and cluster label is invented by this file — nothing is
 * scraped from, or derived from, any real encyclopedia.
 *
 * ### Why a generator and not a JSON
 *
 * This dataset exists to be the package's **cartography** fixture: a graph whose
 * *positions are the data*, so `activeLayout: ''` is the honest default and the
 * story is about reading a pre-laid-out map rather than solving one. That is a
 * property of the layout, not of any particular encyclopedia's contents — so it
 * reproduces synthetically at no licence cost and a fraction of the bytes
 * (~1.6 MB of JSON → a few KB of source).
 *
 * ### How the map gets its shape
 *
 * A real ForceAtlas2 run on a clustered link graph produces petals: dense blobs
 * around each community, arranged on a rough disc, with sparse long edges
 * between them. Rather than run a layout, the generator **places** that outcome
 * directly — cluster centroids on a golden-angle spiral, members scattered
 * around their centroid with a Gaussian falloff, and links drawn ~85 %
 * intra-cluster. The result is visually indistinguishable from a solved
 * cartography and is deterministic.
 *
 * Same `seed` → byte-identical graph. The PRNG is mulberry32, the same one
 * `twitter/generators.ts` uses.
 */

import type { GraphEdge, GraphNode } from '@invana/graph';

// ─── Content pools ───────────────────────────────────────────────────────────

/** Invented topic-cluster labels + their swatch, mirroring a community detection. */
const CLUSTER_SPECS: readonly { label: string; color: string }[] = [
  { label: 'Graph theory', color: '#e15759' },
  { label: 'Cartography', color: '#4e79a7' },
  { label: 'Statistical inference', color: '#59a14f' },
  { label: 'Perception studies', color: '#f28e2b' },
  { label: 'Colour science', color: '#b07aa1' },
  { label: 'Interaction design', color: '#76b7b2' },
  { label: 'Scientific illustration', color: '#edc948' },
  { label: 'Data journalism', color: '#ff9da7' },
  { label: 'Network analysis', color: '#9c755f' },
  { label: 'Geospatial systems', color: '#bab0ac' },
  { label: 'Time-series analysis', color: '#86bcb6' },
  { label: 'Dimensionality reduction', color: '#d37295' },
  { label: 'Typography', color: '#8cd17d' },
  { label: 'Rendering pipelines', color: '#a0cbe8' },
  { label: 'Signal processing', color: '#f1ce63' },
  { label: 'Information retrieval', color: '#fabfd2' },
  { label: 'Simulation methods', color: '#b6992d' },
  { label: 'Uncertainty visualisation', color: '#499894' },
  { label: 'Accessibility', color: '#ffbe7d' },
  { label: 'Semiotics', color: '#79706e' },
  { label: 'Computational geometry', color: '#d7b5a6' },
  { label: 'Survey methodology', color: '#59a14f' },
  { label: 'Archival practice', color: '#e15759' },
  { label: 'Pedagogy', color: '#4e79a7' },
];

/**
 * The eleven page kinds, with their share of the corpus.
 *
 * Weights reproduce the long-tailed mix a real crawl produces — a large
 * untagged bulk, a few sizeable taxonomic buckets, and a handful of rare kinds.
 * That skew is what makes colour-by-type interesting rather than uniform.
 */
const TAG_WEIGHTS: readonly { key: string; weight: number }[] = [
  { key: 'unknown', weight: 1194 },
  { key: 'Field', weight: 223 },
  { key: 'Concept', weight: 218 },
  { key: 'Method', weight: 212 },
  { key: 'Chart type', weight: 99 },
  { key: 'Technology', weight: 81 },
  { key: 'Tool', weight: 29 },
  { key: 'Person', weight: 18 },
  { key: 'List', weight: 7 },
  { key: 'Organization', weight: 3 },
  { key: 'Company', weight: 1 },
];

/** Leading words for invented page titles. */
const TITLE_HEADS = [
  'Adaptive', 'Bilinear', 'Categorical', 'Directed', 'Elastic', 'Faceted', 'Gaussian',
  'Hierarchical', 'Isometric', 'Kernel', 'Layered', 'Marginal', 'Nested', 'Ordinal',
  'Parametric', 'Quantile', 'Radial', 'Sparse', 'Temporal', 'Uniform', 'Variadic',
  'Weighted', 'Zonal', 'Stochastic', 'Discrete', 'Continuous', 'Nonlinear', 'Recursive',
];

/** Trailing nouns for invented page titles. */
const TITLE_TAILS = [
  'projection', 'embedding', 'histogram', 'partition', 'traversal', 'smoothing',
  'encoding', 'estimator', 'lattice', 'manifold', 'residual', 'clustering',
  'atlas', 'gradient', 'topology', 'sampling', 'index', 'basis', 'transform',
  'decomposition', 'hierarchy', 'kernel', 'contour', 'cartogram', 'linkage',
];

// ─── PRNG ────────────────────────────────────────────────────────────────────

/** Deterministic PRNG (mulberry32) — same seed, same graph. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `xs` uniformly. */
function pick<T>(rng: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

/** Standard-normal sample via Box–Muller — the cluster scatter's falloff. */
function gaussian(rng: () => number): number {
  const u = Math.max(rng(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

// ─── Options ─────────────────────────────────────────────────────────────────

/** Knobs for {@link generateTopicCartography}. Defaults reproduce the ~2k / ~5.4k graph. */
export interface TopicCartographyOptions {
  /** Pages in the corpus. Default `2083`. */
  pages?: number;
  /** Directed `links_to` hyperlinks. Default `5409`. */
  links?: number;
  /** Community clusters the map is organised into. Default `24`. */
  clusters?: number;
  /** Fraction of links that stay inside a cluster (0–1). Default `0.85`. */
  intraClusterRatio?: number;
  /** PRNG seed — same seed → same graph. Default `20`. */
  seed?: number;
}

/** Every option resolved to a concrete value. */
type Resolved = Required<TopicCartographyOptions>;

/** Defaults — a ~2,083-page corpus with 5,409 links across 24 clusters. */
const DEFAULTS: Resolved = {
  pages: 2083,
  links: 5409,
  clusters: 24,
  intraClusterRatio: 0.85,
  seed: 20,
};

/** Radius of the disc the cluster centroids are spread across, in world units. */
const MAP_RADIUS = 900;

/** Standard deviation of a cluster's member scatter, in world units. */
const CLUSTER_SPREAD = 78;

// ─── Local record shapes ─────────────────────────────────────────────────────
//
// Unexported, per the package's "no per-dataset record types" rule.

/** A generated page vertex — positions and score are content, not decoration. */
type PageNode = GraphNode & {
  data: {
    name: string;
    url: string;
    cluster: string;
    clusterLabel: string | null;
    x: number;
    y: number;
    score: number;
  };
};

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Generate the full cartography graph.
 *
 * @param options — counts + seed; see {@link TopicCartographyOptions}.
 * @returns `{ meta, nodes, edges }` in the engine-ready shape `setData` takes.
 *
 * @example
 * const map = generateTopicCartography({ pages: 20_000, seed: 3 });
 */
export function generateTopicCartography(options: TopicCartographyOptions = {}) {
  const o: Resolved = { ...DEFAULTS, ...options };
  const rng = mulberry32(o.seed);

  // ── Clusters, placed on a golden-angle spiral ─────────────────────────────
  //
  // The spiral is what stops centroids from clumping: successive angles never
  // repeat a ratio, so 24 blobs spread evenly over the disc the way a settled
  // force layout arranges communities.
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const clusters = Array.from({ length: o.clusters }, (_, i) => {
    const spec = CLUSTER_SPECS[i % CLUSTER_SPECS.length]!;
    const t = (i + 0.5) / o.clusters;
    const r = MAP_RADIUS * Math.sqrt(t);
    const a = i * GOLDEN_ANGLE;
    return {
      key: `cluster-${i}`,
      label: spec.label,
      color: spec.color,
      cx: r * Math.cos(a),
      cy: r * Math.sin(a),
    };
  });

  // ── Tag pool, expanded from the weights ───────────────────────────────────
  const totalWeight = TAG_WEIGHTS.reduce((s, t) => s + t.weight, 0);
  const tagFor = (i: number): string => {
    // Deterministic stratified assignment — walk the cumulative weights by the
    // page's position in the corpus, so counts land on the intended mix exactly
    // rather than approaching it statistically.
    const target = ((i + 0.5) / o.pages) * totalWeight;
    let acc = 0;
    for (const t of TAG_WEIGHTS) {
      acc += t.weight;
      if (target <= acc) return t.key;
    }
    return TAG_WEIGHTS[0]!.key;
  };

  // ── Pages ─────────────────────────────────────────────────────────────────
  const nodes: PageNode[] = [];
  /** Page ids bucketed by cluster index — drives the intra-cluster link draw. */
  const byCluster: string[][] = Array.from({ length: o.clusters }, () => []);
  const usedNames = new Set<string>();

  for (let i = 0; i < o.pages; i++) {
    const id = `page-${i}`;
    const clusterIdx = Math.floor(rng() * o.clusters);
    const cluster = clusters[clusterIdx]!;

    let name = '';
    do {
      name = `${pick(rng, TITLE_HEADS)} ${pick(rng, TITLE_TAILS)}`;
      if (usedNames.has(name)) name = `${name} (${i})`;
    } while (usedNames.has(name));
    usedNames.add(name);

    byCluster[clusterIdx]!.push(id);
    nodes.push({
      id,
      type: tagFor(i),
      data: {
        name,
        // `.invalid` is reserved by RFC 2606 and can never resolve — so a reader
        // who follows one of these links learns immediately that it is fictional.
        url: `https://atlas.invalid/wiki/${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        cluster: cluster.key,
        clusterLabel: cluster.label,
        x: cluster.cx + gaussian(rng) * CLUSTER_SPREAD,
        y: cluster.cy + gaussian(rng) * CLUSTER_SPREAD,
        score: 0, // filled from in-degree once the links exist
      },
    });
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const inDegree = new Map<string, number>();

  let guard = 0;
  while (edges.length < o.links && guard < o.links * 40) {
    guard++;

    const clusterIdx = Math.floor(rng() * o.clusters);
    const bucket = byCluster[clusterIdx]!;
    if (bucket.length < 2) continue;

    const source = pick(rng, bucket);
    const target =
      rng() < o.intraClusterRatio
        ? pick(rng, bucket)
        : `page-${Math.floor(rng() * o.pages)}`;

    if (source === target) continue;
    const key = `${source}>${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    edges.push({ id: `e${edges.length}`, type: 'links_to', source, target, data: {} });
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
  }

  // ── Score, from in-degree ─────────────────────────────────────────────────
  //
  // A PageRank-like importance without running PageRank: normalised in-degree is
  // monotonic with it on a graph this sparse, and `score` is only ever read to
  // size a node.
  const maxIn = Math.max(1, ...inDegree.values());
  for (const n of nodes) {
    n.data.score = Number(((inDegree.get(n.id) ?? 0) / maxIn).toFixed(4));
  }

  return {
    meta: {
      name: 'Topic Cartography',
      description:
        'A fully synthetic knowledge-base link graph — invented topic pages across community clusters, shipped with a precomputed cartographic layout.',
      source: 'Generated by @invana/graph-datasets — no external data.',
      sourceRepo: '',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      clusters: clusters.map((c) => ({ key: c.key, color: c.color, label: c.label })),
      tags: TAG_WEIGHTS.map((t) => ({ key: t.key, label: t.key })),
    },
    nodes,
    edges,
  };
}
