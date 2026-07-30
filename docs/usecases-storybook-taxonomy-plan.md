# Storybook `usecases/` taxonomy — apps vs domains

> **Status: executed (2026-07-31)**, with two carve-outs. All 16 moves in §3
> landed via `git mv`, titles + export names rewritten,
> `pnpm --filter @canvas/storybook check-types` passes. As-built notes:
>
> 1. **§7 Q1 resolved as the approved tree** — every domain gets a folder,
>    including the eight holding a single story. The flatten-singletons
>    alternative was recommended but not taken; revisit only if the sidebar
>    depth actually bites.
> 2. **`SimpleAndCompositeNodes` was NOT deleted** — §5 is unresolved, and it
>    holds the only ellipse-composite-frame demo in the repo. It sits at
>    `usecases/SimpleAndCompositeNodes.stories.tsx`, retitled lowercase
>    (`usecases/SimpleAndCompositeNodes`) so it doesn't strand a capital-`U`
>    sidebar node, and is the one story in neither bucket. Resolve §5, then
>    delete or re-home it.
> 3. **`apps/designer/StyleDesigner` is not written** — the folder is empty and
>    exists only in this plan (§6). Follow-up pass.
> 4. Renames beyond the manifest: `packages/graph-datasets/src/usecase-demos/index.ts`
>    header comment (dataset → story pointers) and one cross-reference in each
>    of `GraphModeller` / `SubjectBundle`. Historical `docs/*-plan.md` mentions
>    of the old paths were left alone — they record what was true then.

**Goal.** `stories/usecases/` has grown to 17 flat stories with one ad-hoc
sub-folder (`code-kg/`). Every one of them is now composed from
`<GraphCanvasApp>` (commit `5b5a981`), so the namespace no longer separates
*what the demo is* from *what data it happens to show*. This plan splits it on
the axis that actually distinguishes them:

- **`usecases/apps/`** — the **product surfaces** Invana ships. A story here is
  about *the tool*: modeller, visualiser, designer. Its dataset is a prop.
- **`usecases/domains/`** — the **verticals**. A story here is about *the
  picture a domain needs*; the app shell is a given. One folder per domain, so
  several styling / layout configs of the same data sit side by side (the shape
  `code-kg/` already grew into organically).

Every story keeps its subject; nothing is re-authored in this pass.

---

## 1. Decisions (locked)

1. **Two top-level buckets: `apps/` and `domains/`.** Not "everything
   classifies into modeller / visualiser / designer" — that made `visualiser/`
   an 11-of-17 dumping ground.
2. **`apps/designer/` is a live style-editing app**, a peer of modeller and
   visualiser — *not* a bucket for node-rendering showcases. It is a **new
   story** (`StyleDesigner`), written in a follow-up pass: `<GraphCanvasApp>`
   over `invanaCodeKg`, `<CanvasSettingsEditorPanel>` docked right, a header
   preset switch between the dots and cards configs. The trio reads
   **modeller · visualiser · designer** — model it, explore it, style it.
3. **Sidebar prefix goes lowercase: `Usecases/` → `usecases/`.** Mirrors the
   folder path exactly (`apps/storybook/CLAUDE.md`) and matches every other
   namespace (`canvas`, `graph`, `canvas-ui`, `graph-layouts`).
   **This reverses as-built note (1) of
   [`storybook-namespace-migration-plan.md`](./storybook-namespace-migration-plan.md)**,
   which chose capital-U to merge with the then-existing node. That node is
   being rebuilt here anyway, so the exception no longer buys anything.
4. **The synthetic `CodeKnowledgeGraph` folds into `domains/code-kg/`** as a
   third variant (`HealthBadges`) rather than standing as its own
   `domains/code-intel/` node. One code-intelligence domain, three configs.
5. **`SchemaTable` becomes `domains/data-model/`** — an ER / data-model diagram
   is a genuine vertical (dbdiagram.io / DrawSQL), not a styling showcase.
6. **`SimpleAndCompositeNodes` leaves `usecases/`** — its subject is an engine
   capability, not a use case. See §5 for what must be preserved first.

### `usecases/apps/` vs `canvas-ui/apps/` — not the same thing

Both exist; they answer different questions.

- `canvas-ui/apps/GraphCanvasApp/…` — stories about **the component**: its
  regions, chrome slots, `bundle={false}`, `keepMounted`, multi-instance.
- `usecases/apps/…` — stories about **a product built with it**: the modeller,
  the visualiser, the designer. `GraphCanvasApp` is the substrate, not
  the subject.

When unsure: *is the story teaching `GraphCanvasApp`'s API, or showing a tool a
user would open?* First → `canvas-ui/`, second → `usecases/apps/`.

