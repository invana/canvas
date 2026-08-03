# RFC — the new behaviours

**Status:** 📋 proposed — no code written. Design status tracked per behaviour.
**Packages:** `@invana/graph` (behaviours + queries + algorithms) · `@invana/canvas-ui`
(one editor per behaviour, root rule 12) · `@invana/canvas` (nothing new).
**Driver:** [`casestudies-rfc.md`](./casestudies-rfc.md) — every step marked 🔧
there is blocked on something in this document.
**Decisions:** §7 is a decision log. Every question raised in the first draft has
been answered; two of them reversed the draft's own recommendation.

---

## 1. Why these, and why now

Five case studies, written independently across five industries, converge on the
**same missing capability**. Not five feature requests — one gap with five
witnesses:

> Today the engine is excellent at **observe** and good at **focus**. It has
> almost nothing for **investigate** — the beat where an analyst asks *"how does
> A connect to B"*, *"what can this reach"*, *"what changed"*, and *"prove it"*.

Everything below serves that beat.

### 1.1 What already exists — read this first

Verified against `feat/refactor` head. Each row is something a naive gap list
would have filed as a TODO.

| Foundation | Where | What it means |
|---|---|---|
| `dimmed` / `highlighted` element states, with theme defaults (`bgAlpha: 0.25`, `strokeAlpha: 0.2`) | `graph/src/layer/types.ts` | **The rendering half of focal emphasis is done.** Missing: a behaviour that *drives* it → B1 |
| Per-element hide/show honoured by renderer, hit-test, bounds, layout, labels, minimap | [`per-element-visibility-plan.md`](./per-element-visibility-plan.md) ✅ implemented | `isolate` composes on this; no new visibility primitive |
| `AdjacencyIndex` — `view(slot)` / `degree(slot)`, typed-array buckets | `graph/src/store/AdjacencyIndex.ts` | **BFS is a small addition to an existing index**, not new infrastructure → materially de-risks P2 |
| Template **field resolvers** (how `ColorByLabelBehaviour` writes `bgFill`) | `graph/src/layer/`, `graph/src/behaviours/ColorByLabelBehaviour.ts` | The colour-by-anything work (U5) is an **extension of a working mechanism**, not new plumbing. Also means confidence-weighted edge width/alpha is likely expressible today → U6 is *verify*, not *build* |
| Editor `fields` may be a **function of the live form values** | `canvas-ui/src/editors/layers/density-contour-fill-layer/DensityContourFillLayerEditorPanel.tsx:59-62`, and ~20 other editors | **Mode-driven editors with disjoint field sets are a solved, in-use pattern.** This single fact reversed two of the first draft's recommendations — see §7 D1, D2 |
| `GraphLayer` emits `data:changed` | `graph/src/layer/GraphLayer.ts:521,716` | A subscription point for anything that must recompute when data lands — auto colour domains (U5), diff snapshots (B6) |
| `GraphLegendLayer` — reads swatches back off the *effective* style, one row per type | `graph/src/layer/GraphLegendLayer.ts` | Legends already agree with whatever recoloured the graph, for free. ⚠️ **Type-keyed** — a continuous colour scale has no type rows, so U5 extends it (§4.1.6) |
| State export | `canvas/src/export/stateExport.ts` | Starting point for P3 — exports canvas state, not a provenance-annotated subgraph |
| Paint **planes** (render order) | [`render-planes-and-emphasis-plan.md`](./render-planes-and-emphasis-plan.md) | Planes stand. ⚠️ **The emphasis half of that doc is superseded** — do not build emphasis containers; the replacement is a renderer colour fast path (`design.md` §7.2) |

### 1.2 Status legend

Design and implementation are tracked separately — several items have a finished
design and no code.

| | Design | Implementation |
|---|---|---|
| ✅ | decided, written down | shipped |
| 🚧 | drafted, decisions open | partial |
| 📋 | none — needs a design pass | none |
| ⚠️ | exists but superseded/stale | built but not fit for this purpose |

---

## 2. Prerequisites — not behaviours, but they gate everything

Four pieces that behaviours *call*. Building behaviours first would mean each one
re-implementing traversal.

