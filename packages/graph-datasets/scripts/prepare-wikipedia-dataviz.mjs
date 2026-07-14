// Build the "Wikipedia data-visualization cartography" property-graph dataset
// from sigma.js's flagship demo data — a cartography of ~2,000 Wikipedia pages
// around data visualization, hyperlink-connected, tagged by kind, coloured by
// community-detected topic cluster, and laid out with ForceAtlas2.
// (https://www.sigmajs.org — packages/demo/public/dataset.json)
//
// The upstream `dataset.json` is shaped for sigma's renderer (`key` ids, a
// `tag`-per-node, `[source, target]` edge tuples, sidecar `clusters` / `tags`
// registries). This script fetches it **at author time**, reshapes it once into
// this package's property-graph contract, derives the graph schema, and writes
// only the result to `src/wikipedia-dataviz/wikipedia-dataviz.json`. The raw
// source is never stored in the repo — re-run this script to refresh.
//
// The mapping, once, here (never at runtime):
//   node.key                 → id
//   node.tag                 → label   (the entity-kind discriminator)
//   node.label               → properties.name
//   node.URL/cluster/x/y/... → properties.{url, cluster, clusterLabel, x, y, score}
//   [source, target]         → edge { id, label:'links_to', source, target }
//
// Run via `node scripts/prepare-wikipedia-dataviz.mjs` from packages/graph-datasets.
// The script is idempotent (no timestamps in the output → stable diffs).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../src/wikipedia-dataviz');
const OUT_FILE = resolve(OUT_DIR, 'wikipedia-dataviz.json');

const SOURCE_SITE = 'https://www.sigmajs.org';
const SOURCE_REPO = 'https://github.com/jacomyal/sigma.js';
const DATASET_URL =
  'https://raw.githubusercontent.com/jacomyal/sigma.js/main/packages/demo/public/dataset.json';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.json();
}

const raw = await fetchJson(DATASET_URL);

// Sidecar registries carried through onto `meta` verbatim.
const clusters = raw.clusters; // [{ key, color, clusterLabel }]
const tags = raw.tags; //         [{ key, image }]

/** cluster key → human-readable topic label (for denormalising onto nodes). */
const clusterLabel = new Map(clusters.map((c) => [c.key, c.clusterLabel]));

// ── Nodes: one Wikipedia page each, discriminated by its `tag` ────────────
const nodes = raw.nodes.map((n) => ({
  id: n.key,
  label: n.tag ?? 'unknown',
  properties: {
    name: n.label,
    url: n.URL,
    cluster: n.cluster,
    clusterLabel: clusterLabel.get(n.cluster) ?? null,
    x: n.x,
    y: n.y,
    score: n.score,
  },
}));

const idSet = new Set(nodes.map((n) => n.id));

// ── Edges: directed `links_to` hyperlinks ────────────────────────────────
// Drop dangling endpoints and self-loops, dedupe on `source|target`, then
// assign stable `e0…` ids (order-preserving → stable diffs).
const seen = new Set();
const edges = [];
for (const [source, target] of raw.edges) {
  if (source === target) continue;
  if (!idSet.has(source) || !idSet.has(target)) continue;
  const key = `${source}|${target}`;
  if (seen.has(key)) continue;
  seen.add(key);
  edges.push({
    id: `e${edges.length}`,
    label: 'links_to',
    source,
    target,
    properties: {},
  });
}

// ── Derive the graph schema (meta-graph / ontology) ──────────────────────
// Introspect the emitted nodes/edges so the schema can never drift from the
// data: per vertex/relation kind we record its count, the primitive type of
// each property (unioned across records → e.g. `string | null`), and — for
// edges — the observed `{ source, target }` endpoint label-pairs.

/** Relation labels whose direction is not meaningful (symmetric networks). */
const UNDIRECTED = new Set();

/** Compact primitive type name for a JSON value. */
const typeOf = (value) =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

/** Sorted type union with `null` kept last for readability (`string | null`). */
const unionType = (set) => {
  const rest = [...set].filter((t) => t !== 'null').sort();
  return [...rest, ...(set.has('null') ? ['null'] : [])].join(' | ');
};

/** Accumulate `{ key → Set<typeString> }` for one record's property bag. */
const collectProps = (props, into) => {
  for (const [k, v] of Object.entries(props)) {
    if (!into.has(k)) into.set(k, new Set());
    into.get(k).add(typeOf(v));
  }
};

/** Materialise a `{ key → Set }` map into a `{ key: "type union" }` object. */
const propTypes = (map) =>
  Object.fromEntries([...map].map(([k, set]) => [k, unionType(set)]));

const labelOf = new Map(nodes.map((n) => [n.id, n.label])); // id → vertex label

const nodeAgg = new Map(); // label → { count, props }
for (const n of nodes) {
  if (!nodeAgg.has(n.label)) nodeAgg.set(n.label, { count: 0, props: new Map() });
  const a = nodeAgg.get(n.label);
  a.count += 1;
  collectProps(n.properties, a.props);
}

const edgeAgg = new Map(); // label → { count, endpoints, props }
for (const e of edges) {
  if (!edgeAgg.has(e.label)) edgeAgg.set(e.label, { count: 0, endpoints: new Set(), props: new Map() });
  const a = edgeAgg.get(e.label);
  a.count += 1;
  a.endpoints.add(`${labelOf.get(e.source)}>${labelOf.get(e.target)}`);
  collectProps(e.properties, a.props);
}

const schema = {
  nodeTypes: [...nodeAgg]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, a]) => ({
      label,
      count: a.count,
      properties: propTypes(a.props),
    })),
  edgeTypes: [...edgeAgg].map(([label, a]) => ({
    label,
    count: a.count,
    directed: !UNDIRECTED.has(label),
    endpoints: [...a.endpoints].sort().map((pair) => {
      const [source, target] = pair.split('>');
      return { source, target };
    }),
    properties: propTypes(a.props),
  })),
};

// ── Emit ─────────────────────────────────────────────────────────────────
const out = {
  meta: {
    name: 'Wikipedia Data-Visualization Cartography',
    description:
      'A cartography of ~2,000 Wikipedia pages around data visualization — the ' +
      'flagship sigma.js demo graph. Pages are the sole vertex kind, discriminated ' +
      'by their `tag` (Tool, Person, Field, Chart type, Concept, Method, Company, ' +
      'Organization, Technology, List, unknown) and connected by directed ' +
      '`links_to` hyperlinks. Each page carries its ForceAtlas2 position (x/y), a ' +
      'PageRank-like `score`, and its community-detected topic `cluster`; the ' +
      'cluster colour/label registry and the tag icon-asset registry ride on `meta`.',
    source: SOURCE_SITE,
    sourceRepo: SOURCE_REPO,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    clusters,
    tags,
    schema,
  },
  nodes,
  edges,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(out));

const byLabel = (arr) =>
  Object.entries(
    arr.reduce((acc, x) => ((acc[x.label] = (acc[x.label] ?? 0) + 1), acc), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
console.log(`Wrote wikipedia-dataviz.json — ${nodes.length} nodes, ${edges.length} edges`);
console.log(`  node labels → ${byLabel(nodes)}`);
console.log(`  clusters → ${clusters.length}, tags → ${tags.length}`);
