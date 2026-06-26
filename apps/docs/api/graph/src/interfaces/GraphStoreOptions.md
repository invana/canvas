# Interface: GraphStoreOptions

Defined in: [graph/src/store/types.ts:90](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L90)

Constructor options for `GraphStore`.

Defaults are tuned for sync, single-process, batch-driven use. Streaming
feeds should set `flushMode: 'frame'` and `unknownEndpoint: 'buffer'`.

## Properties

### flushMode?

> `optional` **flushMode?**: `"sync"` \| `"frame"`

Defined in: [graph/src/store/types.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L96)

`'sync'` — events fire synchronously at each mutation / on `batch` exit.
`'frame'` — events coalesce into a single flush per animation frame.
Default `'sync'`.

***

### id?

> `optional` **id?**: `string`

Defined in: [graph/src/store/types.ts:125](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L125)

Identity for the store's event-source envelopes on the canvas tap channel
(telemetry). Becomes `source.id` on every `{ kind: 'store' }` event the bus
publishes. Default `'graph-store'`; pass the owning layer's id to
disambiguate multiple graphs. See `store-owns-state-plan.md` § 6.

***

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [graph/src/store/types.ts:117](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L117)

Initial slot capacity for the underlying `ColumnStore`s. Larger up-front
capacity avoids early geometric growth on bulk inserts. Default 256.

***

### pendingEdgeTTL?

> `optional` **pendingEdgeTTL?**: `number`

Defined in: [graph/src/store/types.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L111)

Drop a buffered edge (and emit `edge:orphaned`) if it has been pending
for more than this many frames. Default `Infinity` (never expire).
Only meaningful with `unknownEndpoint: 'buffer'`.

***

### unknownEndpoint?

> `optional` **unknownEndpoint?**: `"throw"` \| `"buffer"` \| `"drop"`

Defined in: [graph/src/store/types.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L104)

What to do when `addEdge` is called with an unknown source or target id.
- `'throw'` (default) — reject and throw.
- `'buffer'` — park in the pending-edge buffer; admit when the endpoint arrives.
- `'drop'` — silently discard.
