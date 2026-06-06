# Pseudocode — store-owned state, new implementation shape

Companion to `store-owns-state-plan.md`. Shows the *shape* of `GraphStore`,
`GraphLayer`, and behaviours after the migration. Pseudocode — illustrative, not
copy-paste; types abbreviated. Reflects the decided design:

- **One source of truth** = `GraphStore` (§0 invariant: write → store → subscriber renders).
- **Behaviours = producers** (input → store writes). **Layers = subscribers / render-drivers.**
- **Two state compartments** (D1): document `states[]` (feed-owned) + runtime `Set` (presence). Render reads the **union**.
- **Per-toggle events** (D3): `node:state` / `edge:state`.
- **Store-only API** (D2): no `layer.setNodeState`.
- **Bus-wired** store emitter (§6) so telemetry sees every write.
- **`actor` hook** for future collaboration (§5).

---

## 1. `GraphStore` — the single source of truth

```
class GraphStore {

  // ── cold document data (existing) ──────────────────────────────
  nodeMap:  Map<id, { id, type?, data?, style?, states?[], state?{} , parentId? }>
  edgeMap:  Map<id, { id, source, target, type?, data?, style?, states?[], state?{} }>
  //                                                    ▲ document active-states (feed-owned)

  // ── presence compartment (NEW) ─────────────────────────────────
  nodeRuntimeStates: Map<id, Set<stateName>>   // hover/selected/highlighted — interaction-owned
  edgeRuntimeStates: Map<id, Set<stateName>>

  // ── reactivity (events upgraded to bus-wired SourceEmitter) ─────
  events: SourceEmitter<GraphStoreEventMap>     // was plain EventEmitter
  // GraphStoreEventMap gains:  'node:state' {nodeId, name, on, actor?}
  //                            'edge:state' {edgeId, name, on, actor?}

  // ── WRITE API: interaction state (the only surface; D2 store-only) ──
  addNodeState(id, name, opts?={actor}) {
    if !hasNode(id): return
    set = nodeRuntimeStates.get(id) ?? new Set(); nodeRuntimeStates.set(id, set)
    if set.has(name): return                       // idempotent → no event
    set.add(name)
    enqueueNodeState(id, name, on=true, opts.actor) // dedup’d, fires on flush
    scheduleFlushIfNeeded()
  }

  removeNodeState(id, name, opts?) {
    set = nodeRuntimeStates.get(id);  if !set?.has(name): return
    set.delete(name); if set.empty: nodeRuntimeStates.delete(id)
    enqueueNodeState(id, name, on=false, opts?.actor); scheduleFlushIfNeeded()
  }

  clearNodeState(name) {                            // strip from every runtime set
    for (id, set) of nodeRuntimeStates:
      if set.delete(name): enqueueNodeState(id, name, on=false); (drop set if empty)
    scheduleFlushIfNeeded()
    // NOTE: clears the PRESENCE compartment only. A document state in states[]
    // is unaffected — change those via updateNode({states}).
  }
  // …edge equivalents: addEdgeState / removeEdgeState / clearEdgeState

  // ── READ API: effective state = union of both compartments ──────
  nodeStatesOf(id): string[] {                      // what the renderer iterates
    return unique([ ...(nodeMap.get(id)?.states ?? []),     // document
                    ...(nodeRuntimeStates.get(id) ?? []) ]) // presence
  }
  hasNodeState(id, name): bool   → name in nodeStatesOf(id)     // union
  *nodesWithState(name)          → ids where name ∈ nodeStatesOf(id)

  // ── lifecycle hooks (existing methods, augmented) ──────────────
  installNode(node)  { …existing…  /* NO seeding of runtimeStates from states[] (D1 independent) */ }
  removeNode(id)     { …existing…  nodeRuntimeStates.delete(id) }     // cleanup
  removeEdge(id)     { …existing…  edgeRuntimeStates.delete(id) }

  doFlush() {
    …emit node:add / node:update / node:remove (existing)…
    for (id,name,on,actor) in pendingNodeStates:  events.emit('node:state', {nodeId:id, name, on, actor})
    for (id,name,on,actor) in pendingEdgeStates:  events.emit('edge:state', {edgeId:id, name, on, actor})
    events.emit('flush', counters)
    // events is bus-wired → every emit ALSO publishes a {type,timestamp,source:'store',payload}
    // envelope to canvas.events tap channel → telemetry sees it (§6)
  }
}
```

