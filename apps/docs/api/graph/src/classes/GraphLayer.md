# Class: GraphLayer

## Extends

- `WorldLayer`\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md), `GraphLayerState`, [`GraphLayerEvents`](../interfaces/GraphLayerEvents.md), `never`, `WorldLayerHit`\>

## Constructors

### Constructor

> **new GraphLayer**(`opts`): `GraphLayer`

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)\>

#### Returns

`GraphLayer`

#### Overrides

`WorldLayer< GraphLayerOptions, GraphLayerState, GraphLayerEvents, never, WorldLayerHit >.constructor`

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`BubbleSetsLayer`](../../../graph-layer-bubble-sets/src/classes/BubbleSetsLayer.md).[`_surface`](../../../graph-layer-bubble-sets/src/classes/BubbleSetsLayer.md#_surface)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`WorldLayer.ctx`

***

### cullable

> **cullable**: `boolean`

#### Inherited from

`WorldLayer.cullable`

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

#### Inherited from

`WorldLayer.dirty`

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphLayerEvents`](../interfaces/GraphLayerEvents.md)\>

#### Inherited from

`WorldLayer.events`

***

### hittable

> **hittable**: `boolean`

#### Inherited from

`WorldLayer.hittable`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`WorldLayer.id`

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Inherited from

`WorldLayer.kind`

***

### options

> `readonly` **options**: [`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)

#### Inherited from

`WorldLayer.options`

***

### store

> `readonly` **store**: [`GraphStore`](GraphStore.md)

Data source. Either supplied by the caller or self-created.

***

### zIndex

> **zIndex**: `number`

#### Inherited from

`WorldLayer.zIndex`

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`WorldLayer.context`

***

### edgeDefaults

#### Get Signature

