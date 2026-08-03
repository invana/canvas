# RFC — `type` becomes required on the stored record

**Status:** 🚧 in progress — the core has landed; the migration (§9) has not.
**Decision taken (2026-08-03), then reversed the same day:** approach **(A)** —
**one `GraphNode`, `type` required, every author writes it.**

> (B) — a separate `GraphNodeInput` with `type` optional — was built and reverted.
> It works and costs almost nothing to migrate, but it means two types to keep
> straight for one field, and that ergonomic weight outweighed the saving.
> **The measured cost of (A) is also far lower than §3 first claimed** — see
> §3.1, where the headline "24,683 records" turned out to be two edits. §9 is the
> migration plan.
**Package:** `@invana/graph` (types + `GraphStore` + a handful of readers).
`@invana/graph-datasets` and `apps/storybook` are **untouched** — that's the point.
**Driver:** `node.type` should be a `string` everywhere downstream, so readers
stop writing `?? '(untyped)'` and behaviours can key off it unconditionally.

---

## 1. What changes

**One type. `type` is required, everywhere.**

```ts
interface GraphNode<D = unknown> {
  id: string;
  type: string;          // ← was `type?: string`
  …
}
```

There is no `GraphNodeInput`. An author writes `type` on every record; a reader
gets a `string` without a guard. The field that used to be optional simply
isn't.

### 🔒 The sentinel — `UNKNOWN_TYPE`

```ts
/**
 * The `type` assigned to a record inserted without one.
 *
 * A named export rather than a bare literal so consumers can filter or branch on
 * it (`node.type === UNKNOWN_TYPE`) without a magic string, and so a future
 * rename is one edit.
 */
export const UNKNOWN_TYPE = 'unknown';
```

### 🔒 Normalisation stays — as a runtime net, not the mechanism

With `type` required, TypeScript catches an omission at authoring time, so the
store's default is no longer how records *get* a type. It is kept anyway,
because three paths bypass the compiler entirely:

- **`importData`** of a snapshot written before this change (§7.2).
- **JSON parsed at runtime** — a feed, a fixture, a `fetch`.
- **`updateNode(id, patch)`** — `Partial<GraphNode>` makes `type` optional
  again, so `{ type: '' }` type-checks.

So it is defence, and cheap. **Both** insert paths, using `||` not `??`:

```ts
// GraphStore.installNode
node = { ...node, type: node.type || UNKNOWN_TYPE };

// GraphStore.installEdge — same, no exceptions
edge = { ...edge, type: edge.type || UNKNOWN_TYPE };
```

**`||`, deliberately.** `??` only catches `null` / `undefined`, so `type: ''`
would satisfy the required-string type system and sail straight through —
producing an empty legend row, an empty colour category, and a record that is
technically typed and practically not. `||` collapses `undefined`, `null` and
`''` to the same place. The cost is that a caller cannot deliberately store an
empty-string type, which is not a thing anyone should want.

Both kinds normalise. An edge without a predicate is exactly as common as a node
without an entity kind — `citations` has 402 typeless edges under typed nodes —
so exempting edges would leave half the guarantee unmet.

**The guarantee:** every read path — `store.nodes()`, `resolveNodeStyle`,
behaviours, the legend, serialization — sees a `string`. The optionality is
confined to the one boundary where a human is authoring data.

---

## 2. Where the normalisation lands

Three facts found while assessing. The first two still matter; the third is why
(B) was tried at all, and is now resolved by W6 instead.

1. **There is exactly one insert chokepoint per kind.** Every path —
   `addNode`, `addNodesBulk`, `setData`, the update-or-insert branch at
   `GraphStore.ts:731` — funnels into `installNode` / `installEdge`
   (4 call sites total, `GraphStore.ts:724,734,888,1494`).
2. **The input/stored split is already designed** — `docs/data-types-instances.md`
   is literally *"input vs stored instances (NodeData/NodeOption split)"*, and
   `layer/types.ts` declares both `NodeData` ("as stored by `GraphStore`") and
   `NodeInput` ("what the consumer passes to `GraphLayer.setData`").
3. ⚠️ **…but it was never wired.** `GraphData.nodes` is typed `GraphNode[]`
   (`layer/types.ts:130`), not `NodeInput[]`, and `NodeData` / `NodeInput` appear
   in **no runtime code at all** — only in TSDoc cross-references. So `setData`
   currently takes the *stored* type directly, and one interface is doing both
   jobs.