| ID | Piece | Package | What it is | Design | Impl |
|---|---|---|---|---|---|
| **P1** | **`GraphCanvas` operations layer** — `focus` · `focusNeighbours` · `isolate` · `selectSubtree` · `pin` · `remove` | `@invana/graph` | The composite verbs every *focus* beat is written in. Query → primitive action → one batched composite. | ✅ [`graph-canvas-operations.md`](./graph-canvas-operations.md) — **decisions locked** | 📋 `GraphCanvas.ts` is 84 lines and has **none** of them |
| **P2** | **Traversal queries** — `path(a, b)` / `reachableFrom(n, depth?)` | `@invana/graph` — `store/algorithms/` | Pure reads, outside the batch. BFS over `AdjacencyIndex`. | 📋 | 📋 |
| **P3** | **Evidence export** — selected subgraph + provenance → JSON/report | `@invana/graph` + `@invana/canvas-ui` | Every storyboard ends *"and now write it down"* | 📋 | 🚧 `stateExport.ts` adjacent |
| **P4** | **Centrality algorithms** — betweenness, closeness, PageRank | `@invana/graph` — `store/algorithms/` | Sits beside `AdjacencyIndex`, same home as P2. **Behaviours consume it; they never host an O(VE) algorithm.** Consumed by U1 (node → `size`) and B5 (edge → `strokeWidth`). | ✅ home decided (§7 D8) | 📋 |

> **P1 is pure execution.** The design is complete and its decisions are locked;
> the file just doesn't implement them. That makes it the cheapest high-value
> item in either RFC.

> **P2 and P4 share a folder** — `graph/src/store/algorithms/` (`bfs.ts`,
> `betweenness.ts`, …). They're graph algorithms over the typed-array adjacency
> index, not behaviours and not a separate package: there's no 3rd-party dep to
> isolate, so a `@invana/graph-algorithms` package would add a node to the
> dependency graph and buy nothing.

---

## 3. The new behaviours

Six. Ordered by how many case studies they unblock.

> Down from eight in the first draft: old B2+B3 merged into **B2**
> (`TraversalHighlightBehaviour`, §7 D1) and old B6 `ColorByValueBehaviour`
> folded into **U5** as a rename-and-extend of the existing behaviour
> (§7 D2). Both merges were unblocked by the same fact — see §1.1, editor
> `fields` as a function.

| ID | Behaviour | What it does | Needs | Unblocks | Design | Impl |
|---|---|---|---|---|---|---|
| **B1** | **`FocalEmphasisBehaviour`** | Owns the `highlighted` + `dimmed` pair: given a focal set, mark it highlighted and its complement dimmed; clear both together. **The shared driver B2/B4/B6 all write through** — without it each would grow its own emphasis logic and fight the others for the same fields. | — | all 5 | 📋 | 📋 |
| **B2** | **`TraversalHighlightBehaviour`** | Highlights a traversal result. `mode: 'path'` — pick a source and target, highlight the connecting path. `mode: 'reachable'` — from one node, mark everything reachable (optionally depth- and direction-capped) — blast radius, downstream propagation, lineage tail. **The single highest-value behaviour in this table.** | P2, B1 | all 5 | 🚧 §7 D1, D3 | 📋 |
| **B3** | **`NeighbourhoodExpandBehaviour`** | Double-click a node → fetch and grow one hop. | P1 | CS1 CS2 CS3 | 📋 | ⚠️ **existed, then deleted** — the pattern lived in `KnowledgeGraphExplorer` ([taxonomy plan](./usecases-storybook-taxonomy-plan.md) as-built note 6). **Recover from git history rather than redesign.** |
| **B4** | **`TimelineBehaviour`** | Filter/replay nodes and edges by a timestamp field; scrub through time. Composes on per-element visibility (§1.1). Exposes `setTime` / `play` / `range`; **the scrub control is a separate canvas-ui surface** (§7 D5). | — | CS1 CS2 CS4 CS5 | 🚧 §7 D5 | 📋 |
| **B5** | **`EdgeCentralityBehaviour`** | **Edge** betweenness → stroke width/colour. CS2's choke-point beat is literally this. Separate from `NodeCentralityBehaviour` (U1), which writes node `size`. | P4 | CS1 CS2 CS4 | 📋 | 📋 |
| **B6** | **`GraphDiffBehaviour`** | Compare the live graph against an **in-memory snapshot** and mark added / removed / changed. Cut the edge (CS2), remove the supplier (CS4), run-vs-run (CS5). | B1 | CS2 CS4 CS5 | 🚧 §7 D4 | 📋 |

