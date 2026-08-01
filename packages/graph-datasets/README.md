# @invana/graph-datasets

Ready-to-render example graphs for `@invana/graph` — each one engine-ready data plus the
settings that make it look right.

```bash
pnpm add @invana/graph-datasets
```

## A dataset is a folder

Every dataset lives in `src/<name>/` and ships **two halves** — `data.ts` (what to draw, as
`CanvasData`) and `settings.ts` (how it should look, as `CanvasConfig`) — so a complete
visualisation is two props and no glue:

```tsx
import { lesMiserables, lesMiserablesSettings } from '@invana/graph-datasets';

<GraphCanvasApp data={lesMiserables} config={lesMiserablesSettings} />
```

> Moving to one subpath per dataset (`@invana/graph-datasets/les-miserables` → `{ data,
> settings }`) — see [`docs/graph-datasets-folder-exports-plan.md`](../../docs/graph-datasets-folder-exports-plan.md).
> The folder names below are stable across that change.

## The datasets

24 sets, **largest first**. **Bold** is the layout `settings.activeLayout` selects; the rest
are layouts the data supports. `†` = under `@invana/graph-datasets/usecase-demos`; `‡` = its
own subpath (too large for the main bundle). Counts are the shipped value — generated sets
show their default parameters.

| Dataset | Kind | Nodes | Edges | Layouts | What it is |
|---|---|---:|---:|---|---|
| `h1b2019` | hierarchy | 24 683 | 24 682 | **hierarchy (radial)** · pack · force | H-1B 2019 state → city → employer. Four levels, thousands of leaves. |
| `game-of-thrones` ‡ | network | 4 959 | 28 679 | **force** · geometric | Houses · characters · locations · seasons. The scale test. |
| `air-routes` | geo | 2 980 | 0 | **none — a map projection places them** | World airports (`lng`/`lat` on `data`) + a land TopoJSON basemap. |
| `cora` † | network | 2 708 | 10 556 | **force** · geometric | The Cora citation benchmark; `type` is the paper's subject area. |
| `wikipedia-dataviz` ‡ | network | 2 085 | 5 409 | **none — positions are the data** · force | Sigma.js data-viz knowledge map; 24 topic clusters + its own meta-graph. |
| `invana-code-kg` † | network | 602 | 1 329 | **force** · elk | This repo as a code knowledge graph — files · functions · classes, plus clusters, a guided tour and provenance. |
| `rag-embeddings` † | point cloud | 402 | 0 | **none — positions are the data** | A 2-D embedding projection over five topics. The clustering *is* the picture. |
| `lattice` | network | 400 | 760 | **force** · geometric | A 20×20 grid. Regular structure to sanity-check a layout against. Generated. |
| `life-tree` | hierarchy | 381 | 380 | **hierarchy (radial)** · tree · force | Tree of life parsed from Newick; branch lengths on `data.length`. |
| `old-faithful` | point cloud | 272 | 0 | **none — positions are the data** | Eruption duration vs waiting time. A scatter plot rendered as a graph. |
| `flare-imports` | hierarchy | 252 | 906 | **force** · hierarchy (radial) | Flare plus synthetic leaf→leaf imports, for edge bundling. Tree and import edges are kept apart. |
| `flare` | hierarchy | 252 | 251 | **hierarchy (tree)** · radial · cluster · pack · force | The Flare package tree — the canonical d3-hierarchy fixture. Also ships the nested tree. |
| `citations` † | network | 150 | 402 | **force** · geometric | Synthetic paper citations across five ML topics. |
| `random-tree` | hierarchy | 120 | 119 | **force** · hierarchy (tree) | A generated random tree — throwaway structure at any size. |
| `twitter` | network | 99 | 196 | **force** · elk | Synthetic activity graph — users · tweets · comments · retweets · hashtags. Generated. |
| `les-miserables` | network | 77 | 254 | **force** · elk · geometric | Hugo character co-occurrence (Knuth, *Stanford GraphBase*). The small dense classic. |
| `uk-energy-flow` | flow | 48 | 68 | **sankey** | UK energy supply → conversion → end use. Ribbon width is the datum. |
| `invana-architecture` † | diagram | 43 | 33 | **none — hand-placed** | The Invana pipeline, hand-placed with `parentId` containment. |
| `ontology` † | network | 29 | 36 | **force** · elk | A business ontology — companies · people · products · locations. |
| `microservices` † | network | 20 | 34 | **force** · elk | A service topology with tier, health and RPS per node. |
| `computing-pioneers` † | network | 10 | 7 | **force** · elk | Ten pioneers with avatars — the composite-card fixture. |
| `agent-trace` † | DAG | 9 | 9 | **elk (layered, down)** · hierarchy (tree) | An LLM agent run: prompt → tools → decision → response. Three presets; the first is the default. |
| `star-schema` † | schema | 4 | 3 | **elk (layered, right)** | A fact table and its dimensions, as ER cards with typed fields. |
| `modeller-seed` † | diagram | 3 | 1 | **none — hand-placed** | Three seeded nodes — the empty-canvas starting point for the modeller. |

**Kinds.** *network* — structure is the data, geometry comes from a layout. *hierarchy* — a
rooted tree flattened to parent→child edges (the nested tree ships too). *flow* — directed
magnitudes; edge weight is the point. *DAG* — a directed run/trace; ordering is the data.
*schema* — a meta-graph of entity kinds, not instances. *point cloud* / *geo* / *diagram* —
the node positions **are** the information, so `activeLayout` is `''`; running a solver over
one destroys the picture.

**Mounting a layout.** `settings.activeLayout` names an id the consumer must have mounted.
`graph-force` ships in the `<GraphCanvasApp>` bundle, so **force** sets drop straight in.
Hierarchy and Sankey sets use the id `layout` (mount `D3HierarchyLayout` — the `mode` is
already in the settings — or `D3SankeyLayout`); `agent-trace` uses the id `elk` (mount
`ElkLayout`).

## Adding a dataset

See [`CLAUDE.md`](./CLAUDE.md) — the authoring contract (engine-ready records, `type` as the
discriminator, offline transforms in `scripts/`, settings as pure JSON) and the four steps.
