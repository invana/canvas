# Interface: ParallelEdgeBehaviourOptions

Constructor options for [ParallelEdgeBehaviour](../classes/ParallelEdgeBehaviour.md).

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### anchorOffset?

> `optional` **anchorOffset?**: `boolean`

When `true` and an edge uses a port anchor (`'edge-port'` or
`'silhouette-port'`), the default policy writes
`sourceAnchorOpts: { side: 'auto', offset }` and the matching target
opts so endpoints fan along the host face. When `false`, the policy
only writes waypoints. Default `true`.

***

### basis?

> `optional` **basis?**: [`ParallelEdgeBasis`](../type-aliases/ParallelEdgeBasis.md)

Basis the default distribution policy uses to translate a rank into a
waypoint / anchor-offset direction. Default `'auto'`.

***

### distribute?

> `optional` **distribute?**: [`ParallelEdgeDistribute`](../type-aliases/ParallelEdgeDistribute.md)

Distribution policy. Default [centeredRanksPolicy](../variables/centeredRanksPolicy.md).

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### groupBy?

> `optional` **groupBy?**: (`edge`) => `string`

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

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### spacing?

> `optional` **spacing?**: `number`

Spacing between adjacent ranks in world units. Default `12`.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
