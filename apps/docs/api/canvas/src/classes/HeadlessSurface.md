# Class: HeadlessSurface

## Implements

- [`ISurface`](../interfaces/ISurface.md)

## Constructors

### Constructor

> **new HeadlessSurface**(`id`, `space`): `HeadlessSurface`

#### Parameters

##### id

`string`

##### space

[`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

#### Returns

`HeadlessSurface`

## Properties

### backdrop

> **backdrop**: [`SurfaceBackdrop`](../interfaces/SurfaceBackdrop.md)

Last backdrop pushed — lets a background test assert without pixels.

***

### destroyed

> **destroyed**: `boolean`

***

### id

> `readonly` **id**: `string`

Stable id — the owning layer's id. Names the surface in a scene tree.

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`id`](../interfaces/ISurface.md#id)

***

### primitives

> `readonly` **primitives**: [`HeadlessElementRenderer`](HeadlessElementRenderer.md)

This layer's drawing device: the target a `SpecProjector` drives from the
store, plus the per-frame commands and geometry answers a domain layer
still calls directly. Pixi-free, so `@invana/graph` drives a backend it
never imports.

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`primitives`](../interfaces/ISurface.md#primitives)

***

### space

> `readonly` **space**: [`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`space`](../interfaces/ISurface.md#space)

***

### visible

> **visible**: `boolean`

***

### zIndex

> **zIndex**: `number`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`destroy`](../interfaces/ISurface.md#destroy)

***

### overlay()

> **overlay**(): [`IOverlayDevice`](../interfaces/IOverlayDevice.md)

An immediate-mode device for **transient** visuals owned by this layer
(a minimap's viewport box, a hover outline). Anything durable is a spec.

#### Returns

[`IOverlayDevice`](../interfaces/IOverlayDevice.md)

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`overlay`](../interfaces/ISurface.md#overlay)

***

### setBackdrop()

> **setBackdrop**(`backdrop`): `void`

Paint (or clear, with `null`) this surface's backdrop. Cheap to call every
frame: a backend rebuilds its tile texture only when `tile.source` changes
identity, so a camera-following pattern costs a transform write.

#### Parameters

##### backdrop

[`SurfaceBackdrop`](../interfaces/SurfaceBackdrop.md)

#### Returns

`void`

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`setBackdrop`](../interfaces/ISurface.md#setbackdrop)

***

### setVisible()

> **setVisible**(`visible`): `void`

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`setVisible`](../interfaces/ISurface.md#setvisible)

***

### setZIndex()

> **setZIndex**(`z`): `void`

#### Parameters

##### z

`number`

#### Returns

`void`

#### Implementation of

[`ISurface`](../interfaces/ISurface.md).[`setZIndex`](../interfaces/ISurface.md#setzindex)