Under (A) the split isn't needed at all: `GraphData` keeps taking `GraphNode`,
and the dead `NodeData` / `NodeInput` cluster is simply deleted (W6, §6) rather
than wired. One stored type, no input type, nothing else.

---

## 3. The two approaches, measured

Both were built. (B) landed first, then was reverted in favour of (A).

| Surface | (A) — one type, required | (B) — separate input type |
|---|---|---|
| `@invana/graph` | 141 compile errors | ~6 files |
| `@invana/graph-datasets` | 12 files, **few edits each** (§3.1) | 12 files (annotation swap only) |
| `apps/storybook` | **2,546 literal sites** across 232 files | 0 |
| `@invana/canvas-ui` | 5 files | 0 |
| Types to keep straight | **1** | 2 |
| Every future story | writes `type` | nothing |

(B) is objectively cheaper to migrate and was recommended on that basis. (A) was
chosen anyway, because one type for one field is worth more than the migration
saving — and because the migration is both smaller and more *valuable* than the
raw count suggests.

### 3.1 Correcting the scary number

The first draft's headline was that `h1b2019AsGraph` alone needs
**24,683 nodes / 24,682 edges** typed. That is the record count, not the edit
count, and it was misleading.

Measured: `h1b2019`, `flare`, `life-tree` and `lattice` contain **zero literal
node lines** — every record is produced inside a `.map()` or a loop. Adding a
type is **one edit per generator**, not one per record.

| Where | Records | Literal sites needing an edit |
|---|--:|--:|
| `h1b2019` | 49,365 | **~2** |
| `flare` / `flare-imports` | ~750 | ~4 |
| `life-tree` | 581 | ~2 |
| `lattice`, `random-tree` | generated | ~2 each |
| `les-miserables` | 331 | **77** (hand-authored literals) |
| `apps/storybook` | — | **2,546** (median 7 per file, max 91) |

So the real shape of the work is: **a dozen dataset generators, one line each**,
plus a long tail of small storybook fixtures. Which is what makes §9 tractable.

### 3.2 What survived the revert

The (B) implementation is not wasted. Everything except the input types carries
over unchanged and is **already landed**:

- ✅ `UNKNOWN_TYPE` exported from `@invana/graph`
- ✅ `type: string` required on `GraphNode` / `GraphEdge`
- ✅ `installNode` / `installEdge` normalise with `||`
- ✅ `updateNode` / `updateEdge` normalise on patch
- ✅ W6 — the dead `NodeData` / `NodeInput` / `EdgeData` / `EdgeInput` /
  `GraphDataOptions` cluster deleted
- ✅ 6 normalisation tests (`tests/store/typeNormalisation.test.ts`), 102/102 green

**To revert:** delete `GraphNodeInput` / `GraphEdgeInput`, put the ~10 store
signatures back to `GraphNode` / `GraphEdge`, and revert the 12 dataset
annotation swaps — which then become §9's real work.

---

## 4. What `'unknown'` changes semantically

`type: UNKNOWN_TYPE` is a *value*, not an absence, so anything that partitions by
type would see one large bucket where it previously saw nothing.

**The §4.2 decision removes most of that.** `ColorByBehaviour` treats
`UNKNOWN_TYPE` as a **sentinel**, not a category — so the visual behaviour of
every currently-typeless dataset is **unchanged**. What remains is a smaller,
mostly-cosmetic set:

| Site | Today | After |
|---|---|---|
| **`ColorByBehaviour`** (default `nodeValueKey: 'type'`) | typeless data → every node `fallbackColor` (grey) | **unchanged** — grey, via the §4.2 sentinel rule instead of via an unresolved path |
| **`GraphLegendLayer:651`** — `if (… type === undefined) return` | typeless elements skipped, no legend rows | the guard becomes dead and is simply removed. Typeless datasets **gain an `unknown` row** — which is the point: the legend's job is to inventory what's in the graph (§8 Q8) |
| **`LayersViewPanel:285`** — `el.type ?? '(untyped)'` | shows `(untyped)` | shows `unknown`; the fallback becomes dead |
| **`ClickSelectBehaviour:418`** — `el.type ?? 'shape'` | shape-kind fallback | `'unknown'`; the fallback becomes dead |
| **15 dataset `settings`** carrying `color: { enabled: false }` | TSDoc says *"characters have no `type` … nothing to partition by"* | **the stated reason becomes false.** The setting should stay off, but because colouring everything one colour is *pointless*, not because it's *impossible* |

### 4.1 🔒 `MissingField` gets repointed (resolved 2026-08-03)

