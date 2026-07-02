# Canvas — 3-Package Pseudocode (draft)

> **Status: DRAFT / EXPLORATION.** Pseudocode (not compiling TS) for `canvas-store` /
> `canvas` / `canvas-pixijs`, showing how **data** (nodes, edges, groups, annotations)
> and **view-data** (layers, behaviours, layouts) live and flow. Companion to
> [`canvas-3-package-architecture.md`](./canvas-3-package-architecture.md).
>
> **Two conventions (this revision):**
> 1. **Address data by `layer`, not `source`** — a layer's data is `store.layer(id)`;
>    its config is `view.definition.layers[id]`; **same id**. No separate "source" term.
> 2. **Every update is subscribable in one place** — view changes *and* every layer's
>    data flush are bridged onto `store.events`, so the **canvas subscribes to all
>    updates through the single bus** (no wiring view + each layer separately).

---

## 1. `@invana/canvas-store` — the kernel (holds everything; renders nothing)

### 1a. DATA — per **layer** (addressed by layer id): nodes · edges · groups · annotations

```
CanvasStore.layers : { [layerId]: LayerDataStore }     // data, keyed by LAYER id (not "source")

NodeRecord  = { id, x, y, payload, states[] }          // position is a NODE FIELD
EdgeRecord  = { id, source, target, payload, states[] }
GroupRecord = { id, memberIds[], geometry, payload, states[] }  // bubble-set / shaped; geometry DERIVED
Annotation  = { id, kind, geometry, payload }                   // free note/shape/text

LayerDataStore (one per layer — bulk, typed-array-backed, NOT reactive):
  nodes:       Map<id, NodeRecord>        // x/y live in a Float32Array column internally
  edges:       Map<id, EdgeRecord>
  groups:      Map<id, GroupRecord>
  annotations: Map<id, Annotation>

  setData({ nodes, edges, groups, annotations })
  addNode(n) / updateNode(id, patch) / setPositions(Float32Array)   // bulk, ~10ns/slot
  addEdge / addGroup / addAnnotation / remove(kind, id)
  read(kind, id) / all(kind)
  on('flush', delta)        // delta = { nodes:{added,changed,removed}, edges:{…}, groups:{…}, annotations:{…}, version }
                            // NOTE: also auto-bridged onto store.events as 'data:flush' (§1c)

store.layer(id)             // get (lazily own) the LayerDataStore for layer `id`
```

### 1b. VIEW — the definition: layers · behaviours · layouts (reactive)

```
CanvasStore.view : ReactiveStore<CanvasView>

CanvasView.definition = {
  layers: {                                  // each layer's CONFIG — same id as its data (store.layer(id))
    "graph":  { type:'graph',      node:{shape:'circle',r:8}, edge:{...} },   // owns + draws its nodes+edges
    "groups": { type:'group',      layer:'graph', shape:'bubbleset' },        // overlay: reads layer 'graph' groups
    "notes":  { type:'annotation', layer:'graph' },                          // overlay: reads layer 'graph' annotations
  },
  behaviours: { "hover":{type:'hover',enabled:true,degree:1},                // input → state (rule 7)
                "drag":{type:'drag',enabled:true,layer:'graph'},
                "select":{type:'select',enabled:true,multiple:true} },
  layouts:    { "force":{type:'force',layer:'graph',charge:-160},            // data → positions (bound to a layer)
                "elk":{type:'elk',layer:'graph'} },
  activeLayout: "force", templates, theme,
}
CanvasView.interaction = { selection:Set, hover, states:{}, focus, camera:{x,y,zoom}, viewMode }
```

A layer's **config** lives in `view.definition.layers[id]`; its **data** in `store.layer(id)`;
they share the id. Overlay layers that draw a *derived* view of another layer (group hulls,
minimap) reference it by `layer:'…'` (the rule-8 cross-layer ref).

### 1c. The action API — named, action-typed methods (prefer over raw `update`)

`store.actions.*` are the developer-facing commands; each **bakes in its action
label**, so telemetry / history / CRDT read as intent. Raw `view.update(recipe,
action)` is the primitive underneath.

