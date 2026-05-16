# Class: GraphLayer

Defined in: [graph/src/layer/GraphLayer.ts:143](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L143)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`WorldLayer`](../../../canvas/src/classes/WorldLayer.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md), `GraphLayerState`, [`GraphLayerEvents`](../interfaces/GraphLayerEvents.md), `never`, [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)\>

## Constructors

### Constructor

> **new GraphLayer**(`opts`): `GraphLayer`

Defined in: [graph/src/layer/GraphLayer.ts:280](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L280)

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)\>

#### Returns

`GraphLayer`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`constructor`](../../../canvas/src/classes/WorldLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:38](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L38)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`_container`](../../../canvas/src/classes/WorldLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`ctx`](../../../canvas/src/classes/WorldLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`cullable`](../../../canvas/src/classes/WorldLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`dirty`](../../../canvas/src/classes/WorldLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphLayerEvents`](../interfaces/GraphLayerEvents.md)\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`events`](../../../canvas/src/classes/WorldLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hittable`](../../../canvas/src/classes/WorldLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`id`](../../../canvas/src/classes/WorldLayer.md#id)

***

### options

> `readonly` **options**: [`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`options`](../../../canvas/src/classes/WorldLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<`GraphLayerState`\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`state`](../../../canvas/src/classes/WorldLayer.md#state)

***

### store

> `readonly` **store**: [`GraphStore`](GraphStore.md)

Defined in: [graph/src/layer/GraphLayer.ts:241](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L241)

Data source. Either supplied by the caller or self-created.

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`zIndex`](../../../canvas/src/classes/WorldLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:47](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L47)

Root pixi `Container` (RenderGroup) for this layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
inside `onMount`. Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`container`](../../../canvas/src/classes/WorldLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`context`](../../../canvas/src/classes/WorldLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`mounted`](../../../canvas/src/classes/WorldLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L101)

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`visible`](../../../canvas/src/classes/WorldLayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L189)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`applyDirty`](../../../canvas/src/classes/WorldLayer.md#applydirty)

***

### clearEdgeState()

> **clearEdgeState**(`name`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:518](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L518)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### clearNodeState()

> **clearNodeState**(`name`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:507](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L507)

Remove state `name` from every node that carries it, in one pass. Useful
for clearing a transient selection / hover set without iterating
externally.

#### Parameters

##### name

`string`

#### Returns

`void`

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:102](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L102)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects (e.g. text sprites).

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createContainer`](../../../canvas/src/classes/WorldLayer.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/WorldLayer.ts:91](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L91)

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

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createGraphics`](../../../canvas/src/classes/WorldLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `GraphLayerState`

Defined in: [graph/src/layer/GraphLayer.ts:318](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L318)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLayerState`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createState`](../../../canvas/src/classes/WorldLayer.md#createstate)

***

### edgesWithState()

> **edgesWithState**(`name`): `IterableIterator`\<`string`\>

Defined in: [graph/src/layer/GraphLayer.ts:534](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L534)

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`flush`](../../../canvas/src/classes/WorldLayer.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [canvas/src/layers/WorldLayer.ts:129](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L129)

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

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`getBounds`](../../../canvas/src/classes/WorldLayer.md#getbounds)

***

### getEdgeDefaults()

> **getEdgeDefaults**(): [`ResolvedEdgeDefaults`](../type-aliases/ResolvedEdgeDefaults.md)

Defined in: [graph/src/layer/GraphLayer.ts:196](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L196)

Resolved per-edge defaults (caller-supplied `edgeDefaults` merged onto the
factory defaults). Exposed symmetrically with [getNodeDefaults](#getnodedefaults) for
sibling layers / behaviours that need to read what an edge would look
like before any per-edge `data` override kicks in.

#### Returns

[`ResolvedEdgeDefaults`](../type-aliases/ResolvedEdgeDefaults.md)

***

### getNodeDefaults()

> **getNodeDefaults**(): [`ResolvedNodeDefaults`](../type-aliases/ResolvedNodeDefaults.md)

Defined in: [graph/src/layer/GraphLayer.ts:186](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L186)

Resolved per-node defaults (caller-supplied `nodeDefaults` merged onto the
factory defaults). Exposed for layers that need to mirror what's drawn —
e.g. `MiniMapLayer` falls back to these when a node omits `shape` / `size`.

Fields may be either static values or resolver functions
(`(node) => value`). Callers that need a concrete value per node should
use resolveNodeDefault to unwrap.

#### Returns

[`ResolvedNodeDefaults`](../type-aliases/ResolvedNodeDefaults.md)

***

### getRenderer()

> **getRenderer**(): [`PrimitivesRenderer`](../../../canvas/src/classes/PrimitivesRenderer.md)

Defined in: [graph/src/layer/GraphLayer.ts:159](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L159)

Renderer accessor for behaviours. Undefined before `onMount`.

#### Returns

[`PrimitivesRenderer`](../../../canvas/src/classes/PrimitivesRenderer.md)

***

### hasEdgeState()

> **hasEdgeState**(`id`, `name`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:498](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L498)

#### Parameters

##### id

`string`

##### name

`string`

#### Returns

`boolean`

***

### hasNodeState()

> **hasNodeState**(`id`, `name`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:494](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L494)

True iff `id` currently carries state `name`.

#### Parameters

##### id

`string`

##### name

`string`

#### Returns

`boolean`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hasPending`](../../../canvas/src/classes/WorldLayer.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

Defined in: [graph/src/layer/GraphLayer.ts:545](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L545)

Placeholder hit test — returns `null` until proper hit testing wires up
in a later phase (likely via the canvas hit-test pipeline reading the
renderer's shape registry).

#### Parameters

##### \_worldX

`number`

##### \_worldY

`number`

#### Returns

[`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hitTest`](../../../canvas/src/classes/WorldLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:58](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L58)

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`mount`](../../../canvas/src/classes/WorldLayer.md#mount)

***

### nodesWithState()

> **nodesWithState**(`name`): `IterableIterator`\<`string`\>

Defined in: [graph/src/layer/GraphLayer.ts:530](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L530)

Ids currently carrying state `name`. Useful for snapshots / iteration.

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:322](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L322)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onMount`](../../../canvas/src/classes/WorldLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph/src/layer/GraphLayer.ts:392](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L392)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onUnmount`](../../../canvas/src/classes/WorldLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:74](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L74)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onVisibleChange`](../../../canvas/src/classes/WorldLayer.md#onvisiblechange)

***

### setData()

> **setData**(`data`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:414](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L414)

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

> **setEdgeDefaults**(`defaults`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:229](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L229)

Sibling of [setNodeDefaults](#setnodedefaults) for edges.

#### Parameters

##### defaults

[`ResolvableEdgeRenderHints`](../type-aliases/ResolvableEdgeRenderHints.md)

#### Returns

`void`

***

### setEdgeState()

> **setEdgeState**(`id`, `name`, `on?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:475](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L475)

