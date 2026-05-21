# Interface: ParallelEdgeBehaviourOptions

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:125](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L125)

Constructor options for [ParallelEdgeBehaviour](../classes/ParallelEdgeBehaviour.md).

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### anchorOffset?

> `optional` **anchorOffset?**: `boolean`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:145](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L145)

When `true` and an edge uses a port anchor (`'edge-port'` or
`'silhouette-port'`), the default policy writes
`sourceAnchorOpts: { side: 'auto', offset }` and the matching target
opts so endpoints fan along the host face. When `false`, the policy
only writes waypoints. Default `true`.

***

### basis?

> `optional` **basis?**: [`ParallelEdgeBasis`](../type-aliases/ParallelEdgeBasis.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:136](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L136)

Basis the default distribution policy uses to translate a rank into a
waypoint / anchor-offset direction. Default `'auto'`.

***

### distribute?

> `optional` **distribute?**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:157](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L157)

Distribution policy. Default [centeredRanksPolicy](../variables/centeredRanksPolicy.md).

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### groupBy?

> `optional` **groupBy?**: (`edge`) => `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:152](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L152)

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

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:127](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L127)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### spacing?

> `optional` **spacing?**: `number`

Defined in: [graph/src/behaviours/ParallelEdgeBehaviour.ts:130](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ParallelEdgeBehaviour.ts#L130)

Spacing between adjacent ranks in world units. Default `12`.