```
// VIEW commands → view.update(recipe, '<action>')        DATA commands → store.layer(l).<op> (+ intent)
store.actions.layers.add/update/setStyle/setVisible/remove(id, …)      // 'layer.setStyle' …
store.actions.behaviours.add/update/enable/disable/remove(id)          // 'behaviour.enable' …
store.actions.layouts.set/tune/run/remove(id, …)                       // 'layout.run' …
store.actions.camera.set/pan/zoom/zoomTo/reset(…)                      // 'camera.zoom' …
store.actions.selection.set/add/toggle/clear(…)   store.actions.hover.set/clear(…)
store.actions.templates.create/update/remove(…)   store.actions.theme.set(…)
store.actions.node/edge/group/annotation.add/update/remove(layer, …)   // → store.layer(layer)
store.actions.positions.apply(layer, positions)                        // bulk layout output
```

### 1d. The one channel — every update on `store.events`

```
store.view.read(sel) / update(recipe, action) / subscribe / batch
store.layer(id)                       // the LayerDataStore
store.events.emit / on / tap          // the bus

// the kernel BRIDGES every update onto the bus, so ONE subscription sees them all:
view.update(...)            ──►  store.events.emit('state:change', { action, changedPaths }, {kind:'store'})
store.layer(id) flush       ──►  store.events.emit('data:flush',   { layerId, delta },        {kind:'data', id})
store.actions.<data op>     ──►  store.events.emit('data:intent',  { action, layerId, ids },  {kind:'data', id})

// telemetry: withTelemetry(store.view, sink)     history: createHistory(store.view)
```

Three bus event types: **`state:change`** (view mutations), **`data:flush`** (per-frame
data delta), **`data:intent`** (one per data action — audit/collab, not per-record).

---

## 2. `@invana/canvas` — the orchestrator (producers + wiring; renders nothing)

```
class Canvas {
  constructor({ store, renderer }) {
    this.store = store; this.renderer = renderer
    this.layouts    = new LayoutRuntime(store)
    this.behaviours = new BehaviourRuntime(store)
    this.groupGeom  = new GroupGeometryDeriver(store)   // group hulls from member positions (layout-like, throttled)
    this.bind()
  }

  // ★ ALL updates subscribed in ONE place — the bus. (Your refinement.)
  bind() {
    renderer.mount(container)

    store.events.tap(e => {
      switch (e.type) {
        case 'state:change':                                  // VIEW changed (layers/behaviours/layouts/interaction)
          renderer.applyView(store.view.getState())
          this.behaviours.sync(store.view)                    // enable/disable producers
          this.layouts.sync(store.view)                       // run activeLayout if params/data changed
          break
        case 'data:flush':                                    // a LAYER's data changed (nodes/edges/groups/annotations)
          renderer.applyData(e.payload.layerId, store.layer(e.payload.layerId), e.payload.delta)
          this.groupGeom.onLayerFlush(e.payload)              // recompute group hulls if members moved
          break
      }
    })

    renderer.input.on(evt => this.behaviours.handle(evt))     // INPUT (pixi pointer) → producers
  }
}

// LAYOUTS — producers: read a layer's DATA (nodes/edges) → write positions back to it
class LayoutRuntime {
  run(layoutId) {
    cfg    = store.view.read(v => v.definition.layouts[layoutId])
    data   = store.layer(cfg.layer)
    layout = LayoutRegistry.create(cfg.type, cfg)
    layout.run(data.nodes(), data.edges(), positions =>
      store.actions.positions.apply(cfg.layer, positions))   // bulk write → flush → 'data:flush' → renderer repositions
  }
  sync(view) { if (view.definition.activeLayout) this.run(view.definition.activeLayout) }
}

// BEHAVIOURS — producers: input → named ACTIONS (view interaction OR a layer's data)
class BehaviourRuntime {
  handle(evt) { for (b of this.enabled) b.onInput(evt, store.actions) }
}
HoverBehaviour.onInput(evt, a):
    a.hover.set(pick(evt))                       // → VIEW  ('hover.set')
    a.selection /* focus/highlight */            // mute-rest is O(focus), not O(N)
DragBehaviour.onInput(evt, a):
    a.node.moveTo('graph', evt.id, evt.x, evt.y) // → DATA  (one node → flush + 'node.moveTo' intent)
SelectBehaviour.onInput(evt, a):
    a.selection.set(hitIds)                      // → VIEW  ('selection.set'; the selection set, D11)
```

