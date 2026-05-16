# Interface: GraphLayerOptions

Defined in: [graph/src/layer/types.ts:791](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L791)

Constructor options for `GraphLayer`.

## Properties

### edge?

> `optional` **edge?**: [`EdgeOption`](EdgeOption.md)

Defined in: [graph/src/layer/types.ts:840](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L840)

Sibling of [node](#node) for edges.

***

### edgeDefaults?

> `optional` **edgeDefaults?**: [`ResolvableEdgeRenderHints`](../type-aliases/ResolvableEdgeRenderHints.md)

Defined in: [graph/src/layer/types.ts:807](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L807)

**LEGACY** — see [nodeDefaults](#nodedefaults).

***

### edgeStateConfigs?

> `optional` **edgeStateConfigs?**: `Readonly`\<`Record`\<`string`, [`EdgeStateConfig`](../type-aliases/EdgeStateConfig.md)\>\>

Defined in: [graph/src/layer/types.ts:825](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L825)

Sibling of [nodeStateConfigs](#nodestateconfigs) for edges.

***

### node?

> `optional` **node?**: [`NodeOption`](NodeOption.md)

Defined in: [graph/src/layer/types.ts:837](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L837)

Layer-level node template (G6's `node` field). Fields support resolver
functions `(node: GraphNode) => value` that fire every render.

Stacking order with legacy `nodeDefaults`: legacy applies first, then
`node.style` overrides for any field the consumer supplied. State
overlays in `node.state[name]` apply after the base style.

***

### nodeDefaults?

> `optional` **nodeDefaults?**: [`ResolvableNodeRenderHints`](../type-aliases/ResolvableNodeRenderHints.md)

Defined in: [graph/src/layer/types.ts:804](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L804)

**LEGACY** default node render hints (`node.data` fallback path). Every
field may be a static value or a resolver `(node) => value`. Use
[node](#node) instead for new code.

***

### nodeStateConfigs?

> `optional` **nodeStateConfigs?**: `Readonly`\<`Record`\<`string`, [`NodeStateConfig`](../type-aliases/NodeStateConfig.md)\>\>

Defined in: [graph/src/layer/types.ts:822](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L822)

Override individual canonical state configs and / or register new ones
declaratively at construction.

**LEGACY** — v3 uses `node.state` (catalogue on [NodeOption](NodeOption.md)).

***

### store?

> `optional` **store?**: [`GraphStore`](../classes/GraphStore.md)

Defined in: [graph/src/layer/types.ts:797](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L797)

Optional pre-built store. If omitted, the layer creates its own with
default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
a store you own to share data with other layers / sync code.

***

### useDefaultStateConfigs?

> `optional` **useDefaultStateConfigs?**: `boolean`

Defined in: [graph/src/layer/types.ts:814](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L814)

Auto-register the canonical state configs
([DEFAULT\_NODE\_STATE\_CONFIGS](../variables/DEFAULT_NODE_STATE_CONFIGS.md), [DEFAULT\_EDGE\_STATE\_CONFIGS](../variables/DEFAULT_EDGE_STATE_CONFIGS.md))
on construction. Default `true`.
