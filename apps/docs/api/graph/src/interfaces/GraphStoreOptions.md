# Interface: GraphStoreOptions

Defined in: [graph/src/store/types.ts:84](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/types.ts#L84)

Constructor options for `GraphStore`.

Defaults are tuned for sync, single-process, batch-driven use. Streaming
feeds should set `flushMode: 'frame'` and `unknownEndpoint: 'buffer'`.

## Properties

### flushMode?

> `optional` **flushMode?**: `"sync"` \| `"frame"`

Defined in: [graph/src/store/types.ts:90](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/types.ts#L90)

`'sync'` — events fire synchronously at each mutation / on `batch` exit.
`'frame'` — events coalesce into a single flush per animation frame.
Default `'sync'`.

***

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [graph/src/store/types.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/types.ts#L111)

Initial slot capacity for the underlying `ColumnStore`s. Larger up-front
capacity avoids early geometric growth on bulk inserts. Default 256.

***

### pendingEdgeTTL?

> `optional` **pendingEdgeTTL?**: `number`

Defined in: [graph/src/store/types.ts:105](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/types.ts#L105)

Drop a buffered edge (and emit `edge:orphaned`) if it has been pending
for more than this many frames. Default `Infinity` (never expire).
Only meaningful with `unknownEndpoint: 'buffer'`.

***

### unknownEndpoint?

> `optional` **unknownEndpoint?**: `"throw"` \| `"buffer"` \| `"drop"`

Defined in: [graph/src/store/types.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/types.ts#L98)

What to do when `addEdge` is called with an unknown source or target id.
- `'throw'` (default) — reject and throw.
- `'buffer'` — park in the pending-edge buffer; admit when the endpoint arrives.
- `'drop'` — silently discard.
