# Interface: ClickSelectBehaviourOptions

Constructor options for `ClickSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Clear selection when clicking the empty canvas background. Default `true`.

***

### degree?

> `optional` **degree?**: `number`

N-hop neighbour radius around each seed. `0` = clicked element only.
Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per click and may veto. Default `true`.

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

### multiple?

> `optional` **multiple?**: `boolean`

Allow more than one element selected at a time. When `true`, a qualifying
click (see `trigger`) toggles the element in/out of the selection; when
`false` it replaces the selection with the clicked element. Default `false`.

***

### onDeselect?

> `optional` **onDeselect?**: (`element`) => `void`

Fired when an element becomes deselected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelect?

> `optional` **onSelect?**: (`element`) => `void`

Fired when an element becomes selected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`snapshot`) => `void`

Fired once per click with the post-settle selection snapshot.

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

***

### raiseActive?

> `optional` **raiseActive?**: `boolean`

Lift the selected set (seeds + degree-expanded neighbours) above the rest
within its render layer, so unrelated nodes / edges don't paint over the
selection. Edges raise above other edges (still below all nodes); nodes
raise above other nodes. Reset when the selection clears. Visual-only —
restacking doesn't affect hit-testing. Default `true`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### state?

> `optional` **state?**: `string`

Active-state name. Default `'selected'`.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Modifier key(s) required for a click to affect the selection **at all**.
When non-empty, a click that holds none of these is ignored — a plain
(unmodified) click selects nothing, and a plain left-drag stays a pure
pan. With a modifier held, the click selects (replacing the selection, or
toggling membership when `multiple` is `true`). Empty array = every click
selects, no modifier needed. Default `[]` (plain click selects). Pass
`['shift']` to gate selection behind the Shift key.

***

### unselectedState?

> `optional` **unselectedState?**: `string`

State applied to every element that is *not* selected. `undefined`
disables dimming. Default `undefined`.