### 3.1 The B1 factoring — worth getting right

B2, B4 and B6 all want to say *"these elements matter, those don't"*. If each
writes `highlighted`/`dimmed` directly they will clobber one another exactly as
`ColorByLabelBehaviour` once clobbered consumer fill resolvers (fixed in
`dab4ad0` — the identity-guard comments in `ColorByLabelBehaviour.ts:121-131`
are the scar tissue from that bug, and are worth reading before writing B1).

**So: B1 owns the emphasis fields; the others compute a focal set and hand it
over.** One writer, one restore path, and a consumer can swap the emphasis
*presentation* without touching the three behaviours that drive it.

### 3.2 Three behaviours, three channels — no overlap

Colour, size and stroke width are owned by exactly one behaviour each. This is a
deliberate constraint (§7 D6): a general "encode any field onto any visual
channel" behaviour was considered and rejected, because it collides head-on with
`NodeCentralityBehaviour`'s existing size mapping.

```
ColorByBehaviour (U5)   ->  bgFill (node) · strokeColor + arrowTargetColor (edge)
NodeCentrality   (U1)   ->  style.size
EdgeCentrality   (B5)   ->  strokeWidth
```

The options are named neutrally (`field` / `scale` / `domain`) so a `channel`
option remains *additive* if the constraint is ever revisited.

### 3.3 What is deliberately *not* a behaviour

- **Evidence export (P3)** — an operation plus a UI surface, not an interaction.
- **`path()` / `reachableFrom()` (P2)** — queries on the data source. Behaviours
  call them; they don't belong in a behaviour.
- **Centrality algorithms (P4)** — betweenness and friends live beside the
  adjacency index. B5 and U1 are the behaviours that *apply* their output to
  styling.
- **The timeline scrub control (B4)** — pixels. It lives in `@invana/canvas-ui`.

---

## 4. Changes to existing behaviours

| ID | Class | Change | Why | Today | Effort |
|---|---|---|---|---|---|
| **U1** | `NodeCentralityBehaviour` | Consume P4's non-degree measures — **betweenness**, closeness, PageRank. Currently **degree only** (`'in'`/`'out'`/`'both'`, optionally weighted via `weightBy` or a field name), mapped to `style.size` through `linear`/`sqrt`/`log`. | Degree finds **hubs**; betweenness finds **bridges** — and every one of these stories is about a bridge. CS1's funnel account is *medium* degree and high betweenness, which is exactly why the ranked queue misses it. | ✅ built, degree-only | M — **blocked on P4** |
| **U2** | `ContextMenuBehaviour` | Bind the P1 verbs as items — `Isolate`, `Expand 1 hop`, `Path to…`, `Export evidence`. | A verb nobody can find isn't shipped. Also one of B2's three entry points (§4.2). | ✅ built | S — **blocked on P1** |
| **U3** | `LassoSelectBehaviour` / `BrushSelectBehaviour` | Route the resulting selection into a composite op rather than leaving it as raw selection. | Every focus beat: "lasso the cluster → isolate → pull 2 hops". | ✅ built; the op end is missing | S — **blocked on P1** |
| **U4** | `CollapseExpandBehaviour` | **Decide:** extend to fetch-and-grow, or keep collapse-only and ship B3 alongside. | It collapses what's loaded; it does not grow. | ✅ built, collapse-only | decision, then B3 |
| **U5** | `ColorByLabelBehaviour` → **`ColorByBehaviour`** | **Rename + modes.** Absorbs the first draft's B6. Gains `mode: 'categorical' \| 'range'`, serialisable field paths, numeric scales, auto domains, and pinned value colours. **Full design in §4.1.** | Colouring by category is one of two jobs the same mechanism does. Risk band, confidence, latency, amount are all the *same* template-field-resolver write with a different value→colour function. | ✅ built, categorical-only, non-serialisable field selection | **L** — the largest item in this table; see §4.1.8 |
| **U6** | Edge styling | **Verify** confidence-weighted edge width/alpha works via template field resolvers today. `strokeWidth` exists on edge style + state types. | CS3's `WeakestLink` — the weakest edge *is* the confidence interval. | ✅ likely already possible | S — **investigation first; may be zero code** |
| **U7** | `HoverElementPreviewBehaviour` | Provenance-shaped card content — source, licence, confidence, timestamp. | CS3 paper cards, CS1 transaction cards, CS5 chunk cards. | ✅ built | S — **story-level content, not engine work** |

