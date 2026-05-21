# Interface: LabelCollisionBehaviourOptions

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:78](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L78)

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### flickerGuardMs?

> `optional` **flickerGuardMs?**: `number`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:93](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L93)

Hysteresis: a just-hidden label stays hidden for at least this many ms
before it can re-appear, and vice versa. Stops flicker when zoom is
right at an overlap boundary. Default `100`.

***

### groups?

> `optional` **groups?**: `object`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L100)

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

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:80](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L80)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### prioritise?

> `optional` **prioritise?**: [`LabelPriorityResolver`](../type-aliases/LabelPriorityResolver.md)

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:86](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L86)

Default `'priority-field'`. Falls back to node-degree when undefined.

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

### strategy?

> `optional` **strategy?**: `"hide"`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L83)

Default `'hide'`.