The `MissingField` story (`graph/Behaviours/ColorBy/MissingField`) shows that an
**unresolved path yields grey**, using Les Mis's absent `type` as the example.

Under §4.2 the story would in fact still render grey unchanged — `type` resolves
to `UNKNOWN_TYPE`, which the sentinel rule sends to `fallbackColor`. **It is being
repointed anyway**, at an obviously-absent path (`data.nosuchfield`), because the
two now produce grey for *different reasons* and the story should demonstrate
exactly one of them:

| Cause | Mechanism | Demonstrated by |
|---|---|---|
| Path doesn't resolve | `toCategory(undefined)` → `null` → `fallbackColor` | **`MissingField`**, repointed |
| Path resolves to `UNKNOWN_TYPE` | §4.2 sentinel → `fallbackColor` | 🔧 **nothing yet — §8 Q9** |

Repointing keeps the story's subject single and its prose verbatim, and the
gui-driven fix (set the key to `data.group` → you have `ByCommunity`) still works.

### 4.2 🔒 `UNKNOWN_TYPE` is a colouring sentinel (resolved 2026-08-03)

`ColorByBehaviour` treats the literal `UNKNOWN_TYPE` as **`fallbackColor`, not a
palette category**. An untyped node renders grey, exactly as it does today.

The tradeoff was between two invariants, and this preserves the stronger one:

- ✅ **"grey means no information" stays true.** The alternative — untyped nodes
  taking the first palette colour — produces a graph that *looks* deliberately
  coloured while carrying no signal, which is the failure mode the whole
  behaviour is meant to avoid (cf. the `MaxCategories` guard, same reasoning).
- ✅ **Zero visual change** for the 15 datasets that ship untyped data.
- ⚠️ **Accepted cost: `UNKNOWN_TYPE` becomes a reserved string.** A consumer who
  deliberately types a node `'unknown'` gets grey rather than a palette colour.
  This must be stated in `ColorByBehaviour`'s TSDoc and in the `UNKNOWN_TYPE`
  export's — it is the one place this RFC trades a little purity for a lot of
  continuity.

---

## 5. Work register

| ID | Task | Package | Notes |
|---|---|---|---|
| **W1** | `GraphNode.type` / `GraphEdge.type` → required | `graph/src/store/types.ts:24,91` | the two-line core |
| ~~W2~~ | ~~Add `GraphNodeInput` / `GraphEdgeInput`~~ | — | ❌ **dropped** — (A) keeps one type; see §3.2 and §9.1 |
| **W3** | Default in `installNode` / `installEdge` | `graph/src/store/GraphStore.ts` | 4 call sites already funnel here |
| **W4** | `updateNode(id, patch: Partial<GraphNode>)` — confirm `Partial` still allows omitting `type` | `GraphStore.ts:738` | it does; listed so it's checked, not assumed |
| **W5** | Retire the 4 dead fallbacks (§4 table) | `graph`, `canvas-ui` | mechanical |
| **W6** | Delete the dead `NodeData` / `NodeInput` / `EdgeData` / `EdgeInput` cluster | `graph/src/layer/types.ts` | **Fully scoped in §6.** 5 interfaces, 3 barrel files, zero runtime users |
| **W7** | Rewrite the 15 dataset TSDoc blocks whose stated reason changes | `graph-datasets` | comments only, no data edits |
| **W8** | Repoint or delete the `MissingField` story (§4.1) | `apps/storybook` | |
| **W10** | `ColorByBehaviour` — treat `UNKNOWN_TYPE` as `fallbackColor`, not a palette category (§4.2). Document the reserved string in its TSDoc and on the `UNKNOWN_TYPE` export | `graph` | keeps every untyped dataset looking exactly as it does today |
| **W11** | `exportData` — omit `type` when it equals `UNKNOWN_TYPE` (§7.2), + the TSDoc note on export≠stored | `graph/src/layer/GraphLayer.ts:653` | ~1 MB saved on the largest snapshot |
| **W12** | `GraphLegendLayer` — drop the dead `type === undefined` guard; **do not** add an `UNKNOWN_TYPE` skip (§8 Q8) | `graph/src/layer/GraphLegendLayer.ts:651` | the legend reports every type present, `unknown` included |
| **W13** | The §9 migration — datasets, codemod, readers | `graph-datasets`, `apps/storybook` | the bulk of the work; see §9 |
| **W9** | Update the data-model docs | `docs/data-types-instances.md`, `data-types-implementation-plan.md`, `node-edge-options-plan.md`, `canvas-store-state-inventory.md`, `apps/docs/graph/data-model.md`, `apps/docs/graph/store-plan.md`, `packages/graph/CLAUDE.md` | 7 files declare `type?: string` as the contract |

