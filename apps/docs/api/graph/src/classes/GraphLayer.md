# Class: GraphLayer

Defined in: [graph/src/layer/GraphLayer.ts:135](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L135)

## Extends

- `WorldLayer`\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md), `GraphLayerState`, [`GraphLayerEvents`](../interfaces/GraphLayerEvents.md), `never`, `WorldLayerHit`\>

## Constructors

### Constructor

> **new GraphLayer**(`opts`): `GraphLayer`

Defined in: [graph/src/layer/GraphLayer.ts:258](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L258)

#### Parameters

##### opts

`LayerOptions`\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)\>

#### Returns

`GraphLayer`

#### Overrides

`WorldLayer< GraphLayerOptions, GraphLayerState, GraphLayerEvents, never, WorldLayerHit >.constructor`

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: canvas/dist/index.d.ts:932

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`BubbleSetsLayer`](../../../graph-layer-bubble-sets/src/classes/BubbleSetsLayer.md).[`_container`](../../../graph-layer-bubble-sets/src/classes/BubbleSetsLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:572

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`MiniMapLayer`](MiniMapLayer.md).[`ctx`](MiniMapLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: canvas/dist/index.d.ts:563

#### Inherited from

[`MiniMapLayer`](MiniMapLayer.md).[`cullable`](MiniMapLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: `DirtyBatcher`\<`never`\>

Defined in: canvas/dist/index.d.ts:558

#### Inherited from

`WorldLayer.dirty`

***

### events

> `readonly` **events**: `SourceEmitter`\<[`GraphLayerEvents`](../interfaces/GraphLayerEvents.md)\>

Defined in: canvas/dist/index.d.ts:557

#### Inherited from

`WorldLayer.events`

***

### hittable

> **hittable**: `boolean`

Defined in: canvas/dist/index.d.ts:561

#### Inherited from

[`MiniMapLayer`](MiniMapLayer.md).[`hittable`](MiniMapLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:554

#### Inherited from

[`MiniMapLayer`](MiniMapLayer.md).[`id`](MiniMapLayer.md#id)

***

### options

> `readonly` **options**: [`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)

Defined in: canvas/dist/index.d.ts:555

#### Inherited from

`WorldLayer.options`

***

### state

> `readonly` **state**: `Store`\<`GraphLayerState`\>

Defined in: canvas/dist/index.d.ts:556

#### Inherited from

`WorldLayer.state`

***

### store

> `readonly` **store**: [`GraphStore`](GraphStore.md)

Defined in: [graph/src/layer/GraphLayer.ts:170](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L170)

Data source. Either supplied by the caller or self-created.

***

### zIndex

> **zIndex**: `number`

Defined in: canvas/dist/index.d.ts:562

#### Inherited from

[`MiniMapLayer`](MiniMapLayer.md).[`zIndex`](MiniMapLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: canvas/dist/index.d.ts:940

Root pixi `Container` (RenderGroup) for this layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
inside `onMount`. Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

`WorldLayer.container`

***

### context

#### Get Signature

> **get** `protected` **context**(): `CanvasContext`

Defined in: canvas/dist/index.d.ts:579

Convenience accessor; throws when called pre-mount.

##### Returns

`CanvasContext`

#### Inherited from

`WorldLayer.context`

***

### edgeDefaults

#### Get Signature

> **get** **edgeDefaults**(): [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/layer/GraphLayer.ts:707](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L707)

Read-only snapshot of the current edge template style.

##### Returns

[`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: canvas/dist/index.d.ts:574

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`WorldLayer.mounted`

***

### nodeDefaults

#### Get Signature

> **get** **nodeDefaults**(): [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

Defined in: [graph/src/layer/GraphLayer.ts:702](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L702)

Read-only snapshot of the current node template style (resolved per node at render).

##### Returns

[`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: canvas/dist/index.d.ts:569

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: canvas/dist/index.d.ts:570

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

Defined in: canvas/dist/index.d.ts:602

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

`DirtySnapshot`\<`never`\>

#### Returns

`void`

#### Inherited from

`WorldLayer.applyDirty`

***

### boundsOfNode()

> **boundsOfNode**(`node`): `any`

Defined in: [graph/src/layer/GraphLayer.ts:883](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L883)

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

Defined in: [graph/src/layer/GraphLayer.ts:546](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L546)

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

Defined in: [graph/src/layer/GraphLayer.ts:1699](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1699)

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

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: canvas/dist/index.d.ts:957

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects (e.g. text sprites).

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

`WorldLayer.createContainer`

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: canvas/dist/index.d.ts:952

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives — keeps pixi internal
(no `new Graphics()` in user code).

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

`WorldLayer.createGraphics`

***

### createState()

> `protected` **createState**(): `GraphLayerState`

Defined in: [graph/src/layer/GraphLayer.ts:280](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L280)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLayerState`

#### Overrides

`WorldLayer.createState`

***

### effectiveEndpoint()

> **effectiveEndpoint**(`nodeId`): `string`

Defined in: [graph/src/layer/GraphLayer.ts:1716](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1716)

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

### flush()

> **flush**(): `void`

Defined in: canvas/dist/index.d.ts:586

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`WorldLayer.flush`

***

### focusEdges()

> **focusEdges**(`ids`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:940](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L940)

Centre the camera on a set of edges — pan so the midpoint of their
endpoints sits at the viewport centre, **without changing zoom**. Unknown
ids (or edges with an unplaced endpoint) are skipped; a no-op when none
resolve or the layer isn't mounted.

#### Parameters

##### ids

`Iterable`\<`string`\>

Edge ids to centre on.

#### Returns

`void`

***

### focusNode()

> **focusNode**(`id`, `opts?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:924](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L924)

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

###### zoom?

`number`

Minimum zoom: the camera zooms *in* to at least this
  scale, but never zooms out (a no-op if already closer). Omit for a pure
  pan at the current zoom.

#### Returns

`void`

***

### focusNodes()

> **focusNodes**(`ids`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:902](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L902)

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

#### Returns

`void`

***

### getBounds()

> **getBounds**(): `object`

Defined in: canvas/dist/index.d.ts:970

Return the world-space AABB of everything currently rendered on this layer.
Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
Suitable for "fit to content" calls; do not call every frame.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Inherited from

`WorldLayer.getBounds`

***

### getGroupRole()

> **getGroupRole**(`nodeId`): `"none"` \| `"expanded"` \| `"collapsed"`

Defined in: [graph/src/layer/GraphLayer.ts:1685](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1685)

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

`"none"` \| `"expanded"` \| `"collapsed"`

***

### getRenderer()

> **getRenderer**(): `PrimitivesRenderer`

Defined in: [graph/src/layer/GraphLayer.ts:151](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L151)

Renderer accessor for behaviours. Undefined before `onMount`.

#### Returns

`PrimitivesRenderer`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: canvas/dist/index.d.ts:581

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`WorldLayer.hasPending`

***

### highlightNeighbourhood()

> **highlightNeighbourhood**(`id`, `dir?`, `state?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:729](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L729)

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

Defined in: [graph/src/layer/GraphLayer.ts:749](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L749)

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

### isCollapsedGroup()

> **isCollapsedGroup**(`node`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:1664](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1664)

True when this group node's resolved style carries `group.collapsed === true`.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`boolean`

***

### isGroupNode()

> **isGroupNode**(`node`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:1658](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1658)

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

### mount()

> **mount**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:942

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`WorldLayer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:284](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L284)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`WorldLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph/src/layer/GraphLayer.ts:490](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L490)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`WorldLayer.onUnmount`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: canvas/dist/index.d.ts:944

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

`WorldLayer.onVisibleChange`

***

### recomputeGroup()

> **recomputeGroup**(`groupId`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:1881](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L1881)

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

Defined in: [graph/src/layer/GraphLayer.ts:569](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L569)

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

Defined in: [graph/src/layer/GraphLayer.ts:829](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L829)

Sibling of [resolveNodeStyle](#resolvenodestyle) for edges. Public for the same reason.

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)

#### Returns

`Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

***

### resolveNodeStyle()

> **resolveNodeStyle**(`node`): `Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

Defined in: [graph/src/layer/GraphLayer.ts:779](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L779)

Resolve the final flat NodeStyle for a node by merging contributions from
the layer-level template (`options.node.style`), the per-node `style`,
and every active state's layer + per-node overlay. Object.assign order
encodes precedence (later wins).

Exposed publicly so behaviours (NodeSizeLODBehaviour, label collision,
minimap, etc.) can read the same effective style the renderer sees,
without duplicating the merge logic.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

***

### setData()

> **setData**(`data`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:513](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L513)

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

Defined in: [graph/src/layer/GraphLayer.ts:623](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L623)

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

Defined in: [graph/src/layer/GraphLayer.ts:603](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L603)

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

Defined in: [graph/src/layer/GraphLayer.ts:674](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L674)

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

### setStateConfigs()

> **setStateConfigs**(`patch`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:648](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L648)

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

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: canvas/dist/index.d.ts:964

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the pixi
container's `zIndex` in sync, and flips `surfaces.world` into sorted mode
so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

`WorldLayer.setZIndex`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:165](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/GraphLayer.ts#L165)

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

### unmount()

> **unmount**(): `void`

Defined in: canvas/dist/index.d.ts:945

#### Returns

`void`

#### Inherited from

`WorldLayer.unmount`
