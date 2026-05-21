# Interface: BrushSelectBehaviourOptions

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:67](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L67)

Constructor options for `BrushSelectBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:114](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L114)

Clear selection when the user clicks on the empty background (no drag).
Default `true`.

***

### clickSelectId?

> `optional` **clickSelectId?**: `string`

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:76](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L76)

Optional `ClickSelectBehaviour` id to delegate to. Default `'click-select'`.
If found, the brush hands the merged selection to the click-select layer
so both stay in sync. Otherwise the brush mutates `GraphLayer` state
directly.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`event`) => `boolean`)

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L82)

Per-drag enable predicate. `boolean` global on/off; or a function
called with the pointerdown native event. Default `true`.

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

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:87](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L87)

Element types eligible for brush selection. Default `['shape', 'connector']`.

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### immediately?

> `optional` **immediately?**: `boolean`

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:99](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L99)

Live-update the selection as the rect grows. `false` = apply only on
release. Default `false`.

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L69)

Required — the `GraphLayer` id this behaviour brushes over.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### onSelect?

> `optional` **onSelect?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:117](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L117)

Fired once on release if the brush produced a selection change.

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

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:105](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L105)

Visual state name applied to brushed elements when no `ClickSelectBehaviour`
is targeted. Ignored on the delegate path. Default `'selected'`.

***

### style?

> `optional` **style?**: [`BrushSelectStyle`](BrushSelectStyle.md)

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L108)

Rectangle style.

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/BrushSelectBehaviour.ts:93](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/BrushSelectBehaviour.ts#L93)

Modifier key(s) that must be held during pointerdown to activate the
brush. Empty array = any left-drag activates. Default `['shift']`.
