# Interface: LassoSelectBehaviourOptions

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:46](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L46)

Constructor options for `LassoSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L56)

***

### clickSelectId?

> `optional` **clickSelectId?**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:48](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L48)

***

### enable?

> `optional` **enable?**: `boolean` \| ((`event`) => `boolean`)

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:50](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L50)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### enableElements?

> `optional` **enableElements?**: [`HoverableElementType`](../type-aliases/HoverableElementType.md)[]

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:51](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L51)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### immediately?

> `optional` **immediately?**: `boolean`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:53](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L53)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:47](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L47)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### onSelect?

> `optional` **onSelect?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:57](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L57)

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

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

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:54](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L54)

***

### style?

> `optional` **style?**: [`LassoSelectStyle`](LassoSelectStyle.md)

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L55)

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L52)
