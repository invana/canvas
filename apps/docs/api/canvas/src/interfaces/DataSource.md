# Interface: DataSource

`DataSource` — the kernel's contract for a **bulk data store** owned by
`CanvasStore.data[id]` (decision **D13**: *interface, not inheritance* — see
`docs/canvas-store-d13-data-ownership.md`).

The kernel owns sources behind this interface **without knowing their domain**:
- the default [LayerData](../../../canvas-store/src/classes/LayerData.md) satisfies it out of the box, and
- a domain store (e.g. `@invana/graph`'s `GraphStore`) *implements* it and is
  registered via `CanvasStore.setSource(id, source)`.

Only the three members the kernel needs to **own + bridge** a source live here;
everything domain-specific (positions fast-path, adjacency, hierarchy, presence)
stays off the interface. `CanvasStore` subscribes each source's [onFlush](#onflush)
and re-emits it as a coarse `data:flush` on the bus (telemetry / collab); the
domain renderer subscribes to the source directly for targeted updates.

## Methods

### flush()

> **flush**(): `void`

Drain pending changes now (the engine's single rAF loop calls this once/frame).

#### Returns

`void`

***

### onFlush()

> **onFlush**(`listener`): () => `void`

Subscribe to the coalesced per-frame change delta. Returns an unsubscribe.

#### Parameters

##### listener

(`delta`) => `void`

#### Returns

() => `void`

***

### setFlushMode()

> **setFlushMode**(`mode`): `void`

Choose **when** the coalesced flush fires; the engine drives `'manual'`.

#### Parameters

##### mode

[`FlushMode`](../type-aliases/FlushMode.md)

#### Returns

`void`
