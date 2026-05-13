# Interface: GraphLayerOptions

Defined in: packages/graph/src/layer/types.ts:59

Constructor options for `GraphLayer`.

## Properties

### edgeDefaults?

> `optional` **edgeDefaults?**: [`EdgeRenderHints`](EdgeRenderHints.md)

Defined in: packages/graph/src/layer/types.ts:74

Default edge render hints.

***

### nodeDefaults?

> `optional` **nodeDefaults?**: [`NodeRenderHints`](NodeRenderHints.md)

Defined in: packages/graph/src/layer/types.ts:71

Default node render hints applied when a node has no per-node override
under `node.data`. Defaults shown in [NodeRenderHints](NodeRenderHints.md).

***

### store?

> `optional` **store?**: [`GraphStore`](../classes/GraphStore.md)

Defined in: packages/graph/src/layer/types.ts:65

Optional pre-built store. If omitted, the layer creates its own with
default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
a store you own to share data with other layers / sync code.
