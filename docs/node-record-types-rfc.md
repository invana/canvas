# RFC — two record types, not five

**Status:** 📋 proposed. Half of it has already happened by accident — see §3.
**Package:** `@invana/graph`.
**Goal:** exactly **two** shapes for a node (and two for an edge): one that
accepts **resolvers**, one that the **store holds**. Nothing else.

---

## 1. What existed, and what each was for

Five types were in play. Three are already deleted (this session, RFC
[`required-type-on-records-rfc.md`](./required-type-on-records-rfc.md) §6); the
inventory is here because the *names* are still in people's heads and in older
docs.

| Type | Declared | Claimed job | Runtime users | Status |
|---|---|---|---|---|
| **`GraphNode` / `GraphEdge`** | `store/types.ts` | the record `GraphStore` holds | **everything** | ✅ alive |
| **`NodeOption` / `EdgeOption`** | `layer/types.ts` | the **layer-level template** — every field may be a function of the node | `GraphLayer.nodeDefaults`, `ColorByBehaviour`, themes | ✅ alive |
| ~~`NodeData` / `EdgeData`~~ | `layer/types.ts` | *"per-instance descriptor **as stored by `GraphStore`**"* | **zero** | ❌ deleted |
| ~~`NodeInput` / `EdgeInput`~~ | `layer/types.ts` | what a consumer passes to `setData`, with resolvers that fire **once at insert** | only `GraphDataOptions` | ❌ deleted |
| ~~`GraphDataOptions`~~ | `layer/types.ts` | top-level `setData(opts)` shape + id resolvers | **zero** | ❌ deleted |

**The confusion in one line:** `NodeData`'s own TSDoc said it was the stored
record, while `GraphStore` demonstrably stores `GraphNode`. Two types claimed the
same job and one of them had no users. `GraphData.nodes` was `GraphNode[]` all
along, so `setData` never touched the "input" branch at all.

### Why stories imported the dead ones anyway

They were exported from the package index, so `NodeData` read like the obvious
name for "a node record" — and it *worked*, because the shapes are structurally
compatible. TypeScript accepted the same literal under either name. 112 story
files had picked it up.

---

## 2. The distinction that actually matters — two resolver *moments*

The old design conflated these, which is most of why it never got wired.

| | **Layer-template resolvers** | **Per-record input resolvers** |
|---|---|---|
| Declared on | `NodeOption.style` (`ResolvableNodeStyle<GraphNode>`) | `NodeInput.style` (`ResolvableNodeStyle<D>`) |
| Argument | the **stored** `GraphNode` | the **raw** `data` payload |
| Fires | **every render**, per node | **once**, at insert |
| Result | never stored — recomputed | concrete value written into the store |
| Built? | ✅ **yes** — this is how `ColorByBehaviour` writes `bgFill` | ❌ **never implemented** |

A resolver on the *template* is a live projection: change the function, every
node repaints. A resolver on the *record* is a one-shot transform: it's just a
`.map()` the store performs for you. They are different features, and only the
first exists.

> `ResolvableId<D>` — the id-resolver half of the input idea — is still exported
> from two barrels with **zero runtime users**. It should go with the rest (§5 W3).

---

## 3. Where this leaves us — the target is nearly already true

Deleting the dead three left exactly the shape this RFC wants:

```
NodeOption   — resolvers, layer-level     ResolvableNodeStyle<GraphNode>
     ↓ resolved per render by GraphLayer.resolveNodeStyle(node)
GraphNode    — stored, concrete           what GraphStore holds
```

**One type that supports resolvers, one that is stored.** The remaining work is
not to add a type — it is to fix the one place the split is leaky (§4) and to
finish removing the vestiges (§5).

---

## 4. The leak — `GraphNode.style` is `unknown`

```ts
// store/types.ts
/**
 * Visual + structural style for this node. Typed via
 * `import('../layer/types').NodeStyle` in consumer code; left as `unknown`
 * here to avoid a store → layer dependency cycle.
 */
style?: unknown;
```

`NodeData.style` was typed `NodeStyle`. `GraphNode.style` is `unknown`. So
`GraphNode` is a **strictly weaker type on exactly one field**, and repointing
the stories off `NodeData` cost three of them a cast:

