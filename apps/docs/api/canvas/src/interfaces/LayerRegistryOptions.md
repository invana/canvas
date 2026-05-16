# Interface: LayerRegistryOptions

Defined in: [canvas/src/registries/LayerRegistry.ts:24](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/LayerRegistry.ts#L24)

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [canvas/src/registries/LayerRegistry.ts:32](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/LayerRegistry.ts#L32)

Bus for `layer:added` / `layer:removed` events.

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

Defined in: [canvas/src/registries/LayerRegistry.ts:30](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/registries/LayerRegistry.ts#L30)

Resolves the `CanvasContext` at the moment of mount. The Canvas creates
its registries before the context object exists, so this thunk lets the
registry defer the context lookup.

#### Returns

[`CanvasContext`](CanvasContext.md)
