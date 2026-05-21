# Interface: DragNodeBehaviourOptions

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:29](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L29)

Constructor options for `DragNodeBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### dragCursor?

> `optional` **dragCursor?**: `string`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L55)

Cursor applied to the canvas while dragging. Default `'grabbing'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### filter?

> `optional` **filter?**: (`id`) => `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L37)

Predicate to restrict which node ids are draggable. Returning `false`
ignores the pointerdown. Default = every node is draggable.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### groupAware?

> `optional` **groupAware?**: `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L69)

When `true` (the default), dragging a node that is itself a compound
group (resolved `style.group` set) translates every descendant by the
same delta in one `setPositionsBulk` call so the whole subtree moves
together. Set to `false` to drag the group frame on its own — useful
only when descendants are layout-driven and should stay put.

For auto-fit groups the frame's position is layer-derived from the
children bbox; moving descendants moves the frame naturally on the
next flush. For non-auto-fit groups, the group's stored `position`
is also updated so the declared frame follows the cursor.

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:31](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L31)

Required — the `GraphLayer` id whose nodes this behaviour drags.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### pinOnRelease?

> `optional` **pinOnRelease?**: `"keep"` \| `"release"` \| `"restore"`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L52)

What to do with the node's `pinned` state on drag end:
- `'keep'` (default) — leave it pinned. Subsequent layouts won't move it.
- `'release'` — clear the pin. The next layout pass may shuffle the node.
- `'restore'` — restore the pre-drag pinned value.

***

### pinWhileDragging?

> `optional` **pinWhileDragging?**: `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/DragNodeBehaviour.ts#L44)

Pin the node (`store.setPinned(id, true)`) when the drag starts so any
subsequent layout pass leaves the dropped node where the user put it.
Default `true`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)