### `usecases/apps/designer/` vs the `canvas-designer/` namespace

"Designer" now names two Storybook nodes. They are not the same subject:

- `canvas-designer/CardDesignerStudio` — a story for the
  **`@invana/canvas-designer` package**: the WYSIWYG node-template authoring
  surface that emits a `FreeformStructure`. Package-owned, per the namespace
  rule.
- `usecases/apps/designer/StyleDesigner` — a **use case** that imports no
  `@invana/canvas-designer` code at all. It's `GraphCanvasApp` +
  `CanvasSettingsEditorPanel` (both `@invana/canvas-ui`), showing the *style a
  visualisation* surface as a product.

They converge later: root `CLAUDE.md` has `@invana/canvas-designer` growing a
studio shell that hosts the `@invana/canvas-ui` editors. **If that shell ships,
`StyleDesigner` should move to `canvas-designer/`** — at that point it would be
demoing package-owned code, and the namespace rule takes over. Until then it is
a composed use case and stays here.

---

## 2. Target tree

```
apps/storybook/stories/usecases/
├── apps/                                    ← product surfaces
│   ├── modeller/
│   │   └── GraphModeller.stories.tsx
│   ├── visualiser/
│   │   ├── GraphVisualiser.stories.tsx
│   │   └── KnowledgeGraphExplorer.stories.tsx
│   └── designer/
│       └── StyleDesigner.stories.tsx        ← NEW, follow-up pass
└── domains/                                 ← verticals
    ├── code-kg/
    │   ├── DotsForce.stories.tsx            real dataset · d3-force · tiny circles
    │   ├── CompositeCards.stories.tsx       real dataset · ELK layered · composite cards
    │   └── HealthBadges.stories.tsx         synthetic · ELK · coverage/error badges
    ├── cora/
    │   ├── CitationNetwork.stories.tsx      2,708 papers · dense bezier "watercolor"
    │   └── SubjectBundle.stories.tsx        ~75-node slice · pathType: 'bundle'
    ├── citations/
    │   └── CitationGraph.stories.tsx
    ├── microservices/
    │   └── ServiceTopology.stories.tsx
    ├── data-lineage/
    │   └── SankeyLineage.stories.tsx
    ├── llm-agent-trace/
    │   └── AgentTrace.stories.tsx
    ├── rag-embeddings/
    │   └── EmbeddingExplorer.stories.tsx
    ├── geo-air-routes/
    │   └── AirRoutes.stories.tsx
    ├── data-model/
    │   └── SchemaTable.stories.tsx
    └── invana-architecture/
        └── EndToEnd.stories.tsx
```

---

## 3. Move manifest

`title` mirrors the path exactly. Export names are unchanged unless the **Note**
column says otherwise (the export name is the sidebar leaf label).

### → `usecases/apps/`

| Current file | Current title | New file | New title | Note |
|---|---|---|---|---|
| `GraphModellerApp.stories.tsx` | `Usecases/GraphModellerApp` | `apps/modeller/GraphModeller.stories.tsx` | `usecases/apps/modeller/GraphModeller` | export `GraphModellerApp` → `GraphModeller` (the `App` suffix is redundant under `apps/`) |
| `GraphVisualiserApp.stories.tsx` | `Usecases/GraphVisualiserApp` | `apps/visualiser/GraphVisualiser.stories.tsx` | `usecases/apps/visualiser/GraphVisualiser` | export `GraphVisualiserApp` → `GraphVisualiser` |
| `KnowledgeGraphExplorer.stories.tsx` | `Usecases/Knowledge Graph Explorer` | `apps/visualiser/KnowledgeGraphExplorer.stories.tsx` | `usecases/apps/visualiser/KnowledgeGraphExplorer` | expand-on-double-click explorer — a visualiser variant |
| — | — | `apps/designer/StyleDesigner.stories.tsx` | `usecases/apps/designer/StyleDesigner` | **NEW** — follow-up pass, see §6 |

### → `usecases/domains/`

