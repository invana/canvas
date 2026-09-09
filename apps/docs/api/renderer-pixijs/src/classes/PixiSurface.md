# Class: PixiSurface

## Implements

- [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

## Constructors

### Constructor

> **new PixiSurface**(`opts`): `PixiSurface`

#### Parameters

##### opts

[`PixiSurfaceOptions`](../interfaces/PixiSurfaceOptions.md)

#### Returns

`PixiSurface`

## Properties

### id

> `readonly` **id**: `string`

Stable id — the owning layer's id. Names the surface in a scene tree.

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`id`](../../../canvas/src/interfaces/ISurface.md#id)

***

### primitives

> `readonly` **primitives**: [`PrimitivesRenderer`](PrimitivesRenderer.md)

This layer's drawing device: the target a `SpecProjector` drives from the
store, plus the per-frame commands and geometry answers a domain layer
still calls directly. Pixi-free, so `@invana/graph` drives a backend it
never imports.

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`primitives`](../../../canvas/src/interfaces/ISurface.md#primitives)

***

### root

> `readonly` **root**: `Container`

The pixi root. Renderer-side only; nothing outside this package reaches for
it, and it moves to `@invana/renderer-pixijs` whole.

***

### space

> `readonly` **space**: [`SurfaceSpace`](../../../canvas/src/type-aliases/SurfaceSpace.md)

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`space`](../../../canvas/src/interfaces/ISurface.md#space)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`destroy`](../../../canvas/src/interfaces/ISurface.md#destroy)

***

### overlay()

> **overlay**(`label`): [`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md)

An immediate-mode device for **transient** visuals owned by this layer
(a minimap's viewport box, a hover outline). Anything durable is a spec.

#### Parameters

##### label

`string`

#### Returns

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md)

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`overlay`](../../../canvas/src/interfaces/ISurface.md#overlay)

***

### setBackdrop()

> **setBackdrop**(`backdrop`): `void`

Paint (or clear, with `null`) this surface's backdrop. Cheap to call every
frame: a backend rebuilds its tile texture only when `tile.source` changes
identity, so a camera-following pattern costs a transform write.

#### Parameters

##### backdrop

[`SurfaceBackdrop`](../../../canvas/src/interfaces/SurfaceBackdrop.md)

#### Returns

`void`

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`setBackdrop`](../../../canvas/src/interfaces/ISurface.md#setbackdrop)

***

### setVisible()

> **setVisible**(`visible`): `void`

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`setVisible`](../../../canvas/src/interfaces/ISurface.md#setvisible)

***

### setZIndex()

> **setZIndex**(`z`): `void`

#### Parameters

##### z

`number`

#### Returns

`void`

#### Implementation of

[`ISurface`](../../../canvas/src/interfaces/ISurface.md).[`setZIndex`](../../../canvas/src/interfaces/ISurface.md#setzindex)