---

## 3. `@invana/canvas-pixijs` — the renderer (pure projection; owns no state)

```
class PixiRenderer implements IRenderer {
  app, viewport
  layerContainers : { [layerId]: pixi.Container }
  sprites : { node:{}, edge:{}, group:{}, annotation:{} }

  mount(el) { this.app = new pixi.Application(el); this.viewport = new Viewport() }

  // VIEW → one container per layer + styles + interaction. No data here.
  applyView(view) {
    for (id, cfg) of view.definition.layers: ensureContainer(id, cfg)   // create/update; z-order; style
    applyInteraction(view.interaction)                                  // selection/hover/focus → tints; camera → viewport
  }

  // DATA delta for one LAYER → draw ONLY the delta, per kind. Targeted, O(delta).
  applyData(layerId, data, delta) {
    cfg = currentView.definition.layers[layerId]
    switch (cfg.type) {
      case 'graph':                                          // NODES + EDGES
        delta.nodes.added   → sprites.node[id]  = drawNode(data.read('node',id), cfg.node)
        delta.nodes.changed → updateNode(sprites.node[id], data.read('node',id))   // style + transform-only position
        delta.nodes.removed → destroy(sprites.node[id])
        delta.edges.*       → drawEdge / updateEdge / removeEdge
      case 'group':                                          // GROUPS — encapsulating shape from DERIVED geometry
        delta.groups.added/changed → (re)drawGroupShape(data.read('group',id).geometry, cfg.shape)
        delta.groups.removed       → destroy(sprites.group[id])
      case 'annotation':                                     // ANNOTATIONS
        delta.annotations.* → draw / redraw / remove
    }
  }

  input = { on(fn) { app.stage.on('pointer*', e => fn(toCanvasEvent(e))) } }   // surfaced to the orchestrator
  destroy() { app.destroy() }
}
```

---

## 4. End-to-end trace (where each kind lives; one subscription drives it)

```
1. LOAD DATA      store.layer('graph').setData({ nodes, edges, groups, annotations })   // → DATA
                  → flush → 'data:flush' on bus → canvas → renderer.applyData (draws all four kinds)

2. CONFIGURE VIEW store.view.update(s => {                                               // → VIEW
                    s.definition.layers     = { graph, groups, notes }
                    s.definition.layouts    = { force }; s.definition.activeLayout = 'force'
                    s.definition.behaviours = { hover, drag, select }
                  }, 'scene:init')
                  → 'state:change' on bus → canvas → renderer.applyView + run 'force'

3. LAYOUT RUN     canvas.layouts.run('force'): read store.layer('graph') nodes/edges → setPositions   // DATA write
                  → 'data:flush' → renderer repositions (transform-only)

4. GROUP GEOMETRY canvas.groupGeom recomputes hulls from member positions (throttled)    // DATA write (groups.geometry)
                  → 'data:flush' → renderer redraws group shapes

5. INTERACT       pointer → canvas.behaviours →
                    hover  → store.view.interaction.hover/focus   (VIEW)   → 'state:change' → dim others
                    drag   → store.layer('graph').updateNode      (DATA)   → 'data:flush'  → move one node
                    select → store.view.interaction.selection     (VIEW)   → 'state:change' → ring selected

6. UNDO           history.undo() → inverse patch on store.view → 'state:change' → renderer reflects   (VIEW)
```

**Invariants this pseudocode encodes:**
- **DATA** (nodes/edges/groups/annotations) lives in **`store.layer(id)`** — bulk, typed-array,
  coarse flush, **never** the reactive store. Producers: layouts, group-geometry deriver, drag.
- **VIEW-DATA** (layers/behaviours/layouts config + interaction) lives in **`store.view`** —
  reactive, declarative patches; telemetry + history + CRDT hang off it.
- **One channel:** view changes (`state:change`) **and** every layer's data flush (`data:flush`)
  are bridged onto **`store.events`**, so the **canvas binds once** and sees *all* updates.
- **`canvas`** produces (layouts/behaviours/group-geometry) + wires; **`canvas-pixijs`** only
  reads (`applyView`/`applyData`) and draws; **`canvas-store`** owns the truth and never renders.