**Sequencing:** W1–W3 land together (the type is briefly inconsistent between
them). W4–W5 immediately after. W6 is the one that could grow — scope it before
starting. W7–W9 are documentation and can trail.

## 6. W6 — the dead type cluster, scoped

**Every reference, repo-wide.** Traced rather than estimated:

| Symbol | Declared | Re-exported | Runtime users |
|---|---|---|---|
| `NodeData<D>` | `layer/types.ts:1152` | `layer/index.ts:62`, `src/index.ts:68` | **none** |
| `NodeInput<D>` | `layer/types.ts:1188` | `layer/index.ts:69`, `src/index.ts:75` | `GraphDataOptions` only |
| `EdgeData<D>` | `layer/types.ts:1346` | `layer/index.ts:54`, `src/index.ts:60` | **none** |
| `EdgeInput<D>` | `layer/types.ts:1366` | `layer/index.ts:55`, `src/index.ts:61` | `GraphDataOptions` only |
| `GraphDataOptions<DN,DE>` | `layer/types.ts:1459` | `layer/index.ts:59`, `src/index.ts:65` | **none** |

So the cluster is a closed loop: `GraphDataOptions` is the sole consumer of
`NodeInput` / `EdgeInput`, and nothing consumes `GraphDataOptions`. `NodeData`
and `EdgeData` have no consumer at all — they survive only as `{@link}` targets
in other types' TSDoc (`layer/types.ts:1197,1375`, and the `state` / `states`
explanation at `:1136`).

> The one apparent hit outside `@invana/graph` —
> `rag-embeddings/EmbeddingExplorer.stories.tsx:42` — is a **coincidence**: a
> locally-declared `RagEmbeddingsNodeData` interface. Not related.

**Scope of the deletion:** 5 interfaces removed from `layer/types.ts`, 5 lines
from `layer/index.ts`, 5 from `src/index.ts`, and ~4 `{@link NodeData.x}`
references in neighbouring TSDoc repointed at `GraphNode` / `GraphEdge`. No
runtime code changes.

**Why delete rather than wire.** The tempting move is to make `NodeInput` the new
input type instead of introducing `GraphNodeInput` (W2) — the name is right and
it's already exported. Two reasons not to:

1. **`NodeInput` is a different shape**, not just a laxer one. It carries
   `ResolvableId<D>` ids and `ResolvableNodeStyle<D>` fields — *functions* that
   fire once at insert. `GraphData` accepts none of that today, and nothing
   implements it. Adopting the name means either implementing resolver-at-insert
   (a real feature, out of scope here) or shipping a type that lies about what
   `setData` accepts.
2. **`NodeData` vs `GraphNode` is the actual bug.** Two interfaces both claim to
   be "the stored record" — `NodeData`'s TSDoc says *"as stored by `GraphStore`"*
   while `GraphStore` demonstrably stores `GraphNode`. Leaving both in place and
   adding a third input type would make it worse. One stored type, one input
   type, nothing else.

⚠️ **These are public exports**, so removal is technically breaking even though
nothing in-repo uses them. Given the package is pre-1.0 and they have never been
functional, recommend deleting outright and noting it in the same
`BREAKING CHANGE` footer as W1. **W6 can also land independently, before W1** —
it's pure removal and doesn't depend on the rest of the RFC.

---

## 7. Serialization — what round-trips, and what grows

Traced every path that copies a record out of the store.

### 7.1 The paths

| Path | What it does | Effect |
|---|---|---|
| **`GraphLayer.exportData()`** (`GraphLayer.ts:653`) | `{ nodes: [...store.nodes()], edges: [...store.edges()] }` — spreads the **stored** records | `type` is present, already normalised. **Snapshots gain `"type":"unknown"` on every previously-typeless record.** |
| **`GraphLayer.importData()`** (`:664`) | delegates to `setData` → `installNode` | Re-normalises. **Idempotent** — `'unknown' \|\| UNKNOWN_TYPE` is `'unknown'`. |
| **`Canvas.exportState()`** (`stateExport.ts:173,255`) | calls the two above per layer | inherits both properties |
| **`GraphClipboard`** (`GraphClipboard.ts:65,137`) | buffers `GraphNode[]` from the store, re-inserts as `{ ...node, id: newId }` | `type` carries through unchanged; stays normalised |
| **`GraphHistory`** (`GraphHistory.ts:160`) | journals `{ ...node }` — the **caller's** argument, not the stored record | undo/redo replays the original input, which re-normalises on insert. Harmless; noted so nobody "fixes" it into journalling the stored record |
| **`GraphLayer.serializeDefinition()`** (`:681`) | layer *config*, not data — includes the `nodeTypes` template registry | unaffected by record type |

