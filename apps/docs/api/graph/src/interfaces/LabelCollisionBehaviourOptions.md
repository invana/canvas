# Interface: LabelCollisionBehaviourOptions

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### flickerGuardMs?

> `optional` **flickerGuardMs?**: `number`

Hysteresis: a just-hidden label stays hidden for at least this many ms
before it can re-appear, and vice versa. Stops flicker when zoom is
right at an overlap boundary. Default `100`.

***

### groups?

> `optional` **groups?**: `object`

Default `'nodes'` for node labels, `'edges'` for edge labels. Set to a
custom mapping if you want different partitioning (e.g. all in one
group so edges can win priority against nodes).

#### edges?

> `optional` **edges?**: `string`

#### nodes?

> `optional` **nodes?**: `string`

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### prioritise?

> `optional` **prioritise?**: [`LabelPriorityResolver`](../type-aliases/LabelPriorityResolver.md)

Default `'priority-field'`. Falls back to node-degree when undefined.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### strategy?

> `optional` **strategy?**: `"hide"`

Default `'hide'`.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
