# Interface: ClickSelectBehaviourOptions

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:61](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L61)

Constructor options for `ClickSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L100)

Clear selection when clicking the empty canvas background. Default `true`.

***

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L85)

N-hop neighbour radius around each seed. `0` = clicked element only.
Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:88](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L88)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L69)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per click and may veto. Default `true`.

***

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

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:63](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L63)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### multiple?

> `optional` **multiple?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:72](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L72)

Allow more than one element selected at a time. Default `false`.

***

### onDeselect?

> `optional` **onDeselect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:105](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L105)

Fired when an element becomes deselected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelect?

> `optional` **onSelect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:103](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L103)

Fired when an element becomes selected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:107](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L107)

Fired once per click with the post-settle selection snapshot.

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

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L91)

Active-state name. Default `'selected'`.

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L79)

Modifier key(s) that activate multi-select mode when held. Consulted
only when `multiple` is `true`. Empty array = every click extends.
Default `['shift']`.

***

### unselectedState?

> `optional` **unselectedState?**: `string`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:97](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L97)

State applied to every element that is *not* selected. `undefined`
disables dimming. Default `undefined`.