```ts
const badge = (node.style as NodeStyle).badges![0]!;   // was: node.style!.badges![0]!
```

That cast is the whole regression, and it is worth fixing — an `unknown` on the
most-read field of the most-used type pushes a cast onto every consumer.

### Why the stated reason doesn't hold

The comment says the cycle forces it. But `layer/types.ts` **already**
`import type`s `GraphNode` from `store/types.ts`, and a type-only import is
erased at compile time — it cannot create a runtime cycle. The constraint is
weaker than the comment implies.

### Three ways to close it

| | Approach | Cost |
|---|---|---|
| **A** ⭐ | **Extract `NodeStyle` / `EdgeStyle` into `graph/src/style/types.ts`**, imported by both `store/` and `layer/`. No cycle in either direction, and it is where a style type belongs anyway. | one file move + import updates |
| B | Mutual `import type` — `store/types.ts` imports `NodeStyle` from `layer/types.ts`. TypeScript permits circular *type* references. | one line, but leaves a genuinely circular module graph |
| C | Generic escape hatch: `GraphNode<D, S = unknown>` with `style?: S`. | infects every `GraphNode` mention with a second parameter |

**Recommend A.** `NodeStyle` is neither a store concern nor a layer concern —
it's a description of a mark. Giving it its own module makes the dependency
direction honest instead of clever.

> ⚠️ Once `style` is typed, `resolveNodeStyle(node)` remains the *right* call for
> anything wanting the **effective** style (layer template + type binding +
> per-node + active states, merged). Typing `GraphNode.style` only fixes reading
> the node's **own** declared style. The three cast sites should probably move to
> `resolveNodeStyle` regardless — §5 W4.

---

## 5. Work register

| ID | Task | Notes |
|---|---|---|
| **W1** | Extract `NodeStyle` / `EdgeStyle` to `graph/src/style/types.ts` (§4 A) | unblocks W2 |
| **W2** | `GraphNode.style?: NodeStyle`, `GraphEdge.style?: EdgeStyle` — and the same for `state` (`Record<string, NodeStyle>`, also `unknown` today) | removes the cast from every consumer |
| **W3** | Delete `ResolvableId` — declared, exported twice, zero users | the last vestige of the input-resolver idea |
| **W4** | Move the three `as NodeStyle` / `as EdgeStyle` cast sites to `layer.resolveNodeStyle(node)` | they want the *effective* style, not the declared one |
| **W5** | Sweep the docs for `NodeData` / `NodeInput` / `GraphDataOptions` | `packages/graph/CLAUDE.md`, `docs/data-types-instances.md`, `docs/data-types-implementation-plan.md`, `docs/node-edge-options-plan.md`, `apps/docs/graph/data-model.md` all still describe the deleted split as current |

W5 is the biggest of these by volume and the most important for the confusion
this RFC exists to end: **`packages/graph/CLAUDE.md` still documents
`NodeData` / `NodeInput` / `NodeOption` as the data model**, so the next person
to read it will reintroduce exactly the types we just removed.

---

## 6. Open questions

1. **Does per-record input-resolution (the old `NodeInput`) ever get built?**
   It's a real feature — "give me `id` from a function of my raw payload" is
   convenient for adapting foreign JSON. *(Recommend no: the package convention
   is already that foreign data is transformed **once, offline** in `scripts/`,
   not at import. `graph-datasets/CLAUDE.md` says exactly that. If it's ever
   wanted, it comes back as a `GraphNodeInput` with a real implementation, not a
   declaration.)*
2. **Does `NodeOption` keep its name?** It is now one half of a two-type pair,
   and `NodeOption` / `GraphNode` doesn't read as a pair. `NodeTemplate` says what
   it is. *(Recommend renaming — the cost is low and the current name is a
   leftover from the G6 alignment that produced the mess.)*
3. **Should `GraphData` be named for what it is?** It's the `setData` argument —
   `{ nodes: GraphNode[]; edges: GraphEdge[] }`. Fine as-is, listed only so the
   sweep in W5 doesn't miss it.