| Current file | Current title | New file | New title | Note |
|---|---|---|---|---|
| `code-kg/code-kg-d3-force.stories.tsx` | `Usecases/code-kg` | `domains/code-kg/DotsForce.stories.tsx` | `usecases/domains/code-kg/DotsForce` | export `F3Force` → `DotsForce` (`F3Force` reads as a typo for `D3Force`) |
| `code-kg/code-kg-elkjs.stories.tsx` | `Usecases/code-kg` | `domains/code-kg/CompositeCards.stories.tsx` | `usecases/domains/code-kg/CompositeCards` | export `ElkjsCards` → `CompositeCards` |
| `CodeKnowledgeGraph.stories.tsx` | `Usecases/Code Knowledge Graph` | `domains/code-kg/HealthBadges.stories.tsx` | `usecases/domains/code-kg/HealthBadges` | export `CodeKnowledgeGraph` → `HealthBadges`; synthetic data — see §7 Q2 |
| `CoraCitationNetwork.stories.tsx` | `Usecases/Cora Citation Network` | `domains/cora/CitationNetwork.stories.tsx` | `usecases/domains/cora/CitationNetwork` | export → `CitationNetwork` |
| `CoraSubjectBundle.stories.tsx` | `Usecases/Cora Subject Bundle` | `domains/cora/SubjectBundle.stories.tsx` | `usecases/domains/cora/SubjectBundle` | export → `SubjectBundle`; its "see the dense view" cross-reference comment needs the new path |
| `CitationGraph.stories.tsx` | `Usecases/Citation Graph` | `domains/citations/CitationGraph.stories.tsx` | `usecases/domains/citations/CitationGraph` | |
| `MicroservicesTopology.stories.tsx` | `Usecases/Microservices Topology` | `domains/microservices/ServiceTopology.stories.tsx` | `usecases/domains/microservices/ServiceTopology` | export → `ServiceTopology` |
| `DataLineage.stories.tsx` | `Usecases/Data Lineage` | `domains/data-lineage/SankeyLineage.stories.tsx` | `usecases/domains/data-lineage/SankeyLineage` | export → `SankeyLineage` |
| `LLMAgentTrace.stories.tsx` | `Usecases/LLM Agent Trace` | `domains/llm-agent-trace/AgentTrace.stories.tsx` | `usecases/domains/llm-agent-trace/AgentTrace` | export → `AgentTrace` |
| `RAGEmbeddingExplorer.stories.tsx` | `Usecases/RAG Embedding Explorer` | `domains/rag-embeddings/EmbeddingExplorer.stories.tsx` | `usecases/domains/rag-embeddings/EmbeddingExplorer` | export → `EmbeddingExplorer` |
| `GeoAirRoutes.stories.tsx` | `Usecases/Geo Air Routes` | `domains/geo-air-routes/AirRoutes.stories.tsx` | `usecases/domains/geo-air-routes/AirRoutes` | export → `AirRoutes`; the `bundle={false}` MapLibre case |
| `SchemaTable.stories.tsx` | `Usecases/Schema Table` | `domains/data-model/SchemaTable.stories.tsx` | `usecases/domains/data-model/SchemaTable` | distinct from the imperative `graph/Nodes/Types/composite-shapes/SchemaTable` — see §5 |
| `InvanaArchitecture.stories.tsx` | `Usecases/InvanaArchitecture` | `domains/invana-architecture/EndToEnd.stories.tsx` | `usecases/domains/invana-architecture/EndToEnd` | export → `EndToEnd` |

### Removed

| Current file | Disposition |
|---|---|
| `SimpleAndCompositeNodes.stories.tsx` | **Delete** from `usecases/` — engine capability, not a use case. **Blocked on §5:** two of its subjects are not covered elsewhere. |

**Totals:** 17 files today → 16 moved/renamed, 1 deleted, 1 new (deferred) = 16
after this pass, 17 once `StyleDesigner` lands.

---

## 4. Mechanics

- **No config change.** `.storybook/main.ts` discovers via
  `'../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'` — recursive, so new depth is
  picked up automatically.