---

### 4.1 U5 — `ColorByLabelBehaviour` → `ColorByBehaviour`

> 📄 **Full RFC: [`color-by-behaviour-rfc.md`](./color-by-behaviour-rfc.md)** —
> options design, semantics, domain scanning, legend contract, editor, migration,
> and a six-step implementation sequence. This section is the summary and the
> link into the parent decisions (D2, D6, D7, D9, D10, D11).

The first draft proposed a sibling `ColorByValueBehaviour` (B6). That is
withdrawn. Both write the *same* template fields on the *same* layer through the
*same* mechanism, so two behaviours would need the whole B1-style single-writer
discipline between them — to solve a problem that only exists because they were
split. One behaviour, two modes. (Reasoning and the reversal: §7 D2.)

#### 4.1.1 Naming and discriminator

| | Before | After |
|---|---|---|
| Class | `ColorByLabelBehaviour` | **`ColorByBehaviour`** |
| `kind` | `'color-by-label'` | **`'color-by'`** |
| Editor | `editors/behaviours/color-by-label/` | **`editors/behaviours/color-by/`** |
| Palette const | `DEFAULT_LABEL_PALETTE` | `DEFAULT_CATEGORY_PALETTE` |

`kind` is the stable, minification-safe key `CanvasSettingsEditorPanel` resolves
editors by — which is exactly why it gets fixed *now*, while there's one
consumer, rather than after `mode: 'range'` has shipped under a name that says
`label`.

#### 4.1.2 Options

> 📄 **The full options design lives in
> [`color-by-behaviour-rfc.md`](./color-by-behaviour-rfc.md) §2** — the interface,
> defaults, `ResolvedOptions` / `resolveOptions`, and the mode × scale validity
> matrix. Deliberately not duplicated here; duplicates rot.

The shape in one paragraph: `mode: 'categorical' | 'range'`; per-kind value
selection (`nodeValueKey` / `edgeValueKey` dot paths, with `nodeValueBy` /
`edgeValueBy` accessors as the escape hatch); the existing channel flags
(`colorNodes` / `colorEdges` / `fallbackColor`); `palette` + `valueColors` for
category; `scale` / `colorStops` / `bins` / `*Domain` / `*Thresholds` for range.
Everything new is optional and `mode` defaults to `'categorical'`, so the existing
constructor call is byte-for-byte valid and behaves identically.

**Two things the dedicated RFC settled that the first sketch had wrong** — both
found by writing the interface out before any implementation:

1. **The domain must be per-kind** (`nodeDomain` / `edgeDomain`), not one shared
   `domain`. Node risk `[0,1]` and edge latency `[0,250]` don't share a scale, so
   a single domain across both channels isn't a compromise — it's meaningless.
   Generalised to a rule: **unit-bearing options are per-kind; unit-free options
   are shared.**
2. **The naming is borrowed, not invented.** `NodeCentralityBehaviour` already
   ships the `weightKey` (serialisable, editor-exposed) / `weightBy` (function,
   supersedes it) pair, so field selection follows that convention instead of
   introducing a third one — which also resolves what §7.1 had open about
   range-mode accessors.

#### 4.1.3 Field selection — why the string path is the headline change

Today `nodeLabel` / `edgeLabel` are `(item) => string` callbacks
(`ColorByLabelBehaviour.ts:75-77`), and the editor explicitly drops them —
`color-by-label/types.ts:20`: *"accessor callbacks … are out of scope"*. So the
current editor can toggle nodes/edges and set a fallback colour, and **cannot
choose the property**. A function is not serialisable: it can't round-trip
through `view.definition`, can't be saved, can't be edited in the studio.

