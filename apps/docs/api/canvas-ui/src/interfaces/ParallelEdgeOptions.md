# Interface: ParallelEdgeOptions

The subset of `ParallelEdgeBehaviourOptions` this editor produces — a
serialisable patch. The `groupBy` / `distribute` callbacks and the base
`id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope;
only the user-tunable scalars round-trip.

## Properties

### anchorOffset?

> `optional` **anchorOffset?**: `boolean`

When `true`, port-anchored edges also fan their endpoints along the host
face; when `false`, only waypoints are written. Default `true`.

***

### basis?

> `optional` **basis?**: `ParallelEdgeBasis`

Basis used to translate a rank into a fan direction. Default `'auto'`.

***

### spacing?

> `optional` **spacing?**: `number`

Spacing between adjacent ranks in world units. Default `12`.
