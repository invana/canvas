# Class: LayerRegistry

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:35](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L35)

## Constructors

### Constructor

> **new LayerRegistry**(`opts`): `LayerRegistry`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:43](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L43)

#### Parameters

##### opts

[`LayerRegistryOptions`](../interfaces/LayerRegistryOptions.md)

#### Returns

`LayerRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:49](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L49)

Number of registered layers.

##### Returns

`number`

## Methods

### add()

> **add**(`layer`): `void`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:57](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L57)

Add a Layer to the canvas. Calls `layer.mount(ctx)` and fires `layer:added`.
Throws if `id` is already registered.

#### Parameters

##### layer

[`ILayer`](../interfaces/ILayer.md)

#### Returns

`void`

***

### byZOrder()

> **byZOrder**(): readonly [`ILayer`](../interfaces/ILayer.md)[]

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:101](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L101)

Iterate layers in z-order (low → high). The Canvas tick walks layers in
z-order to flush dirty work; rendering order is then determined by
pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).

The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### clear()

> **clear**(): `void`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:128](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L128)

Tear down every registered layer. Called on Canvas destroy.
Iteration is over a snapshot so unmount-triggered side effects don't
corrupt the loop.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:81](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L81)

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

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:85](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L85)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`ILayer`](../interfaces/ILayer.md)[]

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:90](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L90)

Snapshot of all layers in insertion order.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### remove()

> **remove**(`id`): `void`

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:71](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L71)

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

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:113](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/registries/LayerRegistry.ts#L113)

Update a layer's `zIndex` and propagate to surfaces. Invalidates the
z-order cache. No-op if the layer isn't registered.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`
