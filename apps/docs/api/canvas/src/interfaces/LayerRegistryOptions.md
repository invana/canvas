# Interface: LayerRegistryOptions

Defined in: [canvas/src/registries/LayerRegistry.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L24)

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [canvas/src/registries/LayerRegistry.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L32)

Bus for `layer:added` / `layer:removed` events.

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

Defined in: [canvas/src/registries/LayerRegistry.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/registries/LayerRegistry.ts#L30)

Resolves the `CanvasContext` at the moment of mount, or `undefined` before
the Canvas is initialised. Layers added pre-init are stored and mounted
later by `mountAll()`.

#### Returns

[`CanvasContext`](CanvasContext.md)
