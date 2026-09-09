# Class: HeadlessElementRenderer

An `IElementRenderer` that tracks which ids exist and their specs, and
answers geometry from the spec alone. Enough for a layer test to assert that
elements were mounted, moved and removed.

## Implements

- [`IElementRenderer`](../interfaces/IElementRenderer.md)

## Constructors

### Constructor

> **new HeadlessElementRenderer**(): `HeadlessElementRenderer`

#### Returns

`HeadlessElementRenderer`

## Properties

### connectors

> `readonly` **connectors**: `Set`\<`string`\>

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../../../renderer-pixijs/src/interfaces/PrimitivesRendererEventMap.md)\>

Element-scoped pointer events — `shape:click`, `connector:pointerover`,
`shape:partcontextmenu`, … Canvas-wide input goes on the kernel bus; this
channel is per-renderer because the payloads name elements it owns.

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`events`](../interfaces/IElementRenderer.md#events)

***

### shapeKinds

> `readonly` **shapeKinds**: `Set`\<`string`\>

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`shapeKinds`](../interfaces/IElementRenderer.md#shapekinds)

***

### shapes

> `readonly` **shapes**: `Map`\<`string`, \{ `kind`: `string`; `x`: `number`; `y`: `number`; \}\>

## Methods

### addConnector()

> **addConnector**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`addConnector`](../interfaces/IElementRenderer.md#addconnector)

***

### addShape()

> **addShape**(`id`, `spec`): `void`

#### Parameters

##### id

`string`

##### spec

###### kind

`string`

###### x?

`number`

###### y?

`number`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`addShape`](../interfaces/IElementRenderer.md#addshape)

***

### boundsOfSpec()

> **boundsOfSpec**(`spec`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

Pure geometry, answered for real: the kernel's spec-geometry covers every
built-in kind, so a headless canvas measures node footprints exactly like
a drawing backend would (`GraphLayer.boundsOfNode`, minimap estimates,
ELK size queries — and `getBounds()`'s store-derived fit box — all work
with no GPU). `undefined` only for unregistered third-party kinds.

#### Parameters

##### spec

###### kind

`string`

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`boundsOfSpec`](../interfaces/IElementRenderer.md#boundsofspec)

***

### collapsedShapeSpec()

> **collapsedShapeSpec**(): `undefined`

#### Returns

`undefined`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`collapsedShapeSpec`](../interfaces/IElementRenderer.md#collapsedshapespec)

***

### connectorGeometryUnchanged()

> **connectorGeometryUnchanged**(): `boolean`

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`connectorGeometryUnchanged`](../interfaces/IElementRenderer.md#connectorgeometryunchanged)

***

### cull()

> **cull**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`cull`](../interfaces/IElementRenderer.md#cull)

***

### destroy()

> **destroy**(): `void`

Release everything this device holds.

Called by whoever *owns* the device. A layer that received its renderer
from `surface.primitives` does **not** own it — the surface does, and
destroys it in `ISurface.destroy()`. Calling it from both places is a
double-free.

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`destroy`](../interfaces/IElementRenderer.md#destroy)

***

### fitShapeSpecToContent()

> **fitShapeSpecToContent**(): `undefined`

#### Returns

`undefined`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`fitShapeSpecToContent`](../interfaces/IElementRenderer.md#fitshapespectocontent)

***

### getConnectorPolyline()

> **getConnectorPolyline**(): `null`

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getConnectorPolyline`](../interfaces/IElementRenderer.md#getconnectorpolyline)

***

### getDecoration()

> **getDecoration**(): `undefined`

#### Returns

`undefined`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getDecoration`](../interfaces/IElementRenderer.md#getdecoration)

***

### getDecorationWorldBounds()

> **getDecorationWorldBounds**(): `null`

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getDecorationWorldBounds`](../interfaces/IElementRenderer.md#getdecorationworldbounds)

***

### getShapeCenter()

> **getShapeCenter**(): `null`

Visual centre of a shape — its bounds' midpoint, not its origin.

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getShapeCenter`](../interfaces/IElementRenderer.md#getshapecenter)

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

#### Parameters

##### id

`string`

#### Returns

`string`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getShapeKind`](../interfaces/IElementRenderer.md#getshapekind)

***

### getShapePosition()

> **getShapePosition**(`id`): `object`

#### Parameters

##### id

`string`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getShapePosition`](../interfaces/IElementRenderer.md#getshapeposition)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(): `null`

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`getShapeWorldBounds`](../interfaces/IElementRenderer.md#getshapeworldbounds)

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`hasConnector`](../interfaces/IElementRenderer.md#hasconnector)

***

### hasShape()

> **hasShape**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`hasShape`](../interfaces/IElementRenderer.md#hasshape)

***

### hitTest()

> **hitTest**(): `null`

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`hitTest`](../interfaces/IElementRenderer.md#hittest)

***

### measureLabel()

> **measureLabel**(): `null`

Text metrics. Backend-provided on purpose — SDF and canvas-2d metrics
genuinely disagree, so this is the `measureText` seam (§5), not a geometry
answer the engine could compute.

#### Returns

`null`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`measureLabel`](../interfaces/IElementRenderer.md#measurelabel)

***

### moveShape()

> **moveShape**(`id`, `x`, `y`): `void`

#### Parameters

##### id

`string`

##### x

`number`

##### y

`number`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`moveShape`](../interfaces/IElementRenderer.md#moveshape)

***

### reanchorAllConnectors()

> **reanchorAllConnectors**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`reanchorAllConnectors`](../interfaces/IElementRenderer.md#reanchorallconnectors)

***

### registerShape()

> **registerShape**(`kind`): `void`

Teach this backend a new element kind. The spec vocabulary stays open —
`containsSpec` / `boundsOfSpec` return `undefined` for kinds they don't
know, and picking falls back to asking the instance.

#### Parameters

##### kind

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`registerShape`](../interfaces/IElementRenderer.md#registershape)

***

### reindexScaledShapeHits()

> **reindexScaledShapeHits**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`reindexScaledShapeHits`](../interfaces/IElementRenderer.md#reindexscaledshapehits)

***

### removeBadge()

> **removeBadge**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`removeBadge`](../interfaces/IElementRenderer.md#removebadge)

***

### removeConnector()

> **removeConnector**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`removeConnector`](../interfaces/IElementRenderer.md#removeconnector)

***

### removeShape()

> **removeShape**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`removeShape`](../interfaces/IElementRenderer.md#removeshape)

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`reRouteAllConnectors`](../interfaces/IElementRenderer.md#rerouteallconnectors)

***

### scaleConnectorStroke()

> **scaleConnectorStroke**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`scaleConnectorStroke`](../interfaces/IElementRenderer.md#scaleconnectorstroke)

***

### scaleShape()

> **scaleShape**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`scaleShape`](../interfaces/IElementRenderer.md#scaleshape)

***

### scaleShapeSpec()

> **scaleShapeSpec**(): `undefined`

#### Returns

`undefined`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`scaleShapeSpec`](../interfaces/IElementRenderer.md#scaleshapespec)

***

### setBadge()

> **setBadge**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setBadge`](../interfaces/IElementRenderer.md#setbadge)

***

### setConnectorStroke()

> **setConnectorStroke**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setConnectorStroke`](../interfaces/IElementRenderer.md#setconnectorstroke)

***

### setDecoration()

> **setDecoration**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setDecoration`](../interfaces/IElementRenderer.md#setdecoration)

***

### setDecorationVisible()

> **setDecorationVisible**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setDecorationVisible`](../interfaces/IElementRenderer.md#setdecorationvisible)

***

### setEffect()

> **setEffect**(): `void`

Attach / replace / clear an effect. Sibling of [setDecoration](../interfaces/IElementRenderer.md#setdecoration): a
decoration adds geometry beside the host, an effect modulates the host
itself (transform delta or style override).

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setEffect`](../interfaces/IElementRenderer.md#seteffect)

***

### setHitTestEnabled()

> **setHitTestEnabled**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setHitTestEnabled`](../interfaces/IElementRenderer.md#sethittestenabled)

***

### setLabelsResolution()

> **setLabelsResolution**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setLabelsResolution`](../interfaces/IElementRenderer.md#setlabelsresolution)

***

### setRaised()

> **setRaised**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setRaised`](../interfaces/IElementRenderer.md#setraised)

***

### setShapeIconVisible()

> **setShapeIconVisible**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setShapeIconVisible`](../interfaces/IElementRenderer.md#setshapeiconvisible)

***

### setShapeImageVisible()

> **setShapeImageVisible**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setShapeImageVisible`](../interfaces/IElementRenderer.md#setshapeimagevisible)

***

### setShapeTextVisible()

> **setShapeTextVisible**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setShapeTextVisible`](../interfaces/IElementRenderer.md#setshapetextvisible)

***

### setVisibleSet()

> **setVisibleSet**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`setVisibleSet`](../interfaces/IElementRenderer.md#setvisibleset)

***

### tickAnimations()

> **tickAnimations**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`tickAnimations`](../interfaces/IElementRenderer.md#tickanimations)

***

### toSVG()

> **toSVG**(): `string`

Vector fragment for this renderer's elements. Spec-driven; every backend can answer.

#### Returns

`string`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`toSVG`](../interfaces/IElementRenderer.md#tosvg)

***

### uncull()

> **uncull**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`uncull`](../interfaces/IElementRenderer.md#uncull)

***

### updateConnector()

> **updateConnector**(): `void`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`updateConnector`](../interfaces/IElementRenderer.md#updateconnector)

***

### updateShape()

> **updateShape**(`id`, `patch`): `void`

#### Parameters

##### id

`string`

##### patch

###### x?

`number`

###### y?

`number`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../interfaces/IElementRenderer.md).[`updateShape`](../interfaces/IElementRenderer.md#updateshape)
