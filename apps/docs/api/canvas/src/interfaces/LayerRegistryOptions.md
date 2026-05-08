# Interface: LayerRegistryOptions

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:24](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/registries/LayerRegistry.ts#L24)

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:32](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/registries/LayerRegistry.ts#L32)

Bus for `layer:added` / `layer:removed` events.

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

Defined in: [packages/canvas/src/registries/LayerRegistry.ts:30](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/registries/LayerRegistry.ts#L30)

Resolves the `CanvasContext` at the moment of mount. The Canvas creates
its registries before the context object exists, so this thunk lets the
registry defer the context lookup.

#### Returns

[`CanvasContext`](CanvasContext.md)
