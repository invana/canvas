# Class: LayerRegistry

Defined in: [canvas/src/registries/LayerRegistry.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L35)

## Constructors

### Constructor

> **new LayerRegistry**(`opts`): `LayerRegistry`

Defined in: [canvas/src/registries/LayerRegistry.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L43)

#### Parameters

##### opts

[`LayerRegistryOptions`](../interfaces/LayerRegistryOptions.md)

#### Returns

`LayerRegistry`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [canvas/src/registries/LayerRegistry.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L49)

Number of registered layers.

##### Returns

`number`

## Methods

### add()

> **add**(`layer`): `void`

Defined in: [canvas/src/registries/LayerRegistry.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L58)

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

Defined in: [canvas/src/registries/LayerRegistry.ts:112](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L112)

Iterate layers in z-order (low → high). The Canvas tick walks layers in
z-order to flush dirty work; rendering order is then determined by
pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).

The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### clear()

> **clear**(): `void`

Defined in: [canvas/src/registries/LayerRegistry.ts:139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L139)

Tear down every registered layer. Called on Canvas destroy.
Iteration is over a snapshot so unmount-triggered side effects don't
corrupt the loop.

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`id`): `T`

Defined in: [canvas/src/registries/LayerRegistry.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L92)

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

Defined in: [canvas/src/registries/LayerRegistry.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L96)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### list()

> **list**(): readonly [`ILayer`](../interfaces/ILayer.md)[]

Defined in: [canvas/src/registries/LayerRegistry.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L101)

Snapshot of all layers in insertion order.

#### Returns

readonly [`ILayer`](../interfaces/ILayer.md)[]

***

### mountAll()

> **mountAll**(): `void`

Defined in: [canvas/src/registries/LayerRegistry.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L70)

Mount every not-yet-mounted layer. Called by `Canvas.init` once the context exists.

#### Returns

`void`

***

### remove()

> **remove**(`id`): `void`

Defined in: [canvas/src/registries/LayerRegistry.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L82)

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

Defined in: [canvas/src/registries/LayerRegistry.ts:124](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L124)

Update a layer's `zIndex` and propagate to surfaces. Invalidates the
z-order cache. No-op if the layer isn't registered.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`