"Colour by property" is therefore not primarily a scale feature — it's a
**serialisation** feature. `nodeValueKey: 'data.riskScore'` is what makes the
property choosable from the editor (rule 12) and persistable with the
visualisation. The accessors stay as a documented escape hatch for computed keys
(`` `community-${n.data.group}` ``), and take precedence when supplied.

#### 4.1.4 Scales

| `scale` | Shape | Colour | Legend |
|---|---|---|---|
| `linear` / `log` / `sqrt` | continuous | normalise value into `[0,1]` via the kind's domain + the curve, then interpolate along `colorStops` | gradient bar |
| `quantile` | `bins` equal-count buckets, edges from the scanned values | one colour per bucket, sampled from `colorStops` at the bucket midpoint | one row per bin |
| `threshold` | explicit `nodeThresholds` / `edgeThresholds` → N+1 buckets | as above | one row per bin |

Binned scales are categorical in disguise — they reuse the category mode's
restore path and the legend's existing row model. Continuous scales are the ones
that need new machinery (interpolation, gradient legend).

**Interpolation is hand-rolled sRGB lerp** — roughly twenty lines in
`@invana/graph`, no new dependency. `@invana/graph` has zero 3rd-party deps by
design; taking `d3-interpolate` / `d3-scale-chromatic` for named ramps would set
a precedent for the sake of one lerp. Known cost, documented: sRGB interpolation
can pass near grey on some hue pairs (blue→yellow), so the shipped default stops
should be chosen to avoid it, and multi-stop ramps are the answer for wide
ranges. (Perceptual OKLCH interpolation was the considered alternative — ~60
lines instead of ~20. Revisit if sRGB visibly muddies in practice.)

#### 4.1.5 Domain — auto, and what that costs

With a kind's domain omitted, the behaviour scans that kind's selected field to
derive `[min, max]` — **nodes and edges scanned separately**, since they carry
different fields in different units (§4.1.2). An explicit `nodeDomain` /
`edgeDomain` wins and skips that kind's scan entirely.

**The scan re-runs on `data:changed`** (`GraphLayer.ts:521,716`), coalesced to
one recompute per frame. So the domain always agrees with what's loaded —
including after B3's expand-one-hop, which is the whole point.

⚠️ **The consequence is real and must be documented on the option:** loading a
node that widens the range **recolours every other node**. That is correct
behaviour for "colour by the range of what's here", and surprising for anyone
expecting stable colours across a streaming load. The `nodeDomain` / `edgeDomain`
override is the escape hatch, and the editor should say so in the field
description.

This is genuinely new machinery for this class: today the behaviour installs its
resolvers once on enable and never re-applies (`ColorByLabelBehaviour.ts:26-32`).
Auto-domain adds a subscription and a coalesced recompute — and the recompute
must **not** re-run the install path, only refresh the domain the installed
resolver closes over.

#### 4.1.6 Legend contract

`GraphLegendLayer` renders one row per node/edge **type**, reading the swatch
back off the effective style (`GraphLegendLayer.ts:1-24`). That model has no
answer for a continuous scale — and worse, with range mode on it would keep
showing type rows that **disagree with what's on screen**.

So the behaviour publishes what the legend should draw:

```ts
type ColorByLegendSection =
  | { kind: 'categories'; field: string; entries: { value: string; color: number }[] }
  | { kind: 'bins';       field: string; bins: { from: number; to: number; color: number }[] }
  | { kind: 'gradient';   field: string; domain: [number, number]; stops: readonly number[] };

class ColorByBehaviour {
  /** What a legend should render, **per coloured channel** — the two can carry
   *  different fields and domains (§4.1.2). Supersedes `getColorMap()` for range mode. */
  getLegend(): { nodes?: ColorByLegendSection; edges?: ColorByLegendSection };
  /** Retained for categorical mode — value → assigned colour. */
  getColorMap(): ReadonlyMap<string, number>;
}
```

`GraphLegendLayer` gains an explicit `colorByBehaviourId` option to source a
section from it — **an explicit id, per root rule 8**; never "the only colour
behaviour". Bins render as rows with counts (the existing model, unchanged);
continuous renders a gradient bar with domain end labels.

