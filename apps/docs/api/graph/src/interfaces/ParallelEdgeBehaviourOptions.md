# Interface: ParallelEdgeBehaviourOptions

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:125](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L125)

Constructor options for [ParallelEdgeBehaviour](../classes/ParallelEdgeBehaviour.md).

## Extends

- `BehaviourOptions`

## Properties

### anchorOffset?

> `optional` **anchorOffset?**: `boolean`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:145](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L145)

When `true` and an edge uses a port anchor (`'edge-port'` or
`'silhouette-port'`), the default policy writes
`sourceAnchorOpts: { side: 'auto', offset }` and the matching target
opts so endpoints fan along the host face. When `false`, the policy
only writes waypoints. Default `true`.

***

### basis?

> `optional` **basis?**: [`ParallelEdgeBasis`](../type-aliases/ParallelEdgeBasis.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:136](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L136)

Basis the default distribution policy uses to translate a rank into a
waypoint / anchor-offset direction. Default `'auto'`.

***

### distribute?

> `optional` **distribute?**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:157](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L157)

Distribution policy. Default [centeredRanksPolicy](../variables/centeredRanksPolicy.md).

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### groupBy?

> `optional` **groupBy?**: (`edge`) => `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:152](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L152)

Group key for an edge. Edges that produce the same key are bundled and
distributed together. Return `null` to exclude an edge. Default groups
by directed pair `${source}::${target}`.

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`string`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### spacing?

> `optional` **spacing?**: `number`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:130](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L130)

Spacing between adjacent ranks in world units. Default `12`.

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:127](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L127)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`
