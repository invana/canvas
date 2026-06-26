# Interface: ILayer

Defined in: [canvas/src/layers/Layer.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L42)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Properties

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L47)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L45)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L43)

***

### mounted

> `readonly` **mounted**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L49)

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

***

### visible

> **visible**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L44)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L46)

## Methods

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L52)

#### Returns

`void`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L53)

#### Returns

`boolean`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/Layer.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L50)

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`

***

### redraw()

> **redraw**(): `void`

Defined in: [canvas/src/layers/Layer.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L54)

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/Layer.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L51)

#### Returns

`void`