```text
 Nodes (by data.risk)          Nodes (by data.latencyMs)
  ●  0.0–0.2       12           [████▓▓▒▒░░]
  ●  0.2–0.5        8            0 ──────── 250
  ●  0.5–1.0        3
```

#### 4.1.7 Migration

- `ColorByBehaviour` is the class. `export { ColorByBehaviour as ColorByLabelBehaviour }`
  is a **deprecated alias** — every new option is optional and `mode` defaults to
  `'categorical'`, so existing call sites compile and behave identically.
- `DEFAULT_LABEL_PALETTE` stays exported as a deprecated alias of
  `DEFAULT_CATEGORY_PALETTE`.
- Instances constructed through the alias still report `kind = 'color-by'`, so
  the editor registry keeps a `'color-by-label'` → `color-by` editor alias for
  one release.
- The old `editors/behaviours/color-by-label/` folder is removed; its three
  fields (`colorNodes`, `colorEdges`, `fallbackColor`) become the shared section
  of the new editor.

#### 4.1.8 Scope — this is an L, not the "leave as-is" the first draft assumed

1. `@invana/graph` — rename + alias, `mode`, dot-path field resolution, five
   scales, sRGB lerp, `valueColors`, auto-domain + `data:changed` subscription,
   `getLegend()`.
2. `@invana/canvas-ui` — new `editors/behaviours/color-by/` with a **`fields`
   function** (mode + scale drive disjoint field sets, per the
   `DensityContourFillLayerEditorPanel` pattern), field-path input, a
   `valueColors` map editor, colour-stop inputs, registry alias.
3. `@invana/graph` — `GraphLegendLayer` bins-as-rows + gradient section, plus the
   `colorByBehaviourId` option.

### 4.2 B2 — entry points

`TraversalHighlightBehaviour`'s core is programmatic; the interactions are thin
drivers over it, so a story, a toolbar and a context menu can all reach the same
state (§7 D3).

```ts
behaviour.highlightPath(a, b);           // mode:'path'      — the core
behaviour.highlightReachable(a, opts?);  // mode:'reachable' — depth, direction
```

- **Context-menu verb (U2)** — select node A, right-click node B → *"Path to…"*.
  The discoverable path; reuses existing selection instead of inventing a second
  interaction mode. Blocked on P1.
- **Opt-in `pickMode`** — a modal two-click pick (source, target, Esc cancels)
  for consumers with no context menu. **Off by default**, because while armed it
  competes with `ClickSelectBehaviour` for the same clicks.

### 4.3 B6 — the snapshot

`snapshot()` captures ids plus the chosen fields into memory; `diff()` compares
the live graph against it and hands the added / removed / changed sets to B1. No
second `GraphStore`: it would double memory and require an id-correspondence
story that nothing currently asks for (§7 D4). If run-vs-run **across sessions**
turns out to be needed, the smallest next step is making the snapshot a
serialisable value the consumer can persist and hand back to `diff(snapshot)`.

---

## 5. Root rule 12 — the editor tax

Every new Behaviour ships:

1. **`override readonly kind = '<surface>'`** — the stable, minification-safe
   discriminator that lets `CanvasSettingsEditorPanel` resolve the editor without
   an `instanceof` map.
2. **A schema-driven editor** at
   `packages/canvas-ui/src/editors/behaviours/<surface>/` — the
   `fields.ts` + `mapping.ts` + `<Surface>EditorPanel` pattern, controlled inner
   + connected wrapper.

**Six new editors, plus two rewritten** — real scope, budgeted here rather than
discovered at the end.

| | Behaviour | `kind` | Editor path | Note |
|---|---|---|---|---|
| B1 | `FocalEmphasisBehaviour` | `focal-emphasis` | `editors/behaviours/focal-emphasis/` | new |
| B2 | `TraversalHighlightBehaviour` | `traversal-highlight` | `editors/behaviours/traversal-highlight/` | new — **`fields` function**: `mode` switches between path fields and depth/direction fields |
| B3 | `NeighbourhoodExpandBehaviour` | `neighbourhood-expand` | `editors/behaviours/neighbourhood-expand/` | new |
| B4 | `TimelineBehaviour` | `timeline` | `editors/behaviours/timeline/` | new — config only; the scrubber is a separate canvas-ui surface |
| B5 | `EdgeCentralityBehaviour` | `edge-centrality` | `editors/behaviours/edge-centrality/` | new |
| B6 | `GraphDiffBehaviour` | `graph-diff` | `editors/behaviours/graph-diff/` | new |
| U5 | `ColorByBehaviour` | `color-by` | `editors/behaviours/color-by/` | **rewritten** — replaces `color-by-label/`; `fields` function on `mode` + `scale`; registry alias for the old key |
| U1 | `NodeCentralityBehaviour` | `node-centrality` | *(existing)* | **extended** — new measures from P4 |

