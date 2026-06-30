# GraphCanvas Operations Layer — query → action → composite

> **Status: DESIGN / CONCEPT.** How graph-domain "verbs" (focus, expand, isolate,
> select-subtree, …) are built as **composite ops** over the kernel's primitive
> actions + `GraphStore`'s queries — and why none of them live in the kernel.
> Companion to [`canvas-state-plan.md`](./canvas-state-plan.md) §6.2 (operations &
> history) and [`canvas-store-d13-data-ownership.md`](./canvas-store-d13-data-ownership.md)
> (the registered `DataSource`). Sketches are illustrative, not final signatures.

## The three layers

Every graph "verb" is a stack of three things — keep them distinct:

| Layer | Examples | Mutates state? | Lives in |
|---|---|---|---|
| **Query** (read) | `neighboursOf`, `descendantsOf`, `boundsOf`, `edgesOf` | No — pure read | the `DataSource` (`GraphStore` adjacency / hierarchy / positions) |
| **Primitive action** (write) | `focus.set`, `selection.set`, `camera.set`, `node.update` | Yes — one named `update` each | `store.actions.*` (kernel) |
| **Composite op** | `focusTo`, `focusNeighbours`, `isolate`, `collapse`, `selectSubtree` | Yes — *several* primitives, atomic | **`GraphCanvas` facade** (domain) |

The recurring shape: **read (queries) → write (primitives) wrapped in one `batch`.**
Reads sit *outside* the batch; only writes go in.

## The atomic-composite rule

`store.view.batch(action, fn)` coalesces N writes into **one** change — one
notification, one **history step** (undo reverts the whole op), one telemetry
event / CRDT txn labelled with the op name. That's what makes a composite feel
like a single "command".

```ts
function focusTo(ids: string[]) {
  const box = boundsOf(ids);                       // QUERY (read positions; outside the batch)
  store.view.batch('graph:focusTo', () => {        // ◄ ONE atomic action
    store.actions.focus.set(ids, /* dim */ true);  //   emphasis + dim rest (O(1))
    store.actions.camera.set(fitTransform(box));   //   frame them
  });
}
```

**View vs data batching (a real subtlety).** Two stores, two coalescers:
- view writes (focus / selection / camera) → `store.view.batch(label, fn)` → one reactive change + one history step.
- data writes (collapse / pin / remove) → the `DataSource`'s own batch (`graph.batch(fn)`) → one `data:flush`.

A composite that touches **both** wraps each side; telemetry then sees one
`state:change` (view) **plus** a `data:intent` (data) — they don't share a single
history step because data mutations ride the data channel, not the view patch
stream (that's the two-physics split, by design).

## Where ops live

The kernel ships the **primitives** (`actions.*`, `view.batch`) and the **query
substrate** (`GraphStore`). It ships **no** `focusNeighbours`. Composite ops are
plain functions on the `GraphCanvas` facade — **a new op is a new function, zero
kernel change** (the domain-free rule).

```ts
// @invana/graph — the operations layer over the registered store
function createGraphOps(canvas: Canvas, sourceId = 'graph') {
  const store = canvas.store;
  const graph = store.data[sourceId] as GraphStore;   // registered via D13
  const view  = store.view;
  // … the catalog below …
}
```

## Catalog (decompositions)

### Navigation & emphasis (view-only — `view.batch`)

```ts
// k-hop neighbourhood, BFS over the adjacency index (QUERY)
const khop = (id, hops = 1) => {
  const seen = new Set([id]); let frontier = [id];
  for (let h = 0; h < hops; h++) {
    const next = [];
    for (const n of frontier) for (const m of graph.neighborsOf(n, 'both'))
      if (!seen.has(m)) { seen.add(m); next.push(m); }
    frontier = next;
  }
  return [...seen];
};

focusTo        = (ids)          => { const b = boundsOf(ids);
                                     view.batch('graph:focusTo', () => {
                                       store.actions.focus.set(ids, true);
                                       store.actions.camera.set(fit(b)); }); };

focusNeighbours= (id, hops = 1) => focusTo(khop(id, hops));      // query ∘ focusTo

isolate        = (ids)          => view.batch('graph:isolate', () => {
                                     store.actions.focus.set(ids, true);   // dim everyone else
                                     store.actions.selection.set(ids); });

fitAll         = ()             => store.actions.camera.set(fit(boundsOf(allNodeIds())));

resetView      = ()             => view.batch('graph:resetView', () => {
                                     store.actions.focus.clear();
                                     store.actions.selection.clear(); });
```

### Selection (view-only — one `selection.set`)

```ts
selectNeighbourhood = (id, hops = 1) => store.actions.selection.set(khop(id, hops));
selectSubtree       = (rootId)       => store.actions.selection.set(
                                          [rootId, ...graph.descendantsOf(rootId)]);  // hierarchy QUERY
selectByType        = (type)         => store.actions.selection.set(
                                          [...graph.nodes()].filter(n => n.type === type).map(n => n.id));
invertSelection     = ()             => { const sel = view.read(s => s.interaction.selection);
                                          store.actions.selection.set(
                                            allNodeIds().filter(id => !sel.has(id))); };
```

### Structure / data (data writes — `graph.batch`)

```ts
collapse  = (groupId) => graph.updateNode(groupId, { style: { group: { collapsed: true  } } });
expand    = (groupId) => graph.updateNode(groupId, { style: { group: { collapsed: false } } });

pinSelection   = (on = true) => graph.batch(() => {                 // QUERY sel + N data writes
  for (const id of view.read(s => s.interaction.selection)) graph.setPinned(id, on); });

removeSelection = () => graph.batch(() => {
  for (const id of view.read(s => s.interaction.selection)) graph.removeNode(id); });   // cascades edges
```

> Note `collapse`/`expand` are *data* writes (the `collapsed` flag is style/data on
> the group node); a richer version would `graph.batch` the flag **then**
> `focusTo(visibleAfter)` — a composite spanning data **and** view, wrapping each in
> its own batch.

## Notes

- **Performance.** `focus.*` is the O(1) "emphasis set + dim mode" (not a per-node
  write); the muted majority is a render-time derivation (`canvas-state-plan` §7.1B).
  Queries are `O(neighbours)`/`O(subtree)` via `GraphStore`'s adjacency/hierarchy
  indexes — never `O(N)` scans, except the deliberate `selectByType`/`invertSelection`
  sweeps.
- **Undo.** Because each view composite is one `batch`, `history.undo()` reverts the
  whole verb (e.g. emphasis + camera) in a single step. Data ops (pin/remove/collapse)
  undo via the data channel (or `GraphHistory`), not the view patch stack.
- **Reads stay outside the batch** — queries are pure; only the writes are batched.
- **Extensibility.** Every entry above is a plain function composing kernel
  primitives + `GraphStore` queries. Add a verb → add a function. The kernel and the
  store schema are untouched.
</content>