### 7.2 Two conclusions

**Old snapshots are safe — no migration needed.** A scene exported before this
change has typeless records; on import they pass through `installNode` and come
out `'unknown'`. That is exactly the intended value, so backward compatibility is
free rather than engineered.

**New snapshots get bigger, and that's worth fixing.** Every previously-typeless
record gains ~20 bytes of `"type":"unknown"`. On the largest dataset —
`h1b2019AsGraph`, 24,683 nodes and 24,682 edges — that is **roughly 1 MB of pure
padding** in an exported scene, encoding no information whatsoever.

🔒 **Resolved 2026-08-03 — omit it.** `exportData` drops `type` when it equals
`UNKNOWN_TYPE`, because import puts it back. The round-trip stays lossless, the
snapshot stays lean, and the rule reads as one sentence:

> **The absence of `type` means `UNKNOWN_TYPE` — on the way in and on the way out.**

The accepted cost is that an exported record and a stored record no longer look
identical. That asymmetry is worth one line in `exportData`'s TSDoc, since a
reader diffing a snapshot against `store.nodes()` would otherwise be puzzled.

---

## 8. Open questions

**Resolved 2026-08-03**

1. ~~Does `'unknown'` belong in a constant?~~ ✅ Yes — `UNKNOWN_TYPE`. §1.
2. ~~Should empty string normalise too?~~ ✅ Yes, via `||`, on **both** insert
   paths. §1.
3. ~~What is W6's scope?~~ ✅ 5 interfaces, 3 barrels, zero runtime users; delete
   rather than wire, and it can land independently. §6.
4. ~~Does anything serialize `type` and round-trip it?~~ ✅ Six paths traced; old
   snapshots need no migration. §7.
5. ~~Should `exportData` omit `type` when it equals `UNKNOWN_TYPE`?~~ ✅ **Omit.**
   §7.2.
6. ~~Category or sentinel in `ColorByBehaviour`?~~ ✅ **Sentinel** — untyped nodes
   stay grey. §4.2.
7. ~~Repoint or delete `MissingField`?~~ ✅ **Repoint** at `data.nosuchfield`. §4.1.

**Still open — both raised *by* the sentinel decision (6)**

8. ~~Should `GraphLegendLayer` also skip `UNKNOWN_TYPE`?~~ ✅ **Resolved
   2026-08-03 — no. The legend shows every node and edge type present, including
   `unknown`, even when it can't derive a colour for one.**

   The two legend sources answer different questions, and it's correct that they
   differ:

   | Source | Question it answers |
   |---|---|
   | `ColorByBehaviour.getLegend()` | *"what does this colouring mean?"* — so the sentinel is excluded; it isn't part of the encoding |
   | `GraphLegendLayer` | *"what is in this graph?"* — so every type is listed, `unknown` included, with whatever swatch the effective style yields |

   A legend that silently omits 77 of 77 nodes is worse than one that says
   `unknown — 77` in grey. **This also makes W12 pure deletion** rather than a
   swap.
9. **Does the sentinel path deserve its own story?** §4.1's table shows two
   distinct causes now produce grey — an unresolved path (covered by the
   repointed `MissingField`) and a resolved-but-`UNKNOWN_TYPE` value (covered by
   nothing). A ninth ColorBy story would demonstrate it. *(Leaning: no. Once
   `MissingField` exists, a second all-grey story teaches little, and the rule is
   better documented in TSDoc than shown twice.)*

---

## 9. Migration plan

The guiding rule, and the reason this is worth doing rather than merely
survivable:

> **`UNKNOWN_TYPE` is the fallback, not the migration strategy.** A record gets
> a *meaningful* type wherever the data has one. `'unknown'` is for records that
> genuinely have no kind — and after §9.2 there are very few.

That is what turns a 2,500-edit chore into a payoff: today **15 datasets ship
with colour-by-type disabled** because there is nothing to partition by
(§4). After this, most of them can turn it on.

### 9.1 Phase 0 — revert (B) *(~30 min)*

