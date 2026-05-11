# Interface: LayerRegistryOptions

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:24](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/registries/LayerRegistry.ts#L24)

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:32](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/registries/LayerRegistry.ts#L32)

Bus for `layer:added` / `layer:removed` events.

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:30](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/registries/LayerRegistry.ts#L30)

Resolves the `CanvasContext` at the moment of mount. The Canvas creates
its registries before the context object exists, so this thunk lets the
registry defer the context lookup.

#### Returns

[`CanvasContext`](CanvasContext.md)
