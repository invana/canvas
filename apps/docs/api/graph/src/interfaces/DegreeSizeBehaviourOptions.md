# Interface: DegreeSizeBehaviourOptions

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L60)

Constructor options for `DegreeSizeBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### direction?

> `optional` **direction?**: [`EdgeDirection`](../type-aliases/EdgeDirection.md)

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L71)

Edges to count when computing each node's degree.

- `'in'`   — only edges where the node is the target.
- `'out'`  — only edges where the node is the source.
- `'both'` — sum of in + out. Default.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### maxSize?

> `optional` **maxSize?**: `number`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L80)

Output `style.size` for the node with the maximum observed degree.
Default `32`. Anything smaller than `minSize` is allowed but pointless.

***

### minSize?

> `optional` **minSize?**: `number`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L74)

Output `style.size` for a node with degree === 0. Default `8`.

***

### scale?

> `optional` **scale?**: [`DegreeSizeScale`](../type-aliases/DegreeSizeScale.md)

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L92)

Curve mapping normalized degree (0..1) to a size between `minSize` and
`maxSize`. Default `'sqrt'`.

- `'linear'` — size = min + (max - min) * (degree / maxDegree)
- `'sqrt'`   — size = min + (max - min) * sqrt(degree / maxDegree)
               dampens the long tail typical of real graphs
- `'log'`    — size = min + (max - min) * log1p(degree) / log1p(maxDegree)
               aggressive dampening; better for power-law graphs

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

### sizeFn?

> `optional` **sizeFn?**: (`degree`, `maxDegree`) => `number`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L99)

Optional override. When provided, supersedes `minSize` / `maxSize` /
`scale` and is called per-node with that node's degree plus the max
degree across the layer. Returns the literal `style.size` to write.

#### Parameters

##### degree

`number`

##### maxDegree

`number`

#### Returns

`number`

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/DegreeSizeBehaviour.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DegreeSizeBehaviour.ts#L62)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`