> **get** **edgeDefaults**(): [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Read-only snapshot of the current edge template style.

##### Returns

[`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`WorldLayer.mounted`

***

### nodeDefaults

#### Get Signature

> **get** **nodeDefaults**(): [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

Read-only snapshot of the current node template style (resolved per node at render).

##### Returns

[`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### schema

#### Get Signature

> **get** **schema**(): [`GraphSchema`](../interfaces/GraphSchema.md)

The **authoritative** schema for this graph, if a data source declared one
(delegates to [GraphStore.schema](GraphStore.md#schema)) — typically the full DB schema behind
a connected canvas, a superset of what's loaded. `undefined` when none is set;
resolve `layer.schema ?? deriveSchema(layer.store)` for authoritative-else-observed.

##### Returns

[`GraphSchema`](../interfaces/GraphSchema.md)

***

### state

#### Get Signature

> **get** **state**(): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

UI / interaction state (`ReactiveStore<TState>`). Because it is built
through the injected kernel factory, every write emits patches and history /
telemetry / a future CRDT backend all observe it.

**Available from `mount()` onward** — accessing it before the first mount
throws. (`createState()` is also called at first mount, so it may safely
read subclass fields initialised in the subclass constructor.)

##### Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

#### Inherited from

`WorldLayer.state`

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

##### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Inherited from

`WorldLayer.surface`

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

`WorldLayer.visible`

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

`WorldLayer.applyDirty`

***

### boundsOfNode()

> **boundsOfNode**(`node`): `any`

Local AABB for `node`'s resolved shape. Delegates to the registered
shape's `static boundsOf` via `PrimitivesRenderer.boundsOfSpec`, so
built-in and custom shape kinds flow through the same hook.

Returns `undefined` when:
- the renderer isn't mounted yet,
- the resolved `style.shape.kind` isn't registered, or
- the registered ctor doesn't implement `boundsOf`.

The returned rect is in the shape's local (centre-relative) frame —
`node.position` is *not* baked in. Consumers that only need a size
read `width` / `height`; consumers that need world-space corners
offset by `node.position` themselves.

Used by `MiniMapLayer` to estimate node footprint before the source
renderer mounts and by `ElkLayout` (and other layouts) to read node
sizes for layout-time placement — both without switching over a
closed shape-kind enum.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`any`

***

### clear()

> **clear**(): `void`

Remove every node and edge — tearing down their rendered shapes /
connectors and notifying full-repaint consumers (e.g. `MiniMapLayer`). The
canonical way to empty the graph; prefer it over
`setData({ nodes: [], edges: [] })`.

Note the difference from the low-level `graph.store.clear()`: that is a
silent fast-wipe (no events, drops the pending queues), so on its own it
would leave the canvas painted and dependent layers stale. This method
keeps the renderer and store in sync and fires a single `data:changed`
(which `store.clear()` alone never produces, since `doFlush` skips an empty
flush) so consumers update immediately rather than on some later event.

#### Returns

`void`

***

### collapsedAncestor()

> **collapsedAncestor**(`nodeId`): `string`

Climb the `parentId` chain from `nodeId` (exclusive) and return the
first ancestor whose resolved style has `group.collapsed === true`, or
`undefined` if no such ancestor exists. Used to decide whether a node
is currently hidden (any collapsed ancestor → hidden) and where to
re-route an incident edge (to that collapsed ancestor).

#### Parameters

##### nodeId

`string`

#### Returns

`string`

***

### createState()

> `protected` **createState**(): `GraphLayerState`

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLayerState`

#### Overrides

`WorldLayer.createState`

***

### effectiveEndpoint()

> **effectiveEndpoint**(`nodeId`): `string`

Resolve which renderer-side shape id an edge endpoint should attach to
for `nodeId`. Returns the nearest collapsed-group ancestor when the
node is hidden, or `nodeId` unchanged when the node is visible. Pure
read — the store's `edge.source` / `edge.target` are never mutated.

#### Parameters

##### nodeId

`string`

#### Returns

`string`

***

### exportData()

> **exportData**(): [`GraphData`](../interfaces/GraphData.md)

Serialise this layer's graph data — every node (with its live position,
`pinned` flag, style, states and payload) and every edge — to a plain
[GraphData](../interfaces/GraphData.md) object safe to `JSON.stringify`.

Implements the engine's structural `DataSerializableLayer` contract, so
`Canvas.exportState()` picks this layer's data up automatically. Round-trips
through [importData](#importdata).

#### Returns

[`GraphData`](../interfaces/GraphData.md)

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`WorldLayer.flush`

***

### focusEdges()

> **focusEdges**(`ids`, `opts?`): `void`

Centre the camera on a set of edges — pan so the midpoint of their
endpoints sits at the viewport centre, **without changing zoom**. Unknown
ids (or edges with an unplaced endpoint) are skipped; a no-op when none
resolve or the layer isn't mounted.

#### Parameters

##### ids

`Iterable`\<`string`\>

Edge ids to centre on.

##### opts?

`includeHidden: true` also considers effectively-hidden edges
  (default `false` — hidden edges, including those hidden because an
  endpoint is, are skipped).

###### includeHidden?

`boolean`

#### Returns

`void`

***

### focusNode()

> **focusNode**(`id`, `opts?`): `void`

Centre the camera on a single node, optionally zooming in. Sugar over
[focusNodes](#focusnodes) for the common "focus on this node" action.

Camera-only: it moves the view, nothing else. Selecting / highlighting the
node is a separate, opt-in concern (a `ClickSelectBehaviour`) the caller
composes — focus stays orthogonal to selection.

#### Parameters

##### id

`string`

Node id to centre on.

##### opts?

###### includeHidden?

`boolean`

###### zoom?

`number`

Minimum zoom: the camera zooms *in* to at least this
  scale, but never zooms out (a no-op if already closer). Omit for a pure
  pan at the current zoom.

#### Returns

`void`

***

### focusNodes()

> **focusNodes**(`ids`, `opts?`): `void`

Centre the camera on a set of nodes — pan so the midpoint of their
positions sits at the viewport centre, **without changing zoom**. Unknown
ids are skipped; a no-op when none resolve or the layer isn't mounted.

Graph-domain sugar over the geometry-only Camera.centerOn: it
resolves ids → positions so callers (e.g. a "focus on node" context-menu
action) don't have to. Focus locates a target; zooming stays a separate,
explicit gesture (wheel / pinch / fit-to-content).

#### Parameters

##### ids

`Iterable`\<`string`\>

Node ids to centre on.

##### opts?

`includeHidden: true` also considers explicitly-hidden nodes
  (default `false` — hidden nodes are skipped so framing tracks what's
  visible).

###### includeHidden?

`boolean`

#### Returns

`void`

***

### getBounds()

> **getBounds**(`opts?`): `any`

World-space AABB of this layer's content, or `null` when there is nothing
to measure — an empty graph, or a layer whose renderer hasn't mounted.

`null` rather than a zero rect because callers fit the camera to this: a
zero rect produces a nonsense camera, whereas `null` lets them skip the fit
(`docs/renderer-split-design.md` D3).

#### Parameters

##### opts?

###### includeHidden?

`boolean`

#### Returns

`any`

#### Overrides

`WorldLayer.getBounds`

***

### getGroupRole()

> **getGroupRole**(`nodeId`): `"none"` \| `"collapsed"` \| `"expanded"`

Public predicate behaviours can use to filter group nodes out of their
own hit pipeline. Hover / select / drag should typically skip groups
when the group is *expanded* (the frame is interaction-less) but treat
a collapsed group as a regular node. Returns one of:

- `'none'`  — the id is not a group (treat as a regular node).
- `'expanded'` — group, currently expanded. Behaviours wanting to honour
  the "interaction-less frame" intent should early-return.
- `'collapsed'` — group, currently collapsed. Behaviours that act on
  regular nodes should treat this as a normal target.
- `undefined` — no such node.

The string form is preferred over a boolean pair so a future
`'collapsed-locked'` (or similar) can be added without breaking callers.

#### Parameters

##### nodeId

`string`

#### Returns

`"none"` \| `"collapsed"` \| `"expanded"`

***

### getRenderer()

> **getRenderer**(): [`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md)

Renderer accessor for behaviours. Undefined before `onMount`.

#### Returns

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md)

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`WorldLayer.hasPending`

***

### hiddenGroups()

> **hiddenGroups**(): `string`[]

Ids of every currently-hidden **group container** — a UI ("hidden groups"
panel) helper so callers don't hand-roll the derivation. Computed on demand
from `store.hiddenNodes()` ∩ group nodes (not a maintained index, so always
correct); recompute it on the store's `node:visibility` event rather than
every render. If your app already tracks its group ids, intersecting them
with `store.hiddenNodes()` is cheaper than this `isGroupNode` scan.

#### Returns

`string`[]

***

### hideEdge()

> **hideEdge**(`id`): `void`

Hide an edge. Delegates to the store.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### hideEdges()

> **hideEdges**(`ids`): `void`

Hide many edges in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### hideGroup()

> **hideGroup**(`id`): `void`

Hide a group node and all its `parentId` descendants. One batch → one paint.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### hideGroups()

> **hideGroups**(`ids`): `void`

Hide many groups (each container + its subtree) in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### hideNode()

> **hideNode**(`id`): `void`

Hide a node (culls it + its incident edges). Delegates to the store.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### hideNodes()

> **hideNodes**(`ids`): `void`

Hide many nodes in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### highlightNeighbourhood()

> **highlightNeighbourhood**(`id`, `dir?`, `state?`): `void`

Highlight a node together with its neighbours (in `dir`) and incident edges
— adds the runtime state `state` to all of them in a single
[GraphStore.batch](GraphStore.md#batch), so the whole neighbourhood repaints in one flush.
No-op if the seed id is unknown. Clear with `store.clearNodeState(state)` +
`store.clearEdgeState(state)`.

#### Parameters

##### id

`string`

Seed node id.

##### dir?

[`EdgeDirection`](../type-aliases/EdgeDirection.md) = `'both'`

Adjacency direction for neighbours + incident edges. Default `'both'`.

##### state?

`string` = `'highlighted'`

Runtime state name to apply. Default `'highlighted'`.

#### Returns

`void`

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): `WorldLayerHit`

Placeholder hit test — returns `null` until proper hit testing wires up
in a later phase (likely via the canvas hit-test pipeline reading the
renderer's shape registry).

#### Parameters

##### \_worldX

`number`

##### \_worldY

`number`

#### Returns

`WorldLayerHit`

#### Overrides

`WorldLayer.hitTest`

***

### importData()

> **importData**(`data`): `void`

Replace this layer's data from a [GraphData](../interfaces/GraphData.md) snapshot produced by
[exportData](#exportdata) — the import half of the `DataSerializableLayer`
contract. Delegates to [setData](#setdata), so the renderer teardown/repaint and
dependent-layer notifications all run.

#### Parameters

##### data

[`GraphData`](../interfaces/GraphData.md)

#### Returns

`void`

***

### isCollapsedGroup()

> **isCollapsedGroup**(`node`): `boolean`

True when this node is a group frame **and** the [COLLAPSED\_STATE](../variables/COLLAPSED_STATE.md)
state is active on it — from the store's presence set (what
`CollapseExpandBehaviour` toggles) or the node's document `states[]`
(how a feed authors "starts closed"). Collapse is interaction state, not
styling, so it is never read off `style`.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`boolean`

***

### isEdgeHidden()

> **isEdgeHidden**(`id`): `boolean`

True iff the edge's explicit hidden flag is set.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isEdgeVisible()

> **isEdgeVisible**(`id`): `boolean`

Effective visibility of an edge (not hidden and both endpoints visible).

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isGroupHidden()

> **isGroupHidden**(`id`): `boolean`

Whether a group container is currently hidden. **Derived** from the
container node's hidden flag (the source of truth), so it can't drift — no
cached group index. `id` should be a group container node id; for a
non-group node this simply reports that node's hidden state.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isGroupNode()

> **isGroupNode**(`node`): `boolean`

True iff `node`'s resolved style carries a `group` field — the only
signal that promotes the node from a regular renderable into a
compound-group frame.

Cheap to call: reads [resolveNodeStyle](#resolvenodestyle) which is already
memoised per render cycle through `Object.assign` of the merged
contributions.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`boolean`

***

### isNodeHidden()

> **isNodeHidden**(`id`): `boolean`

True iff the node is explicitly hidden.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isNodeVisible()

> **isNodeVisible**(`id`): `boolean`

Effective visibility of a node (live and not explicitly hidden).

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`WorldLayer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

`WorldLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`WorldLayer.onUnmount`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Keep hit-testing in step with whole-layer visibility. `WorldLayer` hides the
pixi container; graph picking runs through the renderer's own pointer router
(not `layer.hitTest`), so a hidden layer would otherwise stay clickable. Gate
the renderer's `hitTest` so a hidden layer's nodes/edges are non-interactive
too (decision 11 of the visibility plan).

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Overrides

`WorldLayer.onVisibleChange`

***

### recomputeGroup()

> **recomputeGroup**(`groupId`): `void`

Force a group's frame to re-project right now (outside the normal
flush cycle). Public escape hatch for feeds that remove children
individually without triggering a position change on a sibling — the
`node:remove` event doesn't carry the parentId, so the layer can't
mark the parent dirty on its own. Domain code can call this after
`store.removeNode` to make the auto-fit frame catch up.

#### Parameters

##### groupId

`string`

#### Returns

`void`

***

### redraw()

> **redraw**(): `void`

Force a full re-render of every node and edge from current store state +
active states. Does **not** mutate data and is **not** undoable — it is a
pure render pass. Use it after an external style/theme change that bypassed
the store (e.g. swapping the renderer's palette) or to recover from a
suspected render desync. For data edits prefer the store mutators, which
re-render the affected items automatically.

#### Returns

`void`

#### Overrides

`WorldLayer.redraw`

***

### resolveEdgeStyle()

> **resolveEdgeStyle**(`edge`): `Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

Sibling of [resolveNodeStyle](#resolvenodestyle) for edges. Public for the same reason.

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)

#### Returns

`Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

***

### resolveNodeStyle()

> **resolveNodeStyle**(`node`): `Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

Resolve the final flat NodeStyle for a node by merging contributions from
the layer-level template (`options.node.style`), the per-node `style`,
and every active state's layer + per-node overlay. Object.assign order
encodes precedence (later wins).

Exposed publicly so behaviours (NodeScaleLODBehaviour, label collision,
minimap, etc.) can read the same effective style the renderer sees,
without duplicating the merge logic.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

***

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Contribute this layer's **serialisable config** to a canvas-state snapshot —
the layer-level styling template (`node` / `edge`), the card/structure/
styling template registries, and a couple of scalar options. Implements the
engine's `DefinitionSerializable` contract, so `Canvas.exportState()` picks
it up into `definition.layers[id]` even on a declarative canvas whose options
were passed to the constructor.

Excludes `store` (a live instance) and `initData` (data is captured
separately, positions and all). The result is passed through jsonSafe,
so **function-valued style resolvers** (e.g. `labelText: (n) => …`) are
dropped — they can't serialise. On import, `setOptions` shallow-merges this
slice, preserving any live resolver the serialised template omitted.

#### Returns

`Record`\<`string`, `unknown`\>

***

### setData()

> **setData**(`data`): `void`

Bulk-load nodes + edges, **replacing** any prior data. Wraps the
underlying store inserts in a single `batch()` so subscribers see one
flush.

For streaming consumers (constantly arriving data), use the store
directly: `graph.store.addData({ nodes, edges })` appends without
clearing, and `graph.store.applyDelta({ added, updated, removed })`
applies an incremental change in one batch. All other per-id CRUD
(`upsertNode`, `updateNode`, `removeNode`, edge equivalents, `batch`,
`flush`, `clear`) lives on `graph.store` — the store is the single
source of truth and the layer just orchestrates store → renderer.

#### Parameters

##### data

[`GraphData`](../interfaces/GraphData.md)

#### Returns

`void`

***

### setEdgeDefaults()

> **setEdgeDefaults**(`patch`): `void`

Sibling of [setNodeDefaults](#setnodedefaults) for the edge template
(`options.edge.style`). Patches the shared edge styling and re-renders
every edge. Same shallow-merge contract — e.g. changing edge "type" means
`setEdgeDefaults({ shape: { ...prevShape, pathType: 'bezier' } })`.

#### Parameters

##### patch

`Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

#### Returns

`void`

***

### setNodeDefaults()

> **setNodeDefaults**(`patch`): `void`

Patch the layer-level node template (`options.node.style`) and re-render
every node so the change takes effect immediately. Use this for global
"apply to all nodes" changes (e.g. a toolbar default-fill picker) instead
of looping `store.updateNode` per node.

Merge is shallow (top-level): structured fields (`shape`, `decorations`,
`badges`, `effects`) are replaced wholesale — spread the prior value if you
mean to patch a single sub-field. Per-node `style`, active states, and
resolver functions still win over the template at resolve time (see
[resolveNodeStyle](#resolvenodestyle)). No-op visually if the layer isn't mounted yet,
but the template is still updated so later mounts pick it up.

#### Parameters

##### patch

`Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Live-update entry point. Dispatches a `GraphLayerOptions` slice to the
concrete setters: `node.style` → [setNodeDefaults](#setnodedefaults), `edge.style` →
[setEdgeDefaults](#setedgedefaults), `node.state` / `edge.state` →
[setStateConfigs](#setstateconfigs). Called by `GraphCanvas.update()` per id.

#### Parameters

##### patch

`Partial`\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)\>

#### Returns

`void`

***

### setSchema()

> **setSchema**(`schema`): `void`

Set/clear the authoritative schema (delegates to [GraphStore.setSchema](GraphStore.md#setschema)).

#### Parameters

##### schema

[`GraphSchema`](../interfaces/GraphSchema.md)

#### Returns

`void`

***

### setStateConfigs()

> **setStateConfigs**(`patch`): `void`

Patch the layer-level state *catalogues* (`options.node.state` /
`options.edge.state`) — the named overlays applied while a state is active
(`hover`, `selected`, …). Entries are merged by name (shallow, per the
`setNodeDefaults` contract: declare a full `NodeStyle` / `EdgeStyle` to
replace an entry; spread the prior value to patch one field). Re-renders
every node/edge so active states pick up the new appearance immediately.

This is the runtime counterpart to the construction-time
`DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES` merge — there was no setter
for state overlays before. Used by `GraphCanvas.update()` to live-patch
the state catalogue (e.g. theme the `selected` ring colour).

#### Parameters

##### patch

###### edge?

`Record`\<`string`, [`EdgeStyle`](../interfaces/EdgeStyle.md)\>

###### node?

`Record`\<`string`, [`NodeStyle`](../interfaces/NodeStyle.md)\>

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
`visible` (which only hides the pixi container via [onVisibleChange](#onvisiblechange)),
this also forces a [redraw](#redraw) and emits `scene:layer:visibilitychange`
on the canvas bus so dependent layers (minimap) and the render loop react
automatically. No-op if the value is unchanged.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

`WorldLayer.setVisible`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the surface's
paint order in sync, and flips `surfaces.world` into sorted mode
so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

`WorldLayer.setZIndex`

***

### showAllHidden()

> **showAllHidden**(): `void`

Clear every explicit hidden flag (nodes + edges).

#### Returns

`void`

***

### showEdge()

> **showEdge**(`id`): `void`

Show a previously-hidden edge. Delegates to the store.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showEdges()

> **showEdges**(`ids`): `void`

Show many edges in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### showGroup()

> **showGroup**(`id`): `void`

Show a group node and all its `parentId` descendants. One batch → one paint.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showGroups()

> **showGroups**(`ids`): `void`

Show many groups (each container + its subtree) in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### showNode()

> **showNode**(`id`): `void`

Show a previously-hidden node. Delegates to the store.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showNodes()

> **showNodes**(`ids`): `void`

Show many nodes in one batch → one paint.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### surfaceOptions()

> `protected` **surfaceOptions**(): [`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

Hand the layer's hit floor to the device the surface builds. Graph nodes
can be small at low zoom, so this layer raises the pick tolerance above the
renderer-wide default.

#### Returns

[`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

#### Overrides

`WorldLayer.surfaceOptions`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Per-frame tick — delegated to `PrimitivesRenderer.tickAnimations` so
animated decorations (`pulse-ring`, `marching-ants`, …) and the
viewport-clipped label-resolution sweep advance every frame.

`Canvas.tickOnce` duck-types this hook on each layer; without it the
renderer would never tick for graph layers because the field that
holds it (`_renderer`) is private and the alternative fallback path
looks for a public `renderer` property.

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### toggleEdgeHidden()

> **toggleEdgeHidden**(`id`): `boolean`

Flip an edge's hidden flag. Returns the resulting hidden state.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### toggleGroupHidden()

> **toggleGroupHidden**(`id`): `boolean`

Flip a group's visibility by the container node's state — hides the whole
subtree when it becomes hidden, shows it when it becomes visible. Returns the
resulting hidden state of the group node.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### toggleNodeHidden()

> **toggleNodeHidden**(`id`): `boolean`

Flip a node's hidden flag. Returns the resulting hidden state.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### toSVG()

> **toSVG**(): `string`

Vector-SVG projection of this layer's nodes + edges — delegates to the
internal `PrimitivesRenderer.toSVG()`. Consumed by `Canvas.exportSVG`
(duck-typed via the engine's `SvgExportableLayer` contract). Returns `''`
before mount. Coverage caveats (raster-only fills, non-label decorations,
effects) are documented on `PrimitivesRenderer.toSVG`.

#### Returns

`string`

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

`WorldLayer.unmount`
