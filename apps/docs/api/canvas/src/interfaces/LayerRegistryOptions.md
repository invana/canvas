# Interface: LayerRegistryOptions

`LayerRegistry` — stores the Layers added to a Canvas.

Architecture: see `architecture-proposal.md` §2.4 (CanvasContext.layers).

**Responsibilities**
  - Add / remove (with mount / unmount lifecycle).
  - Typed `get<T>(id)`.
  - `byZOrder()` iteration — used by the Canvas tick.
  - Fires `'scene:layer:add'` / `'scene:layer:remove'` on the bus.

**Lifecycle wiring**

The registry doesn't itself construct the `CanvasContext` — it would be
circular (the registry is a field of the context). Instead the Canvas
passes a `getContext()` thunk; `add(layer)` resolves it at the moment of
mount. This keeps the registry decoupled from the context's full shape.

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
