# Class: SpecProjector\<TSpec\>

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../../../renderer-pixijs/src/interfaces/BaseShapeSpec.md) \| [`BaseConnectorSpec`](../../../renderer-pixijs/src/interfaces/BaseConnectorSpec.md)

## Constructors

### Constructor

> **new SpecProjector**\<`TSpec`\>(`specs`, `target`, `options?`): `SpecProjector`\<`TSpec`\>

#### Parameters

##### specs

`SpecStore`\<`TSpec`\>

##### target

[`SpecProjectionTarget`](../interfaces/SpecProjectionTarget.md)

##### options?

[`SpecProjectorOptions`](../interfaces/SpecProjectorOptions.md)

#### Returns

`SpecProjector`\<`TSpec`\>

## Methods

### destroy()

> **destroy**(): `void`

Drop the flush subscription.

#### Returns

`void`

***

### project()

> **project**(`id`): `void`

Mount / update `id` from the store **now**, and mark it handled so the next
flush skips it.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### unproject()

> **unproject**(`id`): `void`

Remove whatever the renderer holds for `id`, whichever kind it is.

#### Parameters

##### id

`string`

#### Returns

`void`