Key invariants baked in: `addNodeState` touches **only** the presence
compartment; the document `states[]` is mutated **only** by `updateNode`; reads
return the **union**. That's what makes a feed update and a live hover
non-colliding.

---

## 2. `GraphLayer` — subscriber / render-driver (no state of its own)

```
class GraphLayer extends WorldLayer {

  // GONE: nodeStates / edgeStates Maps
  // GONE: setNodeState / setEdgeState / clearNodeState / clearEdgeState (D2)
  // GONE: syncDataDrivenNodeStates / syncDataDrivenEdgeStates (union handles it)

  onMount(ctx) {
    store.events.setBus(ctx.events)          // §6: route store mutations to telemetry tap

    subs += store.events.on('node:add',    ({nodeId}) => addShape(nodeId))
    subs += store.events.on('node:update', ({nodeId}) => rerenderNode(nodeId))   // re-reads union
    subs += store.events.on('node:remove', ({nodeId}) => removeShape(nodeId))
    subs += store.events.on('node:state',  ({nodeId}) => dirtyStateNodes.add(nodeId))  // ◀ NEW: mark dirty, don't render
    subs += store.events.on('edge:state',  ({edgeId}) => dirtyStateEdges.add(edgeId))  // ◀ NEW
    subs += store.events.on('flush', (counters) => {
      for id of dirtyStateNodes: rerenderNode(id)    // ◀ drain once, deduped (mirrors dirtyConnectors)
      for id of dirtyStateEdges: rerenderEdge(id)
      dirtyStateNodes.clear(); dirtyStateEdges.clear()
      drainDirtyConnectors(); events.emit('data:changed', counters)
    })
    …edge:add / edge:update / edge:remove as today…
  }

  // render reads effective state straight from the store — layer holds none
  resolveNodeStyle(node) {
    activeStates = store.nodeStatesOf(node.id)        // ◀ was: this.nodeStates.get(id)
    style = assign(layerDefault, node.style)
    for name in activeStates: assign(style, overlay(name))   // precedence unchanged
    return style
  }

  // graph-domain sugar — still on the layer, but mutates via the STORE
  highlightNeighbourhood(id, dir='both', state='highlighted') {
    store.batch(() => {                      // ◀ one flush → one paint for the whole neighbourhood
      store.addNodeState(id, state)
      for nb in store.neighborsOf(id, dir): store.addNodeState(nb, state)
      for e  in store.edgesOf(id, dir):     store.addEdgeState(e.id, state)
    })
  }
}
```

