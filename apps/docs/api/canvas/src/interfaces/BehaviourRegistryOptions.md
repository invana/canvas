# Interface: BehaviourRegistryOptions

`BehaviourRegistry` — stores Behaviours and toggles their enabled state.

Architecture: see `architecture-proposal.md` §2.2.

**Responsibilities**
  - `register` / `unregister` (with register / destroy lifecycle).
  - `setEnabled(id, enabled)` — toggles + fires `'scene:behaviour:enable'` /
    `'scene:behaviour:disable'`.
  - Typed `get<T>(id)`.
  - **Gesture-conflict warning**: when two enabled behaviours claim the same
    `shortcut`, log a `console.warn`. Doesn't enforce — the developer
    decides whether two behaviours can coexist on the same gesture.

## Properties

### bus

> **bus**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

***

### getContext

> **getContext**: () => [`CanvasContext`](CanvasContext.md)

#### Returns

[`CanvasContext`](CanvasContext.md)
