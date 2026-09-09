# Interface: EdgeLODBehaviourOptions

Constructor options for [EdgeLODBehaviour](../classes/EdgeLODBehaviour.md).

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

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

### keepBy?

> `optional` **keepBy?**: [`EdgeLODKeepBy`](../type-aliases/EdgeLODKeepBy.md)

Which edges to keep: `'sample'` (a stable pseudo-random subset — preserves
the overall density texture; default), `'weight'` (highest [weightKey](#weightkey)),
or `'degree'` (between the highest-degree endpoints — the structural backbone).

***

### keepFraction?

> `optional` **keepFraction?**: `number`

Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`.

***

### minZoom?

> `optional` **minZoom?**: `number`

Thin edges when `camera.scale` is below this. Default `0.5`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### weightKey?

> `optional` **weightKey?**: `string`

Numeric edge-`data` field used when `keepBy: 'weight'`.
