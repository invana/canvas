# Interface: ISurface

## Properties

### id

> `readonly` **id**: `string`

Stable id — the owning layer's id. Names the surface in a scene tree.

***

### primitives

> `readonly` **primitives**: [`IElementRenderer`](IElementRenderer.md)

This layer's drawing device: the target a `SpecProjector` drives from the
store, plus the per-frame commands and geometry answers a domain layer
still calls directly. Pixi-free, so `@invana/graph` drives a backend it
never imports.

***

### space

> `readonly` **space**: [`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

***

### overlay()

> **overlay**(`label`): [`IOverlayDevice`](IOverlayDevice.md)

An immediate-mode device for **transient** visuals owned by this layer
(a minimap's viewport box, a hover outline). Anything durable is a spec.

#### Parameters

##### label

`string`

#### Returns

[`IOverlayDevice`](IOverlayDevice.md)

***

### setBackdrop()

> **setBackdrop**(`backdrop`): `void`

Paint (or clear, with `null`) this surface's backdrop. Cheap to call every
frame: a backend rebuilds its tile texture only when `tile.source` changes
identity, so a camera-following pattern costs a transform write.

#### Parameters

##### backdrop

[`SurfaceBackdrop`](SurfaceBackdrop.md)

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

### setZIndex()

> **setZIndex**(`z`): `void`

#### Parameters

##### z

`number`

#### Returns

`void`
