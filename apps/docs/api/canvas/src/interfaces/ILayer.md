# Interface: ILayer

Defined in: [canvas/src/layers/Layer.ts:42](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L42)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Properties

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:47](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L47)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L45)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L43)

***

### visible

> **visible**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:44](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L44)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:46](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L46)

## Methods

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:50](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L50)

#### Returns

`void`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:51](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L51)

#### Returns

`boolean`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/Layer.ts:48](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L48)

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/Layer.ts:49](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L49)

#### Returns

`void`
