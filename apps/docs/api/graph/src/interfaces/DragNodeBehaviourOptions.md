# Interface: DragNodeBehaviourOptions

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L44)

Constructor options for `DragNodeBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### dragCursor?

> `optional` **dragCursor?**: `string`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L55)

Cursor applied to the canvas while dragging. Default `'grabbing'`.

***

### dragSelection?

> `optional` **dragSelection?**: `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L93)

When `true` (the default), grabbing a node that is part of the current
selection drags the **whole selection** together — every selected node
moves by the same delta. Grabbing an unselected node (or a selection of
one) falls back to a plain single-node drag. Set `false` to always drag
just the grabbed node regardless of selection.

Selection is read from the layer's visual state (see `selectionState`),
so this works uniformly whatever set it — click, lasso, or brush — with
no coupling to a specific select behaviour.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### filter?

> `optional` **filter?**: (`id`) => `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L52)

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

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L80)

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

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### pinOnRelease?

> `optional` **pinOnRelease?**: `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L66)

When `true`, set `GraphNode.pinned = true` on the dragged node when
the gesture ends (real drag only — a click that didn't move is a
no-op). The store's pinned flag is read by layouts (e.g.
`D3ForceLayout` writes pinned nodes to d3-force's `fx/fy`) so the
node stays where the user dropped it across future layout passes.
Default `false`. To un-pin a pinned node, call
`graph.store.setPinned(id, false)` explicitly.

***

### selectionBodyDrag?

> `optional` **selectionBodyDrag?**: `boolean`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L121)

When `true` (the default), a plain (no-modifier) press anywhere inside the
current selection's union bounding box — *including the empty world space
between the selected nodes* — grabs the whole selection and drags it, the
way Figma / PowerPoint let you drag a multi-selection by its body rather
than by a specific item.

Without this, a selection is only draggable by pressing squarely on one of
the selected nodes; pressing in the gaps does nothing (no shape is hit, so
no drag starts). Off the back of a brush/lasso selection that almost always
reads as "the selection won't move" — hence default on.

Only meaningful when `dragSelection` is also on. The press must carry no
modifier key (so it never collides with brush / lasso / shift-to-add) and
must not land on a node (those go through the normal per-node path). This
does mean panning the camera by dragging from *inside* the selection box is
no longer possible — drag from outside the box, or set this `false`.

***

### selectionBodyPadding?

> `optional` **selectionBodyPadding?**: `number`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L128)

Extra world-space padding added around the selection's union bounding box
when testing a press for [selectionBodyDrag](#selectionbodydrag). Widens the grab target
so presses just outside the tightest box still catch. Default `0`.

***

### selectionState?

> `optional` **selectionState?**: `string`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L101)

Name of the layer visual-state that marks a node as selected. Default
`'selected'`, matching `ClickSelectBehaviour`'s default `state`. Only
consulted when `dragSelection` is on. Override if your select behaviour
writes a different state name.

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

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/DragNodeBehaviour.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DragNodeBehaviour.ts#L46)

Required — the `GraphLayer` id whose nodes this behaviour drags.

#### Overrides

`BehaviourOptions.targetLayerId`
