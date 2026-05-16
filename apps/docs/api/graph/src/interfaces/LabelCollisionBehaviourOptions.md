# Interface: LabelCollisionBehaviourOptions

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:51](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L51)

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### flickerGuardMs?

> `optional` **flickerGuardMs?**: `number`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:66](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L66)

Hysteresis: a just-hidden label stays hidden for at least this many ms
before it can re-appear, and vice versa. Stops flicker when zoom is
right at an overlap boundary. Default `100`.

***

### groups?

> `optional` **groups?**: `object`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:73](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L73)

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

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:53](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L53)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### prioritise?

> `optional` **prioritise?**: [`LabelPriorityResolver`](../type-aliases/LabelPriorityResolver.md)

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:59](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L59)

Default `'priority-field'`. Falls back to node-degree when undefined.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### strategy?

> `optional` **strategy?**: `"hide"`

Defined in: [graph/src/behaviours/LabelCollisionBehaviour.ts:56](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L56)

Default `'hide'`.
