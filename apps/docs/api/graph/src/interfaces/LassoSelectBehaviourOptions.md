# Interface: LassoSelectBehaviourOptions

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L46)

Constructor options for `LassoSelectBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L56)

***

### clickSelectId?

> `optional` **clickSelectId?**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L48)

***

### enable?

> `optional` **enable?**: `boolean` \| ((`event`) => `boolean`)

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L50)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### enableElements?

> `optional` **enableElements?**: [`HoverableElementType`](../type-aliases/HoverableElementType.md)[]

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L51)

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### immediately?

> `optional` **immediately?**: `boolean`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L53)

***

### onSelect?

> `optional` **onSelect?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L57)

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

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

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L54)

***

### style?

> `optional` **style?**: [`LassoSelectStyle`](LassoSelectStyle.md)

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L55)

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L47)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Overrides

`BehaviourOptions.targetLayerId`

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/LassoSelectBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/LassoSelectBehaviour.ts#L52)
