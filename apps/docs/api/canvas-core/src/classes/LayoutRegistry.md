# Class: LayoutRegistry

## Constructors

### Constructor

> **new LayoutRegistry**(`opts`): `LayoutRegistry`

#### Parameters

##### opts

[`LayoutRegistryOptions`](../interfaces/LayoutRegistryOptions.md)

#### Returns

`LayoutRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

##### Returns

`number`

## Methods

### add()

> **add**(`layout`): `void`

Register a layout. Fires `layout:added`. Throws on duplicate id.

#### Parameters

##### layout

[`Layout`](Layout.md)

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Stop + drop every layout. Called on Canvas destroy.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

#### Type Parameters

##### T

`T` *extends* [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\> = [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\>

#### Parameters

##### id

`string`

#### Returns

`T`

***

### has()

> **has**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\>[]

#### Returns

readonly [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\>[]

***

### remove()

> **remove**(`id`): `void`

Remove a layout, stopping it first if it exposes `stop()`. Fires `layout:removed`.

#### Parameters

##### id

`string`

#### Returns

`void`
