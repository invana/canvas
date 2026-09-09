# Interface: BrushSelectBehaviourOptions

Constructor options for `BrushSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Clear selection when the user clicks on the empty background (no drag).
Default `true`.

***

### clickSelectId?

> `optional` **clickSelectId?**: `string`

Optional `ClickSelectBehaviour` id to delegate to. Default `'click-select'`.
If found, the brush hands the merged selection to the click-select layer
so both stay in sync. Otherwise the brush mutates `GraphLayer` state
directly.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`event`) => `boolean`)

Per-drag enable predicate. `boolean` global on/off; or a function
called with the pointerdown native event. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### enableElements?

> `optional` **enableElements?**: [`HoverableElementType`](../type-aliases/HoverableElementType.md)[]

Element types eligible for brush selection. Default `['shape', 'connector']`.

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### immediately?

> `optional` **immediately?**: `boolean`

Live-update the selection as the rect grows. `false` = apply only on
release. Default `false`.

***

### onSelect?

> `optional` **onSelect?**: (`snapshot`) => `void`

Fired once on release if the brush produced a selection change.

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

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

Visual state name applied to brushed elements when no `ClickSelectBehaviour`
is targeted. Ignored on the delegate path. Default `'selected'`.

***

### style?

> `optional` **style?**: [`BrushSelectStyle`](BrushSelectStyle.md)

Rectangle style.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour brushes over.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Modifier key(s) that must be held during pointerdown to activate the
brush. Empty array = any left-drag activates. Default `['shift']`.
