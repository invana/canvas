# Class: LayoutRegistry

Defined in: [canvas/src/registries/LayoutRegistry.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L17)

## Constructors

### Constructor

> **new LayoutRegistry**(`opts`): `LayoutRegistry`

Defined in: [canvas/src/registries/LayoutRegistry.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L21)

#### Parameters

##### opts

[`LayoutRegistryOptions`](../interfaces/LayoutRegistryOptions.md)

#### Returns

`LayoutRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [canvas/src/registries/LayoutRegistry.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L25)

##### Returns

`number`

## Methods

### add()

> **add**(`layout`): `void`

Defined in: [canvas/src/registries/LayoutRegistry.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L30)

Register a layout. Fires `layout:added`. Throws on duplicate id.

#### Parameters

##### layout

[`Layout`](Layout.md)

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [canvas/src/registries/LayoutRegistry.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L60)

Stop + drop every layout. Called on Canvas destroy.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Defined in: [canvas/src/registries/LayoutRegistry.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L47)

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

Defined in: [canvas/src/registries/LayoutRegistry.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L51)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\>[]

Defined in: [canvas/src/registries/LayoutRegistry.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L55)

#### Returns

readonly [`Layout`](Layout.md)\<[`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>\>[]

***

### remove()

> **remove**(`id`): `void`

Defined in: [canvas/src/registries/LayoutRegistry.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayoutRegistry.ts#L39)

Remove a layout, stopping it first if it exposes `stop()`. Fires `layout:removed`.

#### Parameters

##### id

`string`

#### Returns

`void`
