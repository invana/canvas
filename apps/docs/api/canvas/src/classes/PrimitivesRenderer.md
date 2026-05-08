# Class: PrimitivesRenderer

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:96

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:114

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:110

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:107

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:399

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:395

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:200

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:158

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:413

#### Returns

`void`

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:387

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:407

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:403

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`): [`HitResult`](../interfaces/HitResult.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:346

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:328

#### Parameters

##### id

`string`

##### resolution

`number`

#### Returns

`void`

***

### registerDecoration()

> **registerDecoration**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:145

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

### registerRouter()

> **registerRouter**(`kind`, `fn`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:141

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:137

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

### removeConnector()

> **removeConnector**(`id`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:229

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:188

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:241

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:318

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:336

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:219

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

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:179

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