**The `fields`-as-a-function pattern carries this.** B2's two modes and U5's
mode×scale matrix both render disjoint field sets from one panel, using the
mechanism already in ~20 editors (§1.1). This is the fact that made both merges
possible; see §7 D1/D2.

---

## 6. Sequencing

```
P1 (ops layer)    ──┬──> U2, U3                   wire menus + selection to verbs
                    │
P2 (traversal)    ──┴──> B1 (emphasis driver)
                           ├──> B2 (traversal highlight) ──> CS1·CS2·CS3·CS4 demoable
                           └──> B6 (diff)

P4 (centrality)   ──────> B5 (edge centrality), U1 (node betweenness)

B3 (expand)   — needs P1 only; recover from git history
U5 (ColorByBehaviour), B4 (timeline), U6 (verify), U7 (card content)  — independent
P3 (export)   — independent, ships the "write it down" ending
```

### The minimum viable unlock

> **P1 + P2 + B1 + B2.**
>
> P1 has a finished design. P2 is a BFS over an index that already exists. B1
> drives states that already render. B2 is the interaction on top — and now
> covers *both* traversal questions (*A→B* and *from-A-everything*) in one
> behaviour.
>
> Land those four and **four of the five case studies become demoable**.
> Everything after is polish on a working narrative.

### Suggested order

1. **P1** — pure execution against a locked design; unblocks U2/U3 immediately
2. **P2** — small, on existing infrastructure
3. **B1 → B2** — the unlock
4. **B3** — recovery, not design
5. **P4 → B5, U1** — the CS2/CS4 analytical beats
6. **P3, B4, B6** — parallelisable, independent
7. **U6, U7** — verification and content

**U5 sits outside this order.** It depends on nothing in the list and is the
largest single item in §4 — pull it forward whenever it's wanted; it doesn't
block or get blocked by the traversal track.

---

## 7. Decisions

Every open question from the first draft, with its answer and the reasoning. Two
of them (**D1**, **D2**) reverse the draft's own recommendation, and for the same
reason — worth understanding before re-litigating either.

### The fact that reversed two recommendations

The first draft argued twice that merging two surfaces into one behaviour with a
`mode` option was bad, because *"one editor panel with two disjoint field sets —
which rule 12's schema-driven editors handle badly."*

**That premise was false.** `fields` may be a **function of the live form
values** — `DensityContourFillLayerEditorPanel.tsx:59-62` resolves
`typeof fields === 'function' ? fields(values) : fields` from a `useWatch`, and
the pattern is already used in roughly twenty editors across layers and
behaviours. A `mode` discriminator driving different field sets is the *normal*
case in this codebase, not a hardship. With the objection removed, both merges
are straightforwardly better: one writer per template field, one restore path,
one editor.

