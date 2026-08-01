# CLAUDE.md — packages/graph-datasets (`@invana/graph-datasets`)

Example graph datasets used by storybook stories and tests.

## A dataset is one `data.ts` exporting two halves

Every dataset lives in its own folder under `src/` (kebab-case, e.g. `les-miserables/`,
`usecase-demos/star-schema/`) and ships **one module** with **two exports**:

```
src/<dataset>/
├── data.ts       → export const data: GraphData       — what to draw
│                   export const settings: CanvasConfig — how it should look
└── <dataset>.json (optional — the on-disk serialisation for JSON-backed sets)
```

**There is no `settings.ts`.** The look was never separable from the data it was
written for — a settings module that can't see the graph it styles is two files to
open for one dataset — so both live in `data.ts`, data first, settings last.

Both halves are typed with the **engine's own types, imported directly** — data is
`@invana/graph`'s `GraphData`, settings are `@invana/canvas`'s `CanvasConfig`.
**This package declares no type aliases for them** (the former `CanvasData` /
`CanvasSettings` in `src/types.ts` are gone): a rename adds a second name for one
concept and hides which package owns it. So a consumer wires a complete
visualisation with two imports and no glue:

```tsx
import { lesMiserables, lesMiserablesSettings } from '@invana/graph-datasets';
<GraphCanvasApp data={lesMiserables} config={lesMiserablesSettings} />
```

The barrels (`src/index.ts`, `src/usecase-demos/index.ts`) re-export both halves
per dataset from `./<dataset>/data` under matching names — the data under the
dataset's own name, the settings as `<name>Settings`. Two large graphs
(`game-of-thrones`, `wikipedia-dataviz`) keep their own subpath entries, with an
`index.ts` in the folder re-exporting `./data`, so they stay out of the main bundle.

## No per-dataset record types

**A dataset exports values, never types.** There is no `GameOfThronesData`, no
`GotMeta`, no `CoraNodeData` — that zoo existed only to describe payloads, cost a
type per dataset per record kind to maintain, and forced consumers into a type
import before they could read a field.

Where a payload *is* read by consumers, say so **inline on the exported value** —
one structural annotation, nothing importable:

```ts
export const lesMiserables: {
  /** `data.group` is the co-occurrence cluster (0–10). */
  nodes: (GraphNode & { data: { group: number } })[];
  edges: (GraphEdge & { data: { value: number } })[];
} = { nodes, edges };
```

`GraphNode & { data: P }` (rather than `GraphNode<P>`) is deliberate: it keeps every
engine field *and* makes `data` **required**, so a consumer writes `n.data.group`
with no guard. Consumers get the shape by inference; nothing to import, nothing to
keep in sync. Rules:

- **Object literals, not named types.** A local `type`/`interface` is fine when a
  union would otherwise repeat (see `cora`'s `CoraSubject`) or when a builder needs
  to read a payload back (`citations`' `PaperPayload`) — but it stays **unexported**.
- **Annotate only what's read.** A payload no story touches needs no annotation;
  leave it as the engine's `data?: unknown`.
- **`satisfies GraphData`** on a hand-authored dataset value keeps the narrow
  inferred type while still checking it against the engine's shape.

## `data.ts` — engine-ready, authored in the final shape

**Every dataset is authored directly in the shape `GraphLayer.setData` takes.**
Don't invent a per-dataset record shape, and don't ship a runtime mapper that
reshapes foreign JSON on import.

```ts
// `@invana/graph`'s GraphNode / GraphEdge — the records `GraphData` holds.
interface GraphNode<D = unknown> { id: string; type?: string; data?: D; position?: {x,y}; … }
interface GraphEdge<D = unknown> { id: string; type?: string; source: string; target: string; data?: D; }
```

- **`type`** — the entity / relation kind (`'file'`, `'imports'`, `'company'`, …).
  This is the discriminator; per-dataset typed string-literal unions go here. Fill
  it in wherever the dataset has a natural category, even when the same value also
  appears on `data` — it's what makes colour-by-type partition the graph with no
  consumer wiring.
- **`data`** — the attribute bag. Everything that isn't `id` / `type` /
  `source` / `target`.
- **`id`** is required on edges too. If the source has none, bake stable ids into
  the data (`e0`, `e1`, …) — don't synthesise them at runtime.
- **Placement and containment are node fields**, not payload: a dataset whose
  arrangement *is* the information (a hand-authored diagram, an embedding
  projection, a geographic scatter) puts them on `position` / `parentId` /
  `style.labelText` so it drops straight in.
- **Top-level `nodes` / `edges` arrays are mutable** (`nodes: X[]`, not
  `readonly X[]`) — `GraphData` requires it, and a readonly array is not
  assignable. Keep `readonly` on the *record fields*.

> The old `{ id, label, properties }` property-graph records are gone: every
> consumer had to translate them at `setData` time, which is exactly the mapping
> this convention exists to delete. `label → type`, `properties → data`.

### JSON-backed datasets

Store the data in the JSON **already in the final shape**. The `.ts` module is
then a thin typed view — `import raw …; export const x = raw as unknown as {…};`,
the cast narrowing the string-literal unions a JSON import widens to `string` —
with **no `.map()` reshaping**. That inline annotation IS the on-disk contract;
the JSON is its serialisation. If the upstream source is shaped
differently, transform it **once, offline** in `scripts/` (`prepare-cora.mjs`,
`prepare-got.mjs`, `to-canvas-data.mjs`), never on import. `invanaCodeKg` is the
reference example.

Any synthetic field stamped onto a real dataset must say so in its TSDoc —
`invanaCodeKg`'s `coverage` / `errors` (from `scripts/add-code-health.mjs`) are
derived, not measured, and are marked as such.

## `settings` — the recommended look, as pure JSON

Exported from the bottom of the dataset's `data.ts`. Two rules keep it portable:

1. **Keyed by the `<GraphCanvasApp>` bundle's ids** — layers `background` /
   `graph`, layouts `graph-force`, behaviours `pan` · `wheel` · `drag-node` ·
   `hover` · `color` · `click-select` · `theme`. A hand-composed canvas needs
   settings keyed by *its* ids. Where a dataset wants a layout the bundle doesn't
   register (ELK, Sankey, hierarchy), `activeLayout` names an id the consumer is
   expected to mount — say which, in the module TSDoc.
2. **Serialisable** — no functions, no class references. Per-node resolvers
   (`shape: (node) => …`, `bgFill: (node) => …`) stay with the consumer; these
   settings persist, diff, and drive the settings editor as plain data.

Write the TSDoc as an *argument*, not an inventory: why this layout, why these
marks, why colour-by-type is on or off for this dataset. A dataset whose
positions are the data (`old-faithful`, `rag-embeddings`, `air-routes`,
`invana-architecture`, `wikipedia-dataviz`) sets `activeLayout: ''` and says so —
running a solver over it would destroy the picture.

### Settings variants

`settings` is the dataset's *default* look, but a dataset may export **additional
named `CanvasConfig`s** when the same graph has a genuinely different reading —
not a tweak of the first. `twitter` is the reference: `settings` draws dots and
links (what a force layout demo wants), `cardSettings` draws tweets, accounts and
replies as **composite cards** via `nodeStructureTemplates` +
`nodeStylingTemplates` + `nodeTypes`.

- **Name it `<variant>Settings`**, re-exported from the barrel as
  `<dataset><Variant>Settings` (`twitterActivityCardSettings`).
- **Still pure JSON.** The whole template stack is serialisable — structures are
  slot skeletons, stylings are theme roles, and each slot binds to a **dotted data
  path** (`data.likes`). One path per slot, so a slot renders a single field
  verbatim; there's no formatting or concatenation step.
- **Say what changes and why** in its TSDoc. A card variant almost always has to
  open the force layout up (a 260×156 card needs far more room than a 7px dot)
  and turn colour-by-type **off**, since the styling templates own colour.
- **Earn it.** Two configs that differ by a fill colour are one config; keep the
  bar at "a different picture of the same data".

## Adding a dataset

1. `src/<name>/data.ts` — the engine-ready value (`data`, plus a legacy-named
   alias if consumers already use one) and then `settings`, in that order. No
   exported types; annotate a payload inline only where a consumer reads it.
2. Re-export both from the owning barrel (`src/index.ts` or
   `src/usecase-demos/index.ts`), both from `./<name>/data`: the data under its
   own name, the settings as `<name>Settings`.
3. A new subpath entry (only for a graph big enough to warrant one) also needs an
   `index.ts` in the folder, a `tsup.config.ts` entry, and a `package.json`
   `exports` entry.
