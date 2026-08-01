# graph-datasets — one folder, one module: `data` + `settings`

**Status:** 📋 draft plan, not started.
**Package:** `packages/graph-datasets` (`@invana/graph-datasets`).
**Predecessor:** commit `b3c0cb3` *"a dataset is a folder — data.ts + settings.ts"*, which
created the folder layout this plan finishes.

---

## 1. Goal

Make every dataset folder a **self-contained module with a fixed export contract**:

```
src/<dataset>/
├── data.ts       export const data: GraphData           ← the only value name
│                 export function <name>(opts): GraphData ← optional generator
├── settings.ts   export const settings: CanvasConfig      ← the only value name
├── index.ts      export * from './data'; export * from './settings';
└── <extras>.ts   hierarchy / topology / meta / traces — the non-graph payloads
```

consumed as:

```tsx
import { data, settings } from '@invana/graph-datasets/les-miserables';

<GraphCanvasApp data={data} config={settings} />
```

Today the *names* already exist (`b3c0cb3` added `data` + `settings` to all 24 folders), but
they are **second-class**: every `data.ts` also exports a legacy per-dataset value, and `data`
is a re-cast of it. This plan makes `data` the authored value, deletes the legacy surface,
and turns each folder into its own package entry point.

## 2. Where we are (as-built, verified)

