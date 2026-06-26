# Interface: ClickSelectBehaviourOptions

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L71)

Constructor options for `ClickSelectBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:127](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L127)

Clear selection when clicking the empty canvas background. Default `true`.

***

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:103](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L103)

N-hop neighbour radius around each seed. `0` = clicked element only.
Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:106](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L106)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L79)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per click and may veto. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### multiple?

> `optional` **multiple?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L86)

Allow more than one element selected at a time. When `true`, a qualifying
click (see `trigger`) toggles the element in/out of the selection; when
`false` it replaces the selection with the clicked element. Default `false`.

***

### onDeselect?

> `optional` **onDeselect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L132)

Fired when an element becomes deselected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelect?

> `optional` **onSelect?**: (`element`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:130](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L130)

Fired when an element becomes selected.

#### Parameters

##### element

[`SelectableElement`](SelectableElement.md)

#### Returns

`void`

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`snapshot`) => `void`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:134](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L134)

Fired once per click with the post-settle selection snapshot.

#### Parameters

##### snapshot

[`SelectionSnapshot`](SelectionSnapshot.md)

#### Returns

`void`

***

### raiseActive?

> `optional` **raiseActive?**: `boolean`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:124](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L124)

Lift the selected set (seeds + degree-expanded neighbours) above the rest
within its render layer, so unrelated nodes / edges don't paint over the
selection. Edges raise above other edges (still below all nodes); nodes
raise above other nodes. Reset when the selection clears. Visual-only —
restacking doesn't affect hit-testing. Default `true`.

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

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:109](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L109)

Active-state name. Default `'selected'`.

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L73)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`

***

### trigger?

> `optional` **trigger?**: `ModifierKey`[]

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L97)

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

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L115)

State applied to every element that is *not* selected. `undefined`
disables dimming. Default `undefined`.