Delete `GraphNodeInput` / `GraphEdgeInput`; restore `GraphNode` / `GraphEdge` on
`addNode`, `addEdge`, `addNodesBulk`, `addEdgesBulk`, `upsertNode`, `upsertEdge`,
`installNode`, `installEdge`, `tryAdmitPending`, `handleUnknownEndpoint`,
`PendingEdges`, `GraphData`, and the two behaviour factories. Everything in
§3.2's ✅ list stays. Expect ~141 errors to reappear — that is Phase 1's worklist.

### 9.2 Phase 1 — datasets get *real* types *(~12 files, high value)*

One edit per generator. Proposed types, chosen from what each dataset already
knows about itself:

| Dataset | Node type(s) | Edge type(s) | Source of the distinction |
|---|---|---|---|
| `les-miserables` | `'character'` | `'co-appears-with'` | uniform — 77 literals, one sed |
| `old-faithful` | `'eruption'` | — | uniform |
| `flare` / `flare-imports` | `'package'` / `'class'` | `'contains'` / `'imports'` | **`isLeaf` already exists** |
| `h1b2019` | `'state'` / `'city'` / `'employer'` | `'contains'` | **`depth` already exists** |
| `life-tree` | `'clade'` / `'species'` | `'descends-from'` | **`isLeaf` already exists** |
| `uk-energy-flow` | `'stage'` | `'flows-to'` | could refine via `data.category` |
| `lattice`, `random-tree` | `'cell'` / `'node'` | `'link'` | uniform |
| `citations` | *(typed)* | `'cites'` | edges only |
| `microservices` | *(typed)* | `'calls'` | edges only |
| `ontology` | *(typed)* | per-predicate | edges only |
| `agent-trace`, `modeller-seed` | per record | per record | small |

The three marked **bold** are the interesting ones: `flare`, `h1b2019` and
`life-tree` already carry `isLeaf` / `depth`, so a one-line ternary gives them a
genuine two- or three-way partition where they currently have none — and
colour-by-type starts working on datasets where it was previously pointless.

Then **W7**: rewrite the 15 dataset TSDoc blocks whose stated reason
(*"characters have no `type` … nothing to partition by"*) is now false, and flip
`color: { enabled: false }` → `true` wherever the new types make it meaningful.

### 9.3 Phase 2 — storybook fixtures *(2,546 sites, codemod-assisted)*

Too many to hand-edit, uniform enough to automate. **ts-morph**, type-directed
rather than regex, so it only touches literals that actually land in a
`GraphNode` / `GraphEdge` position:

1. Type-check the project; collect every `TS2741: Property 'type' is missing`
   diagnostic — that is the exact worklist, no guessing about which literals matter.
2. For each, insert `type: <T>` immediately after `id:`.
3. Pick `<T>` per **file**, not per record — a story's fixture is almost always
   one homogeneous graph. Default `'node'` / `'edge'`; use `UNKNOWN_TYPE` only
   where the story's subject *is* the absence of a type.
4. Re-run until the diagnostic set is empty.

Review the diff by sampling rather than reading 232 files: the codemod's output
is mechanical, and `check-types` plus the story screenshots are the real gate.

> ⚠️ **`MissingField` must be excluded from the codemod.** Its subject is a
> record with no meaningful type; giving it `'node'` silently destroys the story.
> It gets `UNKNOWN_TYPE` and the §4.1 repoint by hand.

### 9.4 Phase 3 — reader cleanup *(W5, W10–W12)*

Only now that every producer is fixed:

- Delete the four `?? '(untyped)'` / `?? 'shape'` fallbacks (§4) — **this is the
  payoff, and it is not available under (B).**
- W10 `ColorByBehaviour` sentinel · W11 export omission · W12 legend guard.
- W9 docs.

### 9.5 Sequencing and risk

```
Phase 0 (revert)  →  Phase 1 (datasets)  →  Phase 2 (codemod)  →  Phase 3 (readers)
   ~30 min             ~12 files             2,546 sites           ~10 files
                       ↑ the valuable bit    ↑ the bulk            ↑ the payoff
```

**The repo does not compile between Phase 0 and the end of Phase 2.** That is
unavoidable with a required field and is the main cost of (A) over (B) — so
Phases 0–2 should land as **one commit**, not three. Phase 3 can follow
separately.

**Rollback:** if Phase 2 goes badly, reverting to (B) is mechanical — re-add the
two input types and the signatures. The `UNKNOWN_TYPE` constant, the
normalisation, the tests and W6 hold under either.
