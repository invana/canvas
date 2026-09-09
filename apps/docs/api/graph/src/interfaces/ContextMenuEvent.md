# Interface: ContextMenuEvent

Payload handed to [ContextMenuBehaviourOptions.onContextMenu](ContextMenuBehaviourOptions.md#oncontextmenu).

## Properties

### data

> `readonly` **data**: `unknown`

Arbitrary user payload from `node.data` / `edge.data`. `undefined` for a
canvas right-click or when the resolved item carries no `data`.

***

### id

> `readonly` **id**: `string`

Node/edge id, or `null` for an empty-canvas right-click.

***

### screen

> `readonly` **screen**: `object`

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

What was right-clicked.

***

### world

> `readonly` **world**: `object`

Pointer position in world (scene) coordinates.

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`
