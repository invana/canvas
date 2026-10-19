// src/topic-cartography/generator.ts
var CLUSTER_SPECS = [
  { label: "Graph theory", color: "#e15759" },
  { label: "Cartography", color: "#4e79a7" },
  { label: "Statistical inference", color: "#59a14f" },
  { label: "Perception studies", color: "#f28e2b" },
  { label: "Colour science", color: "#b07aa1" },
  { label: "Interaction design", color: "#76b7b2" },
  { label: "Scientific illustration", color: "#edc948" },
  { label: "Data journalism", color: "#ff9da7" },
  { label: "Network analysis", color: "#9c755f" },
  { label: "Geospatial systems", color: "#bab0ac" },
  { label: "Time-series analysis", color: "#86bcb6" },
  { label: "Dimensionality reduction", color: "#d37295" },
  { label: "Typography", color: "#8cd17d" },
  { label: "Rendering pipelines", color: "#a0cbe8" },
  { label: "Signal processing", color: "#f1ce63" },
  { label: "Information retrieval", color: "#fabfd2" },
  { label: "Simulation methods", color: "#b6992d" },
  { label: "Uncertainty visualisation", color: "#499894" },
  { label: "Accessibility", color: "#ffbe7d" },
  { label: "Semiotics", color: "#79706e" },
  { label: "Computational geometry", color: "#d7b5a6" },
  { label: "Survey methodology", color: "#59a14f" },
  { label: "Archival practice", color: "#e15759" },
  { label: "Pedagogy", color: "#4e79a7" }
];
var TAG_WEIGHTS = [
  { key: "unknown", weight: 1194 },
  { key: "Field", weight: 223 },
  { key: "Concept", weight: 218 },
  { key: "Method", weight: 212 },
  { key: "Chart type", weight: 99 },
  { key: "Technology", weight: 81 },
  { key: "Tool", weight: 29 },
  { key: "Person", weight: 18 },
  { key: "List", weight: 7 },
  { key: "Organization", weight: 3 },
  { key: "Company", weight: 1 }
];
var TITLE_HEADS = [
  "Adaptive",
  "Bilinear",
  "Categorical",
  "Directed",
  "Elastic",
  "Faceted",
  "Gaussian",
  "Hierarchical",
  "Isometric",
  "Kernel",
  "Layered",
  "Marginal",
  "Nested",
  "Ordinal",
  "Parametric",
  "Quantile",
  "Radial",
  "Sparse",
  "Temporal",
  "Uniform",
  "Variadic",
  "Weighted",
  "Zonal",
  "Stochastic",
  "Discrete",
  "Continuous",
  "Nonlinear",
  "Recursive"
];
var TITLE_TAILS = [
  "projection",
  "embedding",
  "histogram",
  "partition",
  "traversal",
  "smoothing",
  "encoding",
  "estimator",
  "lattice",
  "manifold",
  "residual",
  "clustering",
  "atlas",
  "gradient",
  "topology",
  "sampling",
  "index",
  "basis",
  "transform",
  "decomposition",
  "hierarchy",
  "kernel",
  "contour",
  "cartogram",
  "linkage"
];
function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick(rng, xs) {
  return xs[Math.floor(rng() * xs.length)];
}
function gaussian(rng) {
  const u = Math.max(rng(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}
var DEFAULTS = {
  pages: 2083,
  links: 5409,
  clusters: 24,
  intraClusterRatio: 0.85,
  seed: 20
};
var MAP_RADIUS = 900;
var CLUSTER_SPREAD = 78;
function generateTopicCartography(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const rng = mulberry32(o.seed);
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const clusters = Array.from({ length: o.clusters }, (_, i) => {
    const spec = CLUSTER_SPECS[i % CLUSTER_SPECS.length];
    const t = (i + 0.5) / o.clusters;
    const r = MAP_RADIUS * Math.sqrt(t);
    const a = i * GOLDEN_ANGLE;
    return {
      key: `cluster-${i}`,
      label: spec.label,
      color: spec.color,
      cx: r * Math.cos(a),
      cy: r * Math.sin(a)
    };
  });
  const totalWeight = TAG_WEIGHTS.reduce((s, t) => s + t.weight, 0);
  const tagFor = (i) => {
    const target = (i + 0.5) / o.pages * totalWeight;
    let acc = 0;
    for (const t of TAG_WEIGHTS) {
      acc += t.weight;
      if (target <= acc) return t.key;
    }
    return TAG_WEIGHTS[0].key;
  };
  const nodes = [];
  const byCluster = Array.from({ length: o.clusters }, () => []);
  const usedNames = /* @__PURE__ */ new Set();
  for (let i = 0; i < o.pages; i++) {
    const id = `page-${i}`;
    const clusterIdx = Math.floor(rng() * o.clusters);
    const cluster = clusters[clusterIdx];
    let name = "";
    do {
      name = `${pick(rng, TITLE_HEADS)} ${pick(rng, TITLE_TAILS)}`;
      if (usedNames.has(name)) name = `${name} (${i})`;
    } while (usedNames.has(name));
    usedNames.add(name);
    byCluster[clusterIdx].push(id);
    nodes.push({
      id,
      type: tagFor(i),
      data: {
        name,
        // `.invalid` is reserved by RFC 2606 and can never resolve — so a reader
        // who follows one of these links learns immediately that it is fictional.
        url: `https://atlas.invalid/wiki/${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        cluster: cluster.key,
        clusterLabel: cluster.label,
        x: cluster.cx + gaussian(rng) * CLUSTER_SPREAD,
        y: cluster.cy + gaussian(rng) * CLUSTER_SPREAD,
        score: 0
        // filled from in-degree once the links exist
      }
    });
  }
  const edges = [];
  const seen = /* @__PURE__ */ new Set();
  const inDegree = /* @__PURE__ */ new Map();
  let guard = 0;
  while (edges.length < o.links && guard < o.links * 40) {
    guard++;
    const clusterIdx = Math.floor(rng() * o.clusters);
    const bucket = byCluster[clusterIdx];
    if (bucket.length < 2) continue;
    const source = pick(rng, bucket);
    const target = rng() < o.intraClusterRatio ? pick(rng, bucket) : `page-${Math.floor(rng() * o.pages)}`;
    if (source === target) continue;
    const key = `${source}>${target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ id: `e${edges.length}`, type: "links_to", source, target, data: {} });
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
  }
  const maxIn = Math.max(1, ...inDegree.values());
  for (const n of nodes) {
    n.data.score = Number(((inDegree.get(n.id) ?? 0) / maxIn).toFixed(4));
  }
  return {
    meta: {
      name: "Topic Cartography",
      description: "A fully synthetic knowledge-base link graph \u2014 invented topic pages across community clusters, shipped with a precomputed cartographic layout.",
      source: "Generated by @invana/graph-datasets \u2014 no external data.",
      sourceRepo: "",
      nodeCount: nodes.length,
      edgeCount: edges.length,
      clusters: clusters.map((c) => ({ key: c.key, color: c.color, label: c.label })),
      tags: TAG_WEIGHTS.map((t) => ({ key: t.key, label: t.key }))
    },
    nodes,
    edges
  };
}

// src/topic-cartography/data.ts
var topicCartography = generateTopicCartography();
var data = topicCartography;
var settings = {
  activeLayout: "",
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: "circle", radius: 3 },
          bgStrokeWidth: 0,
          showLabel: false
        }
      },
      edge: {
        style: {
          strokeColor: 9741240,
          strokeWidth: 0.4,
          strokeAlpha: 0.2,
          arrowTargetShape: "none"
        }
      }
    }
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: {
      enabled: true,
      state: "highlighted",
      inactiveState: "dimmed",
      degree: 1,
      direction: "both"
    }
  }
};

export { data, generateTopicCartography, topicCartography, settings as topicCartographySettings };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map