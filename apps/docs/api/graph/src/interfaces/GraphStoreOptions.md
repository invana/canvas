# Interface: GraphStoreOptions

Constructor options for `GraphStore`.

Defaults are tuned for sync, single-process, batch-driven use. Streaming
feeds should set `flushMode: 'frame'` and `unknownEndpoint: 'buffer'`.

## Properties

### flushMode?

> `optional` **flushMode?**: `"frame"` \| `"sync"`

`'sync'` — events fire synchronously at each mutation / on `batch` exit.
`'frame'` — events coalesce into a single flush per animation frame.
Default `'sync'`.

***

### id?

> `optional` **id?**: `string`

Identity for the store's event-source envelopes on the canvas tap channel
(telemetry). Becomes `source.id` on every `{ kind: 'store' }` event the bus
publishes. Default `'graph-store'`; pass the owning layer's id to
disambiguate multiple graphs. See `store-owns-state-plan.md` § 6.

***

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Initial slot capacity for the underlying `ColumnStore`s. Larger up-front
capacity avoids early geometric growth on bulk inserts. Default 256.

***

### pendingEdgeTTL?

> `optional` **pendingEdgeTTL?**: `number`

Drop a buffered edge (and emit `edge:orphaned`) if it has been pending
for more than this many frames. Default `Infinity` (never expire).
Only meaningful with `unknownEndpoint: 'buffer'`.

***

### unknownEndpoint?

> `optional` **unknownEndpoint?**: `"throw"` \| `"buffer"` \| `"drop"`

What to do when `addEdge` is called with an unknown source or target id.
- `'throw'` (default) — reject and throw.
- `'buffer'` — park in the pending-edge buffer; admit when the endpoint arrives.
- `'drop'` — silently discard.