| Fact | Detail |
|---|---|
| Dataset folders | **24** — 13 at `src/`, 11 under `src/usecase-demos/` |
| `data.ts` exporting `data: GraphData` | 24 / 24 ✅ |
| …of which are a laundered re-cast | **23 / 24** — `export const data: GraphData = <legacy> as unknown as GraphData` (only `air-routes` authors `data` directly) |
| `settings.ts` exporting `settings` | 24 / 24 ✅, typed `CanvasConfig` (a local alias of `@invana/canvas`'s `CanvasConfig`) |
| Public surface | flat aliased barrels — `src/index.ts` (`lesMiserables`, `lesMiserablesSettings`, …) + `src/usecase-demos/index.ts`, plus 2 subpath entries (`game-of-thrones`, `wikipedia-dataviz`) |
| `index.ts` inside a folder | 2 / 24 (only the two subpath datasets) |
| Consumers | **63 storybook files**, ~120 import sites; plus generated TypeDoc pages under `apps/docs/api/graph-datasets/` |

The `as unknown as GraphData` cast is load-bearing in two different ways, and only one of
them is benign:

- **Benign (21 datasets)** — the per-dataset interfaces mark record fields `readonly`
  (`readonly id: string`), and `GraphNode`/`GraphEdge` declare them mutable. A `readonly`
  field is not assignable to a mutable one, so the direct assignment fails and the double
  cast silences it. The runtime value is already correct.
- **Not benign (2 datasets)** — the cast hides a genuine shape mismatch (§5).

## 3. Decisions taken

| # | Decision | Consequence |
|---|---|---|
| D1 | **Per-dataset subpath imports** — `@invana/graph-datasets/<dataset>` resolves to `{ data, settings }` | uniform names, no aliasing, tree-shakes by construction; all 63 consumer files change |
| D2 | **Delete the legacy value exports** (`lesMiserables`, `cora`, `flareAsGraph`, …) | `data` is the only value; the laundering casts go with them. Breaking; storybook migrates in the same change |
| D3 | **Non-graph payloads get their own file in the folder** (`hierarchy.ts`, `topology.ts`, `meta.ts`, `traces.ts`) | `data.ts` stays strictly about the graph; d3-hierarchy / sankey / maplibre stories keep their inputs |
| D4 | **`data.ts` may also export a generator** — but it must be typed to return `GraphData` | the parameterised builders (`generateLattice`, `generateRandomTree`, `generateTwitterActivity`, `flareImportsAsGraph`) stay put; their bespoke `*GraphData` return types are replaced by `GraphData` |
| D5 | **Both halves use the engine's own types, imported directly** — `GraphData` from `@invana/graph`, `CanvasConfig` from `@invana/canvas` | no in-package aliases for either half |

## 4. Type layer — no `src/types.ts`

**Done (2026-08-01), and it went further than this section originally proposed.** `src/types.ts`
and both of its aliases (`CanvasData = GraphData`, `CanvasSettings = CanvasConfig`) are
**deleted**; every `data.ts` imports `GraphData` from `@invana/graph` and every `settings.ts`
imports `CanvasConfig` from `@invana/canvas`. The root barrel re-exports no types at all — a
consumer that needs them takes them from the package that owns them. This resolves Q3 in §10
(the recommendation there — keep `CanvasData` — was **not** taken).

What that leaves open: the per-dataset **narrowing helpers** this section wanted to add
(`type`-narrowed node / edge records, so a dataset's string-literal union stays assignable
with no cast) now have no in-package home. Two options when that work happens — extend
`@invana/graph`'s `GraphNode` / `GraphEdge` inline per dataset, or push generic narrowing into
`@invana/graph` itself so every consumer benefits. Decide then; don't reintroduce a
`types.ts` of aliases to hang them off.

## 5. Two latent bugs the casts are hiding

Both surface the moment the double cast is removed, and both are shipping today:

| File | Problem |
|---|---|
| `src/flare-imports/data.ts:164` | `FlareImportsGraphData` is `{ nodes, treeEdges, importEdges }` — it has **no `edges` field**. `data` is cast to `GraphData` anyway, so `data.edges` is `undefined` at runtime. Any consumer passing it to `setData` gets an edgeless graph. |
| `src/usecase-demos/rag-embeddings/data.ts:199` | `RagEmbeddingsData` is `{ nodes }` only — same story, `data.edges` is `undefined`. |
| `src/random-tree/data.ts:33` | All 119 generated edges are `{ source, target }` with **no `id`** — the package's own authoring rule ("`id` is required on edges too… don't synthesise them at runtime") is violated by the generator. Stamp `e0`, `e1`, … in the generator. |

Fix as part of the migration:

- **flare-imports** — `data` becomes `{ nodes, edges: [...treeEdges, ...importEdges] }` with the
  two kinds distinguished by `type` (`'tree'` / `'import'`), which is what the bundled-curve
  story needs to style them apart anyway. The split arrays stay available from the generator's
  return value if a consumer genuinely needs them separated.
- **rag-embeddings** — `data` becomes `{ nodes, edges: [] }`. It's a projection scatter; it has
  no edges by design, and `GraphData` requires the array to exist.

## 6. Per-dataset manifest (24)

`legacy → delete` means the export is just an alias of `data` and disappears (D2).

### Root-level (13)

| Folder | Subpath | Legacy exports | Extras file (D3) | Generator kept (D4) |
|---|---|---|---|---|
| `air-routes` | `/air-routes` | — (already authors `data`) | `sources.ts` ← `airports`, `landTopology` | — |
| `flare` | `/flare` | `flareAsGraph` → private | `hierarchy.ts` ← `flareHierarchy` | — |
| `flare-imports` | `/flare-imports` | — | — | `flareImportsAsGraph(opts): GraphData` **+ §5 fix** |
| `game-of-thrones` | `/game-of-thrones` *(exists)* | `gameOfThrones` → delete | `meta.ts` ← `meta` (`GotMeta`) | — |
| `h1b2019` | `/h1b2019` | `h1b2019AsGraph` → private | `hierarchy.ts` ← `h1b2019Hierarchy` | — |
| `lattice` | `/lattice` | — | — | `generateLattice(n): GraphData` |
| `les-miserables` | `/les-miserables` | `lesMiserables` → delete | — | — |
| `life-tree` | `/life-tree` | `lifeTreeAsGraph` → private | `hierarchy.ts` ← `lifeTreeHierarchy` (`newick.ts` stays) | — |
| `old-faithful` | `/old-faithful` | `oldFaithful` → delete | — | — |
| `random-tree` | `/random-tree` | — | — | `generateRandomTree(n): GraphData` |
| `twitter` | `/twitter` | `twitterActivity` → delete | — | `generateTwitterActivity(opts): GraphData` |
| `uk-energy-flow` | `/uk-energy-flow` | `ukEnergyFlowAsGraph` → private | `sankey.ts` ← `ukEnergyFlow` (the node/link source form) | — |
| `wikipedia-dataviz` | `/wikipedia-dataviz` *(exists)* | `wikipediaDataViz` → delete | `meta.ts` ← `meta` (clusters · tags · schema) | — |

### `usecase-demos/` (11)

| Folder | Subpath | Legacy exports | Extras file (D3) |
|---|---|---|---|
| `agent-trace` | `/usecase-demos/agent-trace` | `agentTrace` (3 presets) | `traces.ts` ← `traces: GraphData[]`; `data = traces[0]` |
| `citations` | `…/citations` | `citations` → delete | — |
| `computing-pioneers` | `…/computing-pioneers` | `computingPioneers` → delete | — |
| `cora` | `…/cora` | `cora` → delete | — |
| `invana-architecture` | `…/invana-architecture` | `invanaArchitecture` → delete | — |
| `invana-code-kg` | `…/invana-code-kg` | `invanaCodeKg` → delete | `meta.ts` ← `clusters`, `tour`, `project` |
| `microservices` | `…/microservices` | `microservices` → delete | — |
| `modeller-seed` | `…/modeller-seed` | `modellerSeed` → delete | — |
| `ontology` | `…/ontology` | `ontology` → delete | `meta.ts` ← `coreIds` |
| `rag-embeddings` | `…/rag-embeddings` | `ragEmbeddings` → delete | — (**§5 fix**) |
| `star-schema` | `…/star-schema` | `starSchema` → delete | — |

## 7. Packaging

**`package.json`** — one wildcard pattern replaces the four hand-written entries. `*` in an
`exports` pattern matches across `/`, so the nested usecase-demos folders resolve too:

```json
"exports": {
  ".":   { "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" },
  "./*": { "types": "./dist/*/index.d.ts", "import": "./dist/*/index.js", "default": "./dist/*/index.js" }
}
```

**`tsup.config.ts`** — glob entries, and turn **`splitting: true`** on so shared imports
(`flare.json` is read by both `flare` and `flare-imports`; `types.ts` by all 24) become one
chunk instead of being inlined into every entry:

```ts
entry: ['src/index.ts', 'src/*/index.ts', 'src/usecase-demos/*/index.ts'],
splitting: true,
```

**Root barrel `src/index.ts`** — with the aliases gone (§4) it re-exports **no types**, so it
either disappears entirely or survives only if the narrowing helpers land somewhere here. No
dataset values either way; importing a dataset means importing its subpath.
`src/usecase-demos/index.ts` is deleted (its only job was namespacing).

## 8. Consumer migration (63 storybook files)

Mechanical rename, one import line per site:

```diff
-import { lesMiserables } from '@invana/graph-datasets';
-<GraphCanvasApp data={lesMiserables} />
+import { data, settings } from '@invana/graph-datasets/les-miserables';
+<GraphCanvasApp data={data} config={settings} />
```

Where a story pulls two datasets, alias at the import (`import { data as cora } from …/cora`).
The heaviest clusters: `lesMiserables` (31 sites), `flareAsGraph` (9), `wikipediaDataViz`,
`ukEnergyFlowAsGraph`, `invanaCodeKg`, `cora` (6 each). The `*AsGraph()` call sites become the
plain `data` value; the `generate*()` call sites keep calling (D4).

Stories consuming an extras value (`h1b2019Hierarchy`, `airports` + `landTopology`,
`ukEnergyFlow`, `agentTrace`) point at the new extras file's subpath export instead.

Rule 11 applies: this is a **rename inside existing stories**, not new stories — no story is
added or removed.

## 9. Phasing

| Phase | Work | Gate |
|---|---|---|
| **P0** | ~~`src/types.ts`~~ — **done differently (2026-08-01): the file and both aliases are deleted; `data.ts` imports `GraphData`, `settings.ts` imports `CanvasConfig`** (§4). Narrowing helpers deferred | `check-types` clean |
| **P1** | All 24 `data.ts` — promote `data` to the authored value, delete legacy aliases + casts, drop `readonly` on record fields, extract extras (§6), fix the two §5 bugs | **zero `as unknown as GraphData` left in `src/`** — grep is the check |
| **P2** | All 24 `settings.ts` — retype to `CanvasConfig` | `check-types` |
| **P3** | 24 × `index.ts`; `package.json` exports wildcard; tsup globs + splitting; root barrel → types-only; delete `usecase-demos/index.ts` | `pnpm --filter @invana/graph-datasets build`, then a resolution smoke check on 3 subpaths (root, nested, big-graph) |
| **P4** | 63 storybook files | `pnpm check-types`, storybook builds, spot-render the heavy stories |
| **P5** | `packages/graph-datasets/CLAUDE.md` — subpath contract, extras convention, generator rule (D4); regenerate `apps/docs/api/graph-datasets/` | docs build |

**Guard test** (P1, `src/__tests__/datasets.test.ts`): table-driven over all 24 subpaths —
`data.nodes` and `data.edges` are both arrays, node ids unique, every edge endpoint resolves,
every edge has an `id`. That's exactly the class of defect §5 found, and it's cheap to keep.
(Rule 10 bans tests in `packages/canvas` only; vitest is already wired here.)

Phases P1–P4 are one breaking change and should land as one commit — the package is
`0.0.11` and every consumer is in-repo, so there's no deprecation window to honour.

## 10. Open questions

1. **Flatten `usecase-demos/`?** With the barrel gone, the folder's only remaining job is
   documentation ("synthetic demo-only" vs "real" datasets) — it no longer namespaces
   anything. Flattening gives all 24 datasets a uniform one-segment subpath
   (`/star-schema` not `/usecase-demos/star-schema`); keeping it preserves the distinction at
   a cost of one path segment. *Recommendation: keep the nesting* — the distinction is real
   and the churn is avoidable.
2. **Does the root subpath (`.`) stay?** With no types left to export (Q3 below), it has
   nothing to carry unless the narrowing helpers land in it — so the live options are "delete
   it, every import is a dataset subpath" or "keep it for helpers that don't exist yet".
3. ~~**Keep the `CanvasData` alias at all?**~~ **Resolved 2026-08-01: no.** `src/types.ts` and
   both aliases are deleted — `data.ts` imports `GraphData` from `@invana/graph`,
   `settings.ts` imports `CanvasConfig` from `@invana/canvas`. One name per concept, and the
   owning package is visible at the import site.