| | Question | Decision | Why |
|---|---|---|---|
| **D1** | Is reachability a mode of path-highlight, or its own behaviour? *(draft: separate)* | **One `TraversalHighlightBehaviour`,** `mode: 'path' \| 'reachable'` | They share the P2 query and the B1 emphasis hand-off; only the interaction and a couple of options differ. The draft's objection was the editor-panel one above, which doesn't hold. One emphasis-writer instead of two. |
| **D2** | Continuous colour as a sibling behaviour, or a mode on the existing one? *(draft: sibling)* | **One `ColorByBehaviour`** — rename + `mode: 'categorical' \| 'range'` (§4.1) | Same objection, same collapse. Decisive addition: two behaviours would write the *same* template fields on the *same* layer, so they'd need B1-style single-writer discipline between them — solving a problem created by the split. `dab4ad0` is what that failure looks like. |
| **D3** | What drives path endpoint selection? | **Programmatic core + both entry points** (§4.2) | `highlightPath(a, b)` is the API; the U2 context-menu verb is the discoverable driver; `pickMode` is opt-in and off by default because it competes with `ClickSelectBehaviour` for clicks. |
| **D4** | Does diff need a second `GraphStore`? | **In-memory snapshot** | Covers all three case-study beats. A second store doubles memory and needs id-correspondence rules nothing asks for. Serialisable snapshots are the documented next step if cross-session run-vs-run appears. |
| **D5** | Does the timeline own its scrub control? | **Behaviour in `@invana/graph`, control in `@invana/canvas-ui`** | The split the repo uses everywhere — headless vs pixels. The behaviour filters and exposes `setTime`/`play`/`range`; a self-wiring `TimelineToolbar` drives it through canvas-react hooks. Rule 12's editor covers config; the scrubber is live control, not config. |
| **D6** | Does colour-by generalise to any visual channel? | **No — colour only** (§3.2) | A general `channel: 'fill' \| 'size' \| 'alpha' \| …` behaviour collides head-on with `NodeCentralityBehaviour`'s existing size mapping. Three behaviours, three channels, no overlap. Options are named neutrally so a `channel` option stays additive. |
| **D7** | Where do colour stops come from, and how are they interpolated? | **Numeric `colorStops`, hand-rolled sRGB lerp** (§4.1.4) | ~20 lines, no dependency — `@invana/graph` has zero 3rd-party deps by design, and algorithm libs live in layout/layer packages. Cost accepted and documented: sRGB can pass near grey on some hue pairs. OKLCH (~60 lines) is the revisit if that bites; `d3-scale-chromatic` is the revisit if named scientific ramps are wanted. |
| **D8** | Where is betweenness computed? | **`graph/src/store/algorithms/`, beside `AdjacencyIndex`** (P4) | Both U1 (node) and B5 (edge) need it, so it can't live in either. A behaviour is the wrong home for an O(VE) algorithm. Same folder as P2's BFS. Not a separate package: no 3rd-party dep to isolate. |
| **D9** | Can category mode pin values to colours? | **Yes — `valueColors`, palette fills the rest** | First-appearance palette order means `'failed'` gets whatever colour is next, and that changes with data arrival order. Colouring by an arbitrary property (status, severity, tier) carries semantic expectations. Serialisable, so the editor can expose it. |
| **D10** | When does the auto colour-domain rescan? | **On `data:changed`, coalesced to one recompute per frame** (§4.1.5) | Keeps the domain honest after B3's expand. Documented consequence: widening the range recolours everything — the `domain` override is the escape hatch. |
| **D11** | Node field selection — accessor or path? | **Serialisable dot path primary, accessor escape hatch** (§4.1.3) | Functions can't round-trip through `view.definition`, so accessor-only means the studio can never choose the property. Path-only would break computed keys. Both, with the accessor winning when present. |

### 7.1 Still open — detail level, not shape

Small enough to settle in review of the first patch, not blocking.

1. ~~**Range-mode accessors.**~~ **Resolved** in
   [`color-by-behaviour-rfc.md`](./color-by-behaviour-rfc.md) §2.2 — one
   `*ValueKey` / `*ValueBy` pair per kind, following
   `NodeCentralityBehaviour`'s existing `weightKey` / `weightBy` convention
   rather than splitting accessors by mode. `nodeLabel` / `edgeLabel` become
   deprecated aliases of `nodeValueBy`.
2. **Default `colorStops`.** Now scoped to picking the specific stops: the
   dedicated RFC (§3.4) settles it should be a *sequential single-hue* ramp,
   which sidesteps the sRGB grey-midpoint problem (D7) rather than mitigating it.
   Theme `ColorRole` stops remain deferred and additive.
3. **U4** — extend `CollapseExpandBehaviour` to fetch-and-grow, or keep it
   collapse-only and ship B3 alongside? Unchanged from the first draft; still a
   decision, and it gates how B3 is recovered from git history.

The remaining `ColorByBehaviour` detail items now live in
[`color-by-behaviour-rfc.md`](./color-by-behaviour-rfc.md) §10.
