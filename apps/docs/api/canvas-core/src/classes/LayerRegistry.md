# Class: LayerRegistry

## Constructors

### Constructor

> **new LayerRegistry**(`opts`): `LayerRegistry`

#### Parameters

##### opts

[`LayerRegistryOptions`](../interfaces/LayerRegistryOptions.md)

#### Returns

`LayerRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Number of registered layers.

##### Returns

`number`

## Methods

### add()

> **add**(`layer`): `void`

Add a Layer to the canvas. Mounts immediately if the Canvas is initialised;
otherwise the layer waits for `mountAll()` (called by `Canvas.init`). Fires
`layer:added`. Throws if `id` is already registered.

#### Parameters

##### layer

[`ILayer`](../interfaces/ILayer.md)

#### Returns

`void`

***

### byZOrder()

> **byZOrder**(): readonly [`ILayer`](../interfaces/ILayer.md)[]

Iterate layers in z-order (low → high). The Canvas tick walks layers in
z-order to flush dirty work; rendering order is then determined by
pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).

The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### clear()

> **clear**(): `void`

Tear down every registered layer. Called on Canvas destroy.
Iteration is over a snapshot so unmount-triggered side effects don't
corrupt the loop.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Typed get by id. Returns `undefined` if not found.

#### Type Parameters

##### T

`T` *extends* [`ILayer`](../interfaces/ILayer.md) = [`ILayer`](../interfaces/ILayer.md)

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

> **list**(): readonly [`ILayer`](../interfaces/ILayer.md)[]

Snapshot of all layers in insertion order.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### mountAll()

> **mountAll**(): `void`

Mount every not-yet-mounted layer. Called by `Canvas.init` once the context exists.

#### Returns

`void`

***

### remove()

> **remove**(`id`): `void`

Remove a Layer. Calls `layer.unmount()` and fires `layer:removed`.
No-op if `id` isn't registered.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`id`, `zIndex`): `void`

Update a layer's `zIndex` and propagate to surfaces. Invalidates the
z-order cache. No-op if the layer isn't registered.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`
