# Interface: GraphLayerOptions

Defined in: [graph/src/layer/types.ts:1265](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1265)

Constructor options for `GraphLayer`.

## Properties

### edge?

> `optional` **edge?**: [`EdgeOption`](EdgeOption.md)

Defined in: [graph/src/layer/types.ts:1283](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1283)

Sibling of [node](#node) for edges.

***

### hitFloorPx?

> `optional` **hitFloorPx?**: `number`

Defined in: [graph/src/layer/types.ts:1304](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1304)

Minimum hover/click target in screen pixels, forwarded to the
internal `PrimitivesRenderer`. Default `6`.

Behaves as a *fallback*: exact geometric hits always win; only
when no shape contains the cursor does the dispatcher pick the
closest candidate within `hitFloorPx` screen pixels. See
`PrimitivesRendererOptions.hitFloorPx` for details.

***

### node?

> `optional` **node?**: [`NodeOption`](NodeOption.md)

Defined in: [graph/src/layer/types.ts:1280](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1280)

Layer-level node template (G6's `node` field). Carries `style` (base
appearance) and `state` (catalogue of named overlays applied while a
state in `node.states[]` is active). Resolver-aware: every field on
`style` / each `state[name]` may be a static value or a function
`(node: GraphNode) => value` that fires every render.

***

### store?

> `optional` **store?**: [`GraphStore`](../classes/GraphStore.md)

Defined in: [graph/src/layer/types.ts:1271](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1271)

Optional pre-built store. If omitted, the layer creates its own with
default options (`flushMode: 'sync'`, `unknownEndpoint: 'throw'`). Pass
a store you own to share data with other layers / sync code.

***

### useDefaultStates?

> `optional` **useDefaultStates?**: `boolean`

Defined in: [graph/src/layer/types.ts:1293](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1293)

Auto-merge [DEFAULT\_NODE\_STATES](../variables/DEFAULT_NODE_STATES.md) / [DEFAULT\_EDGE\_STATES](../variables/DEFAULT_EDGE_STATES.md)
into `options.node.state` / `options.edge.state` on construction so
every canonical state has a sensible default appearance even when the
consumer supplied no state overlays. Consumer entries win on a
per-name basis (no per-field deep merge here — declare a full
`NodeStyle` if you want to replace a default entry). Default `true`.