The layer is now stateless w.r.t. interaction: it **subscribes** and
**projects**. A `node:state` event drives exactly one `rerenderNode(id)` — never
a full repaint (§5 perf invariant #2).

---

## 3. Behaviours — producers (write to store, never render)

### Before (today) — behaviour reaches into the layer's state map
```
class ClickSelectBehaviour {
  onElementClick(id, type) {
    selection.set(id, type)
    layer.setNodeState(id, 'selected', true)   // ✗ mutates layer-owned map directly
  }
  clearSelection() {
    for id in selection: layer.setNodeState(id, 'selected', false)
  }
}
```

### After — behaviour writes to the store; layer re-renders as a subscriber
```
class ClickSelectBehaviour {
  onElementClick(id, type) {
    selection.set(id, type)                    // behaviour still owns the *semantic* set (D4)
    layer.store.addNodeState(id, 'selected')   // ✓ write → store → emits node:state → layer rerenders
  }
  clearSelection() {
    for id in selection: layer.store.removeNodeState(id, 'selected')
    // or: layer.store.clearNodeState('selected')
  }
  // events promoted to SourceEmitter (§6 optional) → intent telemetry:
  events.emit('selection:change', snapshot)    // 'user selected N' distinct from the data mutations
}
```

Same pattern for Hover / Lasso / Brush / ContextMenu: each is an **input→write**
translator. No behaviour calls the renderer or holds visual state. (`ContextMenu`
marks its target with `addNodeState(id, 'context-open')` on open,
`removeNodeState` on close.)

---

## 4. The end-to-end loop (one user interaction)

```
  user right-clicks node n7, picks "Highlight neighbours"
        │
        ▼  (PRODUCER)
  ContextMenu items.onClick →  layer.highlightNeighbourhood('n7')
        │                         └─► store.addNodeState('n7',   'highlighted')
        │                             store.addNodeState('n3',   'highlighted')   // neighbours
        │                             store.addEdgeState('e12',  'highlighted')   // incident
        ▼  (STORE = TRUTH)
  runtime sets updated synchronously; node:state×N enqueued; flush scheduled (RAF, coalesced)
        │
        ▼  doFlush()
  emit node:state {n7,highlighted,on} … ──┬─────────────────────────────► canvas.events TAP  ─► telemetry
                                          │  (bus-wired SourceEmitter, §6)
        ▼  (SUBSCRIBER / RENDER-DRIVER)   │
  GraphLayer.on('node:state') → rerenderNode('n7'), rerenderNode('n3'), rerenderEdge('e12')
        │   each re-reads store.nodeStatesOf(id) = states[] ∪ runtime  → applies 'highlighted' overlay
        ▼
  ShapesRenderer.updateShape(...)  ─►  SCREEN
```

Future collaboration (§5): the same `node:state` envelopes, tagged with `actor`,
replicate over a throttled presence channel to peer boards — peers apply them to
*their* store, which re-emits and re-renders through the identical subscriber
path. No new render code; collab is "replay the writes."

---

## 5. Domain extension example — ER column lineage

Shows where domain logic lives without the store learning ER vocabulary
(plan § 7). Three altitudes: generic mechanics → domain policy → producer.
The same `GraphStore` + state model; ER data sits in `data:D`, columns are
child nodes (`parentId = tableId`), lineage links are edges with `type:'lineage'`.

```
// ── ALTITUDE 1: generic traversal, on GraphStore (domain-agnostic, reusable) ──
class GraphStore {
  *reachable(seed, {dir='both', maxDepth=Infinity, edgeFilter}) {
    // BFS composed from existing 1-hop primitives: edgesOf(id,dir) / neighborsOf(id,dir)
    // yields { node, viaEdge, depth }; caller supplies the filter that defines "follow"
  }
}

// ── ALTITUDE 2: domain policy — free fn or ERStore wrapper (PUBLIC read API; NOT a subclass) ──
function columnLineage(store, columnId, dir='both') {
  nodes={}, edges={}
  for {node, viaEdge} in store.reachable(columnId, {dir, edgeFilter: e => e.type in ['lineage','fk']}):
    nodes.add(node); edges.add(viaEdge)
  return {nodes, edges}
}
//   (or:  class ERStore { graph=new GraphStore(); lineageOf(id){…}; subscribes graph.events for indices })

// ── ALTITUDE 3: interaction — behaviour (PRODUCER: read → write, never renders) ──
class ColumnLineageBehaviour {
  onColumnClick(columnId) {
    {nodes, edges} = columnLineage(store, columnId)        // READ (query)
    store.batch(() => {                                    // WRITE — one flush
      store.clearNodeState('lineage'); store.clearEdgeState('lineage')   // drop prior path
      for n in nodes: store.addNodeState(n, 'lineage')
      for e in edges: store.addEdgeState(e, 'lineage')
    })
  }
}
// → node:state ×N → layer dirty-set drain → path highlighted in ONE paint
```

Rule of thumb: **mechanics low** (generic store primitive), **policy in the
middle** (domain query / `ERStore`, public API only — never subclass for this),
**interaction at the top** (producer behaviour). The graph algorithm never lives
in the behaviour; the interaction trigger never lives in the store.
