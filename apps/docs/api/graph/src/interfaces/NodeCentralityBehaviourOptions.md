# Interface: NodeCentralityBehaviourOptions

Constructor options for `NodeCentralityBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### direction?

> `optional` **direction?**: [`EdgeDirection`](../type-aliases/EdgeDirection.md)

Edges to count when computing each node's degree.

- `'in'`   — only edges where the node is the target.
- `'out'`  — only edges where the node is the source.
- `'both'` — sum of in + out. Default.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### labelMaxSize?

> `optional` **labelMaxSize?**: `number`

Upper clamp for the scaled label font. Default `40`.

***

### labelMinSize?

> `optional` **labelMinSize?**: `number`

Lower clamp for the scaled label font. Default `8`.

***

### labelScale?

> `optional` **labelScale?**: `number`

Also scale the **label** with the node: when set (`> 0`), each node's
`labelFontSize` is written as `clamp(size × labelScale, labelMinSize,
labelMaxSize)`, so a bigger (more central) node gets a bigger label. Omit
or `0` to leave labels untouched. Simple-node labels only — composite
internal text is template-owned.

***

### maxSize?

> `optional` **maxSize?**: `number`

Output `style.size` for the node with the maximum observed degree.
Default `32`. Anything smaller than `minSize` is allowed but pointless.

***

### minSize?

> `optional` **minSize?**: `number`

Output `style.size` for a node with degree === 0. Default `8`.

***

### scale?

> `optional` **scale?**: [`NodeCentralityScale`](../type-aliases/NodeCentralityScale.md)

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

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### sizeFn?

> `optional` **sizeFn?**: (`degree`, `maxDegree`) => `number`

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

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### weightBy?

> `optional` **weightBy?**: (`edge`) => `number`

**Weighted degree — code escape hatch.** Per-edge weight accessor; when
provided the node's "degree" is the SUM of `weightBy(edge)` over its
incident edges (respecting [direction](#direction)). Supersedes [weightKey](#weightkey).
Not editor-exposed (function). Omit for a raw edge count.

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`number`

***

### weightKey?

> `optional` **weightKey?**: `string`

**Weighted degree.** Numeric field name in each edge's `data` to sum
instead of counting edges — e.g. `'weight'`, `'sharedScenes'`. A node's
"degree" becomes the SUM of that field over its incident edges (respecting
[direction](#direction)); a non-numeric / missing value counts as `0`. Omit for a
raw edge count (default). [weightBy](#weightby) takes precedence when both are set.
