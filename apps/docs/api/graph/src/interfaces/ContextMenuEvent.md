# Interface: ContextMenuEvent

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:40](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L40)

Payload handed to [ContextMenuBehaviourOptions.onContextMenu](ContextMenuBehaviourOptions.md#oncontextmenu).

## Properties

### data

> `readonly` **data**: `unknown`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L49)

Arbitrary user payload from `node.data` / `edge.data`. `undefined` for a
canvas right-click or when the resolved item carries no `data`.

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L44)

Node/edge id, or `null` for an empty-canvas right-click.

***

### screen

> `readonly` **screen**: `object`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L58)

Pointer position in screen (canvas-relative) coordinates, via
`camera.toScreen`. Add the canvas element's bounding-rect offset to place
a `position: fixed` menu, or use directly inside a `position: relative`
canvas container.

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### targetType

> `readonly` **targetType**: [`ContextMenuTargetType`](../type-aliases/ContextMenuTargetType.md)

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L42)

What was right-clicked.

***

### world

> `readonly` **world**: `object`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L51)

Pointer position in world (scene) coordinates.

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`
