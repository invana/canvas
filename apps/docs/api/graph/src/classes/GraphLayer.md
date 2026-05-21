# Class: GraphLayer

Defined in: [graph/src/layer/GraphLayer.ts:110](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L110)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`WorldLayer`](../../../canvas/src/classes/WorldLayer.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md), `GraphLayerState`, [`GraphLayerEvents`](../interfaces/GraphLayerEvents.md), `never`, [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)\>

## Constructors

### Constructor

> **new GraphLayer**(`opts`): `GraphLayer`

Defined in: [graph/src/layer/GraphLayer.ts:219](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L219)

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

Defined in: [canvas/src/layers/WorldLayer.ts:38](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L38)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`_container`](../../../canvas/src/classes/WorldLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`ctx`](../../../canvas/src/classes/WorldLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`cullable`](../../../canvas/src/classes/WorldLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`dirty`](../../../canvas/src/classes/WorldLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphLayerEvents`](../interfaces/GraphLayerEvents.md)\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`events`](../../../canvas/src/classes/WorldLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hittable`](../../../canvas/src/classes/WorldLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`id`](../../../canvas/src/classes/WorldLayer.md#id)

***

### options

> `readonly` **options**: [`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`options`](../../../canvas/src/classes/WorldLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<`GraphLayerState`\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`state`](../../../canvas/src/classes/WorldLayer.md#state)

***

### store

> `readonly` **store**: [`GraphStore`](GraphStore.md)

Defined in: [graph/src/layer/GraphLayer.ts:145](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L145)

Data source. Either supplied by the caller or self-created.

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`zIndex`](../../../canvas/src/classes/WorldLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:47](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L47)

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

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`context`](../../../canvas/src/classes/WorldLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`mounted`](../../../canvas/src/classes/WorldLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L101)

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

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L189)

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

### boundsOfNode()

> **boundsOfNode**(`node`): `any`

Defined in: [graph/src/layer/GraphLayer.ts:599](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L599)

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

### clearEdgeState()

> **clearEdgeState**(`name`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:465](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L465)

#### Parameters

##### name

`string`

#### Returns

`void`

***

### clearNodeState()

> **clearNodeState**(`name`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:454](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L454)

Remove state `name` from every node that carries it, in one pass. Useful
for clearing a transient selection / hover set without iterating
externally.

#### Parameters

##### name

`string`

#### Returns

`void`

***

### collapsedAncestor()

> **collapsedAncestor**(`nodeId`): `string`

Defined in: [graph/src/layer/GraphLayer.ts:1360](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1360)

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

Defined in: [canvas/src/layers/WorldLayer.ts:102](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L102)

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

Defined in: [canvas/src/layers/WorldLayer.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L91)

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

Defined in: [graph/src/layer/GraphLayer.ts:233](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L233)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLayerState`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createState`](../../../canvas/src/classes/WorldLayer.md#createstate)

***

### edgesWithState()

> **edgesWithState**(`name`): `IterableIterator`\<`string`\>

Defined in: [graph/src/layer/GraphLayer.ts:481](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L481)

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### effectiveEndpoint()

> **effectiveEndpoint**(`nodeId`): `string`

Defined in: [graph/src/layer/GraphLayer.ts:1377](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1377)

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

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`flush`](../../../canvas/src/classes/WorldLayer.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [canvas/src/layers/WorldLayer.ts:129](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L129)

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

### getGroupRole()

> **getGroupRole**(`nodeId`): `"none"` \| `"expanded"` \| `"collapsed"`

Defined in: [graph/src/layer/GraphLayer.ts:1346](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1346)

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

> **getRenderer**(): [`PrimitivesRenderer`](../../../canvas/src/classes/PrimitivesRenderer.md)

Defined in: [graph/src/layer/GraphLayer.ts:126](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L126)

Renderer accessor for behaviours. Undefined before `onMount`.

#### Returns

[`PrimitivesRenderer`](../../../canvas/src/classes/PrimitivesRenderer.md)

***

### hasEdgeState()

> **hasEdgeState**(`id`, `name`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:445](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L445)

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

Defined in: [graph/src/layer/GraphLayer.ts:441](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L441)

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

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hasPending`](../../../canvas/src/classes/WorldLayer.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

Defined in: [graph/src/layer/GraphLayer.ts:492](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L492)

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

### isCollapsedGroup()

> **isCollapsedGroup**(`node`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:1325](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1325)

True when this group node's resolved style carries `group.collapsed === true`.

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)

#### Returns

`boolean`

***

### isGroupNode()

> **isGroupNode**(`node`): `boolean`

Defined in: [graph/src/layer/GraphLayer.ts:1319](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1319)

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

Defined in: [canvas/src/layers/WorldLayer.ts:58](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L58)

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

Defined in: [graph/src/layer/GraphLayer.ts:477](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L477)

Ids currently carrying state `name`. Useful for snapshots / iteration.

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:237](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L237)

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

Defined in: [graph/src/layer/GraphLayer.ts:366](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L366)

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onUnmount`](../../../canvas/src/classes/WorldLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:74](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L74)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onVisibleChange`](../../../canvas/src/classes/WorldLayer.md#onvisiblechange)

***

### recomputeGroup()

> **recomputeGroup**(`groupId`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:1542](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L1542)

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

### resolveEdgeStyle()

> **resolveEdgeStyle**(`edge`): `Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

Defined in: [graph/src/layer/GraphLayer.ts:545](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L545)

Sibling of [resolveNodeStyle](#resolvenodestyle) for edges. Public for the same reason.

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)

#### Returns

`Partial`\<[`EdgeStyle`](../interfaces/EdgeStyle.md)\>

***

### resolveNodeStyle()

> **resolveNodeStyle**(`node`): `Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

Defined in: [graph/src/layer/GraphLayer.ts:522](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L522)

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

Defined in: [graph/src/layer/GraphLayer.ts:388](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L388)

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

### setEdgeState()

> **setEdgeState**(`id`, `name`, `on?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:422](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L422)

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

### setNodeState()

> **setNodeState**(`id`, `name`, `on?`): `void`

Defined in: [graph/src/layer/GraphLayer.ts:403](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L403)

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

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:115](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L115)

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

Defined in: [graph/src/layer/GraphLayer.ts:140](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/GraphLayer.ts#L140)

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

Defined in: [canvas/src/layers/WorldLayer.ts:78](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/WorldLayer.ts#L78)

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`unmount`](../../../canvas/src/classes/WorldLayer.md#unmount)
