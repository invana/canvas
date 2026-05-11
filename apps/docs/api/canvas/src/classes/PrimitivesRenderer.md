# Class: PrimitivesRenderer

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:116](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L116)

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:141](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L141)

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:138](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L138)

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:135](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L135)

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:548](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L548)

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:544](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L544)

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:265](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L265)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### addShape()

> **addShape**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:212](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L212)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:624](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L624)

#### Returns

`void`

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:536](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L536)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:593](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L593)

World-space geometric **centre** of the registered shape's bounding box,
or `null` when no shape with that id exists. Differs from
`getShapePosition` for shapes whose local origin isn't the centre
(`RectShape` is anchored top-left; `CircleShape` is already centred).

This is the canonical "anchor reference point" for layer code that wants
a uniform centre regardless of shape kind — connector routing, badge
placement, fit-to-content, etc.

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

***

### getShapePosition()

> **getShapePosition**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:578](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L578)

World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
use this when a behaviour needs the shape's translation point (drag
offset baseline, anchor for an external overlay, etc.).

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): [`Rect`](../interfaces/Rect.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:567](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L567)

World-space AABB of the registered shape, or `null` when no shape with
that id exists. Domain-free read accessor for layer code that needs to
query shape geometry without poking at private state — e.g. a graph
layer building an obstacle list for an edge's router, a behaviour that
wants to fit content to a selection, or a debug overlay.

#### Parameters

##### id

`string`

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### hasBadge()

> **hasBadge**(`hostId`, `slot`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:442](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L442)

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`boolean`

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:556](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L556)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:552](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L552)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`): [`HitResult`](../interfaces/HitResult.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:495](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L495)

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`HitResult`](../interfaces/HitResult.md)

***

### rasteriseLabel()

> **rasteriseLabel**(`id`, `resolution`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:477](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L477)

#### Parameters

##### id

`string`

##### resolution

`number`

#### Returns

`void`

***

### registerAnchor()

> **registerAnchor**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:195](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L195)

#### Parameters

##### kind

`string`

##### fn

[`IAnchor`](../type-aliases/IAnchor.md)

#### Returns

`void`

***

### registerDecoration()

> **registerDecoration**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:199](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L199)

#### Type Parameters

##### TStyle

`TStyle`

#### Parameters

##### kind

`string`

##### ctor

(`style`) => [`IShapeDecoration`](../type-aliases/IShapeDecoration.md)\<`TStyle`\> \| [`IConnectorDecoration`](../type-aliases/IConnectorDecoration.md)\<`TStyle`\>

##### opts

[`RegisterDecorationOptions`](../interfaces/RegisterDecorationOptions.md)

#### Returns

`void`

***

### registerPathStyle()

> **registerPathStyle**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:191](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L191)

#### Parameters

##### kind

`string`

##### fn

[`IPathStyle`](../type-aliases/IPathStyle.md)

#### Returns

`void`

***

### registerRouter()

> **registerRouter**(`kind`, `fn`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:187](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L187)

#### Parameters

##### kind

`string`

##### fn

[`IRouter`](../type-aliases/IRouter.md)

#### Returns

`void`

***

### registerShape()

> **registerShape**\<`TSpec`\>(`kind`, `ctor`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:183](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L183)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### kind

`string`

##### ctor

[`ShapeCtor`](../interfaces/ShapeCtor.md)\<`TSpec`\>

#### Returns

`void`

***

### removeBadge()

> **removeBadge**(`hostId`, `slot`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:433](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L433)

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

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:294](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L294)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:246](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L246)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:613](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L613)

Re-route every registered connector. Useful after a non-endpoint shape
moves (e.g. an obstacle) and you want connectors that auto-collect
obstacles to update their path.

Each call re-runs `routePath` per connector and refreshes the hit index
and any connector decorations. Linear in `connectorInstances`; safe to
call from drag handlers in typical layouts. Heavy graphs with thousands
of edges should prefer a targeted re-route (future).

#### Returns

`void`

***

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:396](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L396)

Attach a badge to a host shape. The badge is registered as a real shape
under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
any registered shape kind as the plate, any `ShapeFillLayer` as content
(solid / image / glyph / text / svg / image-inset / svg-url), and any
registered decoration via the `decorations` field.

On `updateShape(hostId, …)` every attached badge re-anchors automatically.
On `removeShape(hostId)` every attached badge is removed first.

Calling `setBadge` with the same `(hostId, slot)` replaces the previous
badge (the old badge shape and any of its decorations are destroyed).

#### Parameters

##### hostId

`string`

##### slot

`string`

##### options

[`BadgeOptions`](../interfaces/BadgeOptions.md)

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:306](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L306)

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### decoration

[`DecorationSpec`](../interfaces/DecorationSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setLODLevel()

> **setLODLevel**(`id`, `level`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:467](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L467)

#### Parameters

##### id

`string`

##### level

`number`

#### Returns

`void`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:485](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L485)

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:284](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L284)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`

***

### updateShape()

> **updateShape**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:236](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/PrimitivesRenderer.ts#L236)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`
