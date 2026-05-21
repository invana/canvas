# Interface: CollapseExpandBehaviourOptions

Defined in: [graph/src/behaviours/CollapseExpandBehaviour.ts:61](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L61)

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

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/CollapseExpandBehaviour.ts:63](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L63)

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
