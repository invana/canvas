# Interface: ClickSelectBehaviourOptions

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:60](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L60)

Constructor options for `ClickSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:99](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L99)

Clear selection when clicking the empty canvas background. Default `true`.

***

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:84](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L84)

N-hop neighbour radius around each seed. `0` = clicked element only.
Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:87](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L87)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:68](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L68)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per click and may veto. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:62](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L62)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### multiple?

> `optional` **multiple?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:71](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L71)

Allow more than one element selected at a time. Default `false`.

***

### onDeselect?

> `optional` **onDeselect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:104](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L104)

Fired when an element becomes deselected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelect?

> `optional` **onSelect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:102](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L102)

Fired when an element becomes selected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:106](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L106)

Fired once per click with the post-settle selection snapshot.

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:90](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L90)

Active-state name. Default `'selected'`.

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:78](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L78)

Modifier key(s) that activate multi-select mode when held. Consulted
only when `multiple` is `true`. Empty array = every click extends.
Default `['shift']`.

***

### unselectedState?

> `optional` **unselectedState?**: `string`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:96](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L96)

State applied to every element that is *not* selected. `undefined`
disables dimming. Default `undefined`.
