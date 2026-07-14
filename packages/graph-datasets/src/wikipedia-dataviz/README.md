# Wikipedia data-visualization cartography

A **property graph** cartography of ~2,000 Wikipedia pages around data
visualization, connected by the hyperlinks between them — the flagship
[sigma.js](https://www.sigmajs.org) demo graph
([`packages/demo`](https://github.com/jacomyal/sigma.js/tree/main/packages/demo)),
re-authored here in this package's property-graph shape.

Ships on its own subpath (the graph is ~1.1 MB, kept out of the main bundle):

```ts
import { wikipediaDataViz } from '@invana/graph-datasets/wikipedia-dataviz';
```

## Shape

A **single-mode network**: every vertex is a Wikipedia page, discriminated by
its `tag` (`label`); every edge is one directed `links_to` hyperlink. Authored
directly in this package's property-graph shape — `{ id, label, properties }`
vertices and `{ id, label, source, target, properties }` edges.
`wikipedia-dataviz.json` is the serialisation; `index.ts` is a thin typed view
(no runtime reshaping).

Every page shares one property shape: `name`, `url`, `cluster` (+ denormalised
`clusterLabel`), precomputed ForceAtlas2 `x`/`y`, and a PageRank-like `score`.

| Vertex `label` | Count | | Vertex `label` | Count |
|---|--:|---|---|--:|
| `unknown` | 1,194 | | `Technology` | 81 |
| `Field` | 223 | | `Tool` | 29 |
| `Concept` | 218 | | `Person` | 18 |
| `Method` | 212 | | `List` | 7 |
| `Chart type` | 99 | | `Organization` | 3 |
| | | | `Company` | 1 |

| Edge `label` | Count | From → To | Properties |
|---|--:|---|---|
| `links_to` | 5,409 | page → page (directed) | — |

The 24 community-detected topic **clusters** (colour + label — e.g. "Graph
theory", "Business intelligence") and the 11 **tag** icon-asset names ride on
`meta.clusters` / `meta.tags`, since they describe the whole graph rather than
any single vertex. The graph's meta-graph (vertex/edge kinds, property types,
endpoint pairs) is derived by the generator into `meta.schema`.

## Consuming in a story

`@invana/graph`'s `GraphNode` / `GraphEdge` use `type` / `data`, so map at
`setData` time:

```ts
graph.setData({
  nodes: wikipediaDataViz.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
  edges: wikipediaDataViz.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
});
```

The dataset ships **precomputed positions** — feed `data.x` / `data.y` to a
one-shot positions layout to reproduce the exact sigma cartography, colour by
`data.clusterLabel` (or the `meta.clusters` palette), and size by `data.score`.

## Regenerating

The raw upstream `dataset.json` is **not** stored in the repo. Refresh the
derived JSON by re-fetching and rebuilding:

```bash
node scripts/prepare-wikipedia-dataviz.mjs   # from packages/graph-datasets
```

The script is idempotent (no timestamps → stable diffs).
