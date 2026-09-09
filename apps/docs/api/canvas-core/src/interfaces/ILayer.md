# Interface: ILayer

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Properties

### cullable

> **cullable**: `boolean`

***

### hittable

> **hittable**: `boolean`

***

### id

> `readonly` **id**: `string`

***

### mounted

> `readonly` **mounted**: `boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

***

### visible

> **visible**: `boolean`

***

### zIndex

> **zIndex**: `number`

## Methods

### flush()

> **flush**(): `void`

#### Returns

`void`

***

### hasPending()

> **hasPending**(): `boolean`

#### Returns

`boolean`

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](CanvasContext.md)

#### Returns

`void`

***

### redraw()

> **redraw**(): `void`

#### Returns

`void`

***

### setVisible()

> **setVisible**(`visible`): `void`

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`
