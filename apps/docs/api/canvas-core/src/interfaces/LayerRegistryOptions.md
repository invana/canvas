# Interface: LayerRegistryOptions

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Bus for `layer:added` / `layer:removed` events.

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

Resolves the `CanvasContext` at the moment of mount, or `undefined` before
the Canvas is initialised. Layers added pre-init are stored and mounted
later by `mountAll()`.

#### Returns

[`CanvasContext`](CanvasContext.md)
