# RFC — `type` becomes required on the stored record

**Status:** 📋 proposed — no code written.
**Decision taken (2026-08-03):** approach **(B)** — required on the *stored*
record, defaulted at the store boundary. Approach (A), requiring every author to
write it, is recorded in §3 with its measured cost and why it lost.
**Package:** `@invana/graph` (types + `GraphStore` + a handful of readers).
`@invana/graph-datasets` and `apps/storybook` are **untouched** — that's the point.
**Driver:** `node.type` should be a `string` everywhere downstream, so readers
stop writing `?? '(untyped)'` and behaviours can key off it unconditionally.

---

## 1. What changes

```ts
// stored — what GraphStore holds and every reader sees
interface GraphNode<D = unknown> {
  id: string;
  type: string;          // ← was `type?: string`
  …
}

// input — what a consumer hands to setData
interface GraphNodeInput<D = unknown> extends Omit<GraphNode<D>, 'type'> {
  type?: string;         // ← stays optional; omitted means 'unknown'
}
```

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

### 🔒 Normalisation — **both** insert paths, using `||` not `??`

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

## 2. Why the boundary already exists

Three facts found while assessing, and together they make (B) nearly free:

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

Point 3 is the honest cost of this RFC: it isn't "add a `??`", it's **finishing a
split the codebase already documents**. That's still small, and it pays down an
existing inconsistency rather than adding one.

---

## 3. The alternative, measured

Approach **(A)** — make `type` required and let every author write it — was
measured by flipping the declaration, compiling, and reverting.

| Surface | Cost under (A) | Cost under (B) |
|---|---|---|
| `@invana/graph` | **141 compile errors** | ~6 files (§5) |
| `@invana/graph-datasets` | **11 of ~24 exports** need edits — 400 typeless nodes + 727 typeless edges in plain exports, plus `h1b2019AsGraph` at **24,683 / 24,682** | **0** |
| `apps/storybook` | **232 of 301 files** that build records inline never set a type | **0** |
| `@invana/canvas-ui` | 5 files | 0 |
| Every future story | must write `type: 'unknown'` forever | nothing |

> Downstream error counts under (A) could not be measured cleanly: while `graph`
> has 141 errors its DTS build fails, so `@invana/graph/dist/index.d.ts`
> disappears and storybook reports 387 errors of which **235 are
> "could not find a declaration file"** cascade rather than real type errors.
> Real downstream numbers only become measurable after `graph` itself compiles.
> The per-file counts above are source-level and are the reliable figures.

(A) buys nothing (B) doesn't: the downstream guarantee is identical. It just
charges ~250 file-edits for it, permanently taxes every new story, and — because
`'unknown'` would be hand-written 25,000 times in generated data — invites typos
that `'unknown'`-as-a-default cannot have.

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
| **W2** | Add `GraphNodeInput` / `GraphEdgeInput` (`Omit<…,'type'> & { type?: string }`) and retype `GraphData` | `graph/src/layer/types.ts:130` | finishes the split §2.3 describes |
| **W3** | Default in `installNode` / `installEdge` | `graph/src/store/GraphStore.ts` | 4 call sites already funnel here |
| **W4** | `updateNode(id, patch: Partial<GraphNode>)` — confirm `Partial` still allows omitting `type` | `GraphStore.ts:738` | it does; listed so it's checked, not assumed |
| **W5** | Retire the 4 dead fallbacks (§4 table) | `graph`, `canvas-ui` | mechanical |
| **W6** | Delete the dead `NodeData` / `NodeInput` / `EdgeData` / `EdgeInput` cluster | `graph/src/layer/types.ts` | **Fully scoped in §6.** 5 interfaces, 3 barrel files, zero runtime users |
| **W7** | Rewrite the 15 dataset TSDoc blocks whose stated reason changes | `graph-datasets` | comments only, no data edits |
| **W8** | Repoint or delete the `MissingField` story (§4.1) | `apps/storybook` | |
| **W10** | `ColorByBehaviour` — treat `UNKNOWN_TYPE` as `fallbackColor`, not a palette category (§4.2). Document the reserved string in its TSDoc and on the `UNKNOWN_TYPE` export | `graph` | keeps every untyped dataset looking exactly as it does today |
| **W11** | `exportData` — omit `type` when it equals `UNKNOWN_TYPE` (§7.2), + the TSDoc note on export≠stored | `graph/src/layer/GraphLayer.ts:653` | ~1 MB saved on the largest snapshot |
| **W12** | `GraphLegendLayer` — drop the dead `type === undefined` guard; **do not** add an `UNKNOWN_TYPE` skip (§8 Q8) | `graph/src/layer/GraphLegendLayer.ts:651` | the legend reports every type present, `unknown` included |
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