Same as [setNodeState](#setnodestate) for edges.

#### Parameters

##### id

`string`

##### name

`string`

##### on?

`boolean` = `true`

#### Returns

`void`

***

### setEdgeStateConfig()

> **setEdgeStateConfig**(`name`, `config`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:443](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L443)

Same as [setNodeStateConfig](#setnodestateconfig) for edges.

#### Parameters

##### name

`string`

##### config

[`ResolvableEdgeRenderHints`](../type-aliases/ResolvableEdgeRenderHints.md)

#### Returns

`void`

***

### setNodeDefaults()

> **setNodeDefaults**(`defaults`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:211](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L211)

Replace the layer-wide `nodeDefaults` wholesale and re-render every node.

The new value is merged onto the factory `DEFAULT_NODE_HINTS` (so omitted
always-present fields fall back to factory values, not to whatever the
previous user-supplied defaults were). Use [updateNodeDefaults](#updatenodedefaults) to
partial-merge against the current defaults instead of replacing.

Every node currently in the layer is re-rendered because per-render
lookup reads from `nodeDefaults` whenever a per-node hint is omitted.

#### Parameters

##### defaults

[`ResolvableNodeRenderHints`](../type-aliases/ResolvableNodeRenderHints.md)

#### Returns

`void`

***

### setNodeState()

> **setNodeState**(`id`, `name`, `on?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:456](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L456)

Toggle a named state on a node. Defaults to `on=true`. Re-renders the
node with the merged state overrides applied. No-op if the node id is
unknown.

#### Parameters

##### id

`string`

##### name

`string`

##### on?

`boolean` = `true`

#### Returns

`void`

***

### setNodeStateConfig()

> **setNodeStateConfig**(`name`, `config`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:433](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L433)

Configure how a named state restyles a node. Multiple active states stack
— later-set state wins per field. Pass `null` to remove the config.

#### Parameters

##### name

`string`

##### config

[`ResolvableNodeRenderHints`](../type-aliases/ResolvableNodeRenderHints.md)

#### Returns

`void`

#### Example

```ts
graph.setNodeStateConfig('selected', { stroke: 0xfacc15, strokeWidth: 3 });
graph.setNodeStateConfig('hovered', { fill: 0x60a5fa });
graph.setNodeStateConfig('inactive', { alpha: 0.25 });
```

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:115](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L115)

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

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`setZIndex`](../../../canvas/src/classes/WorldLayer.md#setzindex)

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:173](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L173)

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

Defined in: [canvas/src/layers/WorldLayer.ts:78](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/WorldLayer.ts#L78)

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`unmount`](../../../canvas/src/classes/WorldLayer.md#unmount)

***

### updateEdgeDefaults()

> **updateEdgeDefaults**(`patch`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:235](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L235)

Sibling of [updateNodeDefaults](#updatenodedefaults) for edges.

#### Parameters

##### patch

[`ResolvableEdgeRenderHints`](../type-aliases/ResolvableEdgeRenderHints.md)

#### Returns

`void`

***

### updateNodeDefaults()

> **updateNodeDefaults**(`patch`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:223](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/GraphLayer.ts#L223)

Patch-merge `nodeDefaults` against the current resolved defaults and
re-render every node. `undefined` values in `patch` are ignored
(they don't blank out an existing field — pass an explicit `false` /
`0` / factory value to override). Use [setNodeDefaults](#setnodedefaults) for a
wholesale replacement.

#### Parameters

##### patch

[`ResolvableNodeRenderHints`](../type-aliases/ResolvableNodeRenderHints.md)

#### Returns

`void`
