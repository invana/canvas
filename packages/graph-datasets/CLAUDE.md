# CLAUDE.md — packages/graph-datasets (`@invana/graph-datasets`)

Example graph datasets used by storybook stories and tests.

**Status:** skeleton. Datasets shipped: Les Misérables, random tree, Flare hierarchy. To port: Scientists org chart.

The Flare hierarchy is the canonical d3-hierarchy fixture (`d3/d3-hierarchy/test/data/flare.json`). Nested form lives in `flare.json`; the convenience flattener `flareAsGraph()` produces `{nodes, edges}` ready for `GraphLayer.setData`, with slash-joined-path ids and parent→child edges.

## Authoring convention — property-graph shape, no translators

**Every dataset is authored directly in the property-graph shape** (the same model Invana's Cypher / Gremlin connectors use). Don't invent a per-dataset record shape and don't ship a runtime mapper that reshapes foreign JSON.

```ts
interface DatasetNode<P = unknown> { id: string; label: string; properties: P; }
interface DatasetEdge<P = unknown> { id: string; label: string; source: string; target: string; properties: P; }
```

- **`label`** — the entity / relation kind (`'file'`, `'imports'`, `'company'`, …). This is the discriminator; per-dataset typed string-literal unions go here (e.g. `InvanaCodeNodeLabel`).
- **`properties`** — the attribute bag. Everything that isn't `id` / `label` / `source` / `target`.
- **`id`** is required on edges too. If the source has none, bake stable ids into the data (e.g. `e0`, `e1`, …) — don't synthesise them at runtime.

### JSON-backed datasets

Store the data in the JSON **already in the final node/edge shape**. The `.ts` module is then a thin typed view — `import raw … ; export const x = raw as unknown as XData;` — with **no `.map()` reshaping**. The exported interfaces ARE the on-disk contract; the JSON is its serialisation. If the upstream source is shaped differently, transform it **once, offline** when you author/refresh the file (a `scripts/` generator or a one-shot script), never on import. `invanaCodeKg` is the reference example; `cora` uses a build-time `scripts/prepare-cora.mjs` for the same reason.

### Consuming in a story

`@invana/graph`'s `GraphNode` / `GraphEdge` use `type` / `data`, not `label` / `properties`, so map at `setData` time — a one-liner, the only place a rename lives:

```ts
graph.setData({
  nodes: ds.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
  edges: ds.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
});
```

> Datasets predating this convention (`lesMiserables`, `flare`, `ontology`, `microservices`, `cora`, …) still use `{ id, data }` records. Migrate them to `{ id, label, properties }` when you next touch them.
