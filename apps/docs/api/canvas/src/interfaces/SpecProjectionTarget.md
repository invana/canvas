# Interface: SpecProjectionTarget

The slice of a renderer this projector drives.

## Extended by

- [`IElementRenderer`](IElementRenderer.md)

## Properties

### shapeKinds

> `readonly` **shapeKinds**: `ReadonlySet`\<`string`\>

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

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

#### Parameters

##### id

`string`

#### Returns

`string`

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### removeConnector()

> **removeConnector**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

#### Parameters

##### id

`string`

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
