# Interface: IElementRenderer

The slice of a renderer this projector drives.

## Extends

- [`SpecProjectionTarget`](SpecProjectionTarget.md)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../classes/EventEmitter.md)\<[`PrimitivesRendererEventMap`](../../../renderer-pixijs/src/interfaces/PrimitivesRendererEventMap.md)\>

Element-scoped pointer events — `shape:click`, `connector:pointerover`,
`shape:partcontextmenu`, … Canvas-wide input goes on the kernel bus; this
channel is per-renderer because the payloads name elements it owns.

***

### shapeKinds

> `readonly` **shapeKinds**: `ReadonlySet`\<`string`\>

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`shapeKinds`](SpecProjectionTarget.md#shapekinds)

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../../../renderer-pixijs/src/interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`addConnector`](SpecProjectionTarget.md#addconnector)

***

### addShape()

> **addShape**\<`TSpec`\>(`id`, `spec`): `void`

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../../../renderer-pixijs/src/interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`addShape`](SpecProjectionTarget.md#addshape)

***

### boundsOfSpec()

> **boundsOfSpec**(`spec`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Parameters

##### spec

###### kind

`string`

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### collapsedShapeSpec()

> **collapsedShapeSpec**(`spec`): `Record`\<`string`, `unknown`\>

#### Parameters

##### spec

###### kind

`string`

#### Returns

`Record`\<`string`, `unknown`\>

***

### connectorGeometryUnchanged()

> **connectorGeometryUnchanged**(`id`, `next`): `boolean`

#### Parameters

##### id

`string`

##### next

[`BaseConnectorSpec`](../../../renderer-pixijs/src/interfaces/BaseConnectorSpec.md)

#### Returns

`boolean`

***

### cull()

> **cull**(`visibleBounds`, `padWorld?`): `void`

#### Parameters

##### visibleBounds

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

##### padWorld?

`number`

#### Returns

`void`

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

***

### fitShapeSpecToContent()

> **fitShapeSpecToContent**(`spec`, `content`): `Record`\<`string`, `unknown`\>

#### Parameters

##### spec

###### kind

`string`

##### content

###### height

`number`

###### width

`number`

#### Returns

`Record`\<`string`, `unknown`\>

***

### getConnectorPolyline()

> **getConnectorPolyline**(`id`): readonly [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)[]

#### Parameters

##### id

`string`

#### Returns

readonly [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)[]

***

### getDecoration()

> **getDecoration**(`id`, `slot`): [`MountedDecoration`](MountedDecoration.md)\<`unknown`\>

#### Parameters

##### id

`string`

##### slot

`string`

#### Returns

[`MountedDecoration`](MountedDecoration.md)\<`unknown`\>

***

### getDecorationWorldBounds()

> **getDecorationWorldBounds**(`targetId`, `slot`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Parameters

##### targetId

`string`

##### slot

`string`

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

Visual centre of a shape — its bounds' midpoint, not its origin.

#### Parameters

##### id

`string`

#### Returns

[`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

#### Parameters

##### id

`string`

#### Returns

`string`

#### Overrides

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`getShapeKind`](SpecProjectionTarget.md#getshapekind)

***

### getShapePosition()

> **getShapePosition**(`id`): [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

#### Parameters

##### id

`string`

#### Returns

[`Point`](../../../renderer-pixijs/src/interfaces/Point.md)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Parameters

##### id

`string`

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Overrides

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`hasConnector`](SpecProjectionTarget.md#hasconnector)

***

### hasShape()

> **hasShape**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`, `exclude?`): [`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### exclude?

`ReadonlySet`\<`string`\>

#### Returns

[`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

***

### measureLabel()

> **measureLabel**(`content`, `wrap?`): `object`

Text metrics. Backend-provided on purpose — SDF and canvas-2d metrics
genuinely disagree, so this is the `measureText` seam (§5), not a geometry
answer the engine could compute.

#### Parameters

##### content

[`LabelContent`](../../../renderer-pixijs/src/type-aliases/LabelContent.md)

##### wrap?

[`LabelWrap`](../../../renderer-pixijs/src/interfaces/LabelWrap.md)

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

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

***

### reanchorAllConnectors()

> **reanchorAllConnectors**(): `void`

#### Returns

`void`

***

### registerShape()

> **registerShape**(`kind`, `ctor`): `void`

Teach this backend a new element kind. The spec vocabulary stays open —
`containsSpec` / `boundsOfSpec` return `undefined` for kinds they don't
know, and picking falls back to asking the instance.

#### Parameters

##### kind

`string`

##### ctor

[`CustomElementCtor`](../type-aliases/CustomElementCtor.md)

#### Returns

`void`

***

### reindexScaledShapeHits()

> **reindexScaledShapeHits**(`ids?`): `void`

#### Parameters

##### ids?

`Iterable`\<`string`\>

#### Returns

`void`

***

### removeBadge()

> **removeBadge**(`hostId`, `slot`): `void`

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`void`

***

### removeConnector()

> **removeConnector**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`removeConnector`](SpecProjectionTarget.md#removeconnector)

***

### removeShape()

> **removeShape**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`removeShape`](SpecProjectionTarget.md#removeshape)

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

#### Returns

`void`

***

### scaleConnectorStroke()

> **scaleConnectorStroke**(`id`, `scale`): `void`

#### Parameters

##### id

`string`

##### scale

`number`

#### Returns

`void`

***

### scaleShape()

> **scaleShape**(`id`, `scale`): `void`

#### Parameters

##### id

`string`

##### scale

`number`

#### Returns

`void`

***

### scaleShapeSpec()

> **scaleShapeSpec**(`spec`, `factor`): `Record`\<`string`, `unknown`\>

#### Parameters

##### spec

###### kind

`string`

##### factor

`number`

#### Returns

`Record`\<`string`, `unknown`\>

***

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

#### Parameters

##### hostId

`string`

##### slot

`string`

##### options

[`BadgeOptions`](BadgeOptions.md)

#### Returns

`void`

***

### setConnectorStroke()

> **setConnectorStroke**(`id`, `stroke`): `void`

#### Parameters

##### id

`string`

##### stroke

###### color

`number`

###### width

`number`

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### decoration

[`DecorationSpec`](../../../renderer-pixijs/src/interfaces/DecorationSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setDecorationVisible()

> **setDecorationVisible**(`targetId`, `slot`, `visible`): `void`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setEffect()

> **setEffect**\<`TStyle`\>(`targetId`, `slot`, `effect`): `void`

Attach / replace / clear an effect. Sibling of [setDecoration](#setdecoration): a
decoration adds geometry beside the host, an effect modulates the host
itself (transform delta or style override).

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### effect

[`EffectSpec`](../../../renderer-pixijs/src/interfaces/EffectSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setHitTestEnabled()

> **setHitTestEnabled**(`enabled`): `void`

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### setLabelsResolution()

> **setLabelsResolution**(`resolution`): `void`

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setRaised()

> **setRaised**(`ids`): `void`

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### setShapeIconVisible()

> **setShapeIconVisible**(`id`, `visible`): `void`

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setShapeImageVisible()

> **setShapeImageVisible**(`id`, `visible`): `void`

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setShapeTextVisible()

> **setShapeTextVisible**(`id`, `visible`): `void`

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setVisibleSet()

> **setVisibleSet**(`ids`): `void`

#### Parameters

##### ids

`ReadonlySet`\<`string`\>

#### Returns

`void`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### toSVG()

> **toSVG**(): `string`

Vector fragment for this renderer's elements. Spec-driven; every backend can answer.

#### Returns

`string`

***

### uncull()

> **uncull**(): `void`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `patch`): `void`

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../../../renderer-pixijs/src/interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### patch

`Partial`\<`TSpec`\>

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`updateConnector`](SpecProjectionTarget.md#updateconnector)

***

### updateShape()

> **updateShape**\<`TSpec`\>(`id`, `patch`): `void`

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../../../renderer-pixijs/src/interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### patch

`Partial`\<`TSpec`\>

#### Returns

`void`

#### Inherited from

[`SpecProjectionTarget`](SpecProjectionTarget.md).[`updateShape`](SpecProjectionTarget.md#updateshape)