- **No import breakage.** Verified: **zero relative imports** across all 17
  files (`grep "from '\.\."` → empty). Every import is a package specifier
  (`@invana/canvas`, `@invana/graph-datasets`, …), so files can move any depth
  without rewriting a path. `stories/div-util.tsx` is not used by any of them
  (they're declarative React stories, not `createContainer` + `play`).
- **Use `git mv`** so history follows the file.
- **Rewrite three things per file:** the `title:` string, the story export name
  (where the manifest says so), and any cross-reference in the header TSDoc
  comment that names another story by its old path.
- **Verify:** `pnpm --filter @canvas/storybook check-types`, then
  `pnpm --filter @canvas/storybook dev` and walk the sidebar — two stories
  currently share the title `Usecases/code-kg`, so confirm they land as two
  distinct nodes.
- **Rules that still bind:** one story per file; every story self-contained
  (data + tree inline, no shared helper module); all story code inside
  `render()`; no hand-rolled CSS.

---

## 5. Blocker — what `SimpleAndCompositeNodes` uniquely covers

Dropping it was agreed on the basis that
`graph/Nodes/Types/composite-shapes/` already covers the ground. **That is only
partly true.** That folder holds `UserCard`, `TaskCard`, `StatCard`,
`SchemaTable` — all rect-framed composites, each alone on the canvas. Grepping
`stories/graph/Nodes/` for `ellipse` returns only an unrelated SVG-image story.

So deleting the file loses two demonstrations outright:

1. **A non-rect composite silhouette** — the `Organization` node's `frame` is an
   `ellipse`, with fill, border, and the hover / select ring + halo all
   following the ellipse. This is the only proof a composite isn't rect-only.
2. **Simple and composite nodes coexisting on one canvas** — `Person` (idCard
   composite) + `Organization` (ellipse freeform) + `Concept` (simple circle),
   all laid out together by one force layout.

Pick one before executing:

- **(a) Port first, then delete** *(recommended)* — add
  `graph/Nodes/Types/composite-shapes/EllipseFrame.stories.ts` (imperative, in
  the folder's existing style) covering (1), and accept the loss of (2) as a
  mixed-canvas concern the layout stories already show incidentally.
- **(b) Keep it, re-homed** — it stays as `domains/` content under some
  folder. Cheapest, but re-admits an engine showcase into a vertical bucket.
- **(c) Delete outright** — accept both losses. The ellipse frame then has no
  story anywhere.

---

## 6. `apps/designer/StyleDesigner` — sketch (follow-up pass)

Not part of the move; recorded so the empty folder has a spec.

- `<GraphCanvasApp>` over `invanaCodeKg` (`@invana/graph-datasets`) — the same
  602-entity graph the two `domains/code-kg/` stories use, so the designer and
  the presets it switches between are visibly the same data.
- **Right region:** `<CanvasSettingsEditorPanel>`, docked via `useSidePanels`,
  so every registered layer / behaviour / layout surface is editable live
  (root rule 12 — the constructor options *are* the visualisation's state).
- **Header:** a preset switch — `dots` (d3-force, tiny circles) ⇄ `cards`
  (ELK layered, composite cards) — pushing a whole style config through
  `useGraphCanvasUpdate().update(...)`. The point of the story is that the two
  `domains/code-kg/` pictures are one dataset plus two config values, and that
  a user can travel between them with the editor rather than a code change.
- Memoise `data` / `onReady` so a panel toggle never reloads the engine.

Open: whether the preset switch writes config directly or drives a named
"style preset" concept that doesn't exist yet. Resolve when writing it.

---

## 7. Open questions

**Q1 — single-story domain folders.** The approved tree gives every domain a
folder, so eight of them hold exactly one file (`domains/citations/CitationGraph`
is three expansions deep to reach one story). Alternative: **folder only when a
domain has ≥2 variants** (`code-kg/`, `cora/`), single-variant domains stay flat
as `domains/CitationGraph.stories.tsx`, promoted to a folder when a second
variant lands. That's the convention `usecases/` already grew organically, and
it keeps the sidebar shallow. *Recommendation: flatten the singletons.* Costs 8
of the 16 paths in §3 if chosen.

**Q2 — the synthetic code graph.** `HealthBadges` sits in `domains/code-kg/`
next to two stories built on the *real* analyser output, but its own data is
invented. Its unique subject is **node badges driven by per-item data**
(coverage %, error counts) — which the real dataset has no fields for. Either
(a) keep it as-is and let the folder mix real and synthetic, or (b) re-author it
against `invanaCodeKg` with derived badge values, making the folder uniformly
real. (a) is the no-work default and is what §3 assumes.

---

## 8. `apps/storybook/CLAUDE.md` — rule to add

The taxonomy needs to be written down where stories get authored, in the
`Conventions` section next to the existing `usecases/` exception note:

> **`usecases/` has exactly two buckets: `apps/` and `domains/`.**
> `usecases/apps/<surface>/` holds the product surfaces (`modeller`,
> `visualiser`, `designer`) — a story here is about *the tool*, and its dataset
> is a prop. `usecases/domains/<domain>/` holds the verticals — a story here is
> about *the picture a domain needs*, and `GraphCanvasApp` is a given; several
> styling / layout configs of one dataset are sibling files in that domain's
> folder. Don't add a third bucket. An engine-capability demo wearing a use-case
> costume is **not** a use case — it belongs under the owning package's
> namespace (`graph/Nodes/…`, `canvas/Concepts/…`). Titles are lowercase and
> mirror the path exactly (`usecases/domains/code-kg/DotsForce`).
> `usecases/apps/` is distinct from `canvas-ui/apps/GraphCanvasApp/`: the
> latter teaches the component's API, the former shows a tool built with it.
> Likewise `usecases/apps/designer/` (a use case composed from canvas-ui
> editors) is distinct from the `canvas-designer/` namespace (stories for the
> `@invana/canvas-designer` package's own authoring surfaces).

Also update `docs/README.md` to index this file, under **Operations / domain
API** or a new **Storybook** heading alongside
`storybook-namespace-migration-plan.md`.
