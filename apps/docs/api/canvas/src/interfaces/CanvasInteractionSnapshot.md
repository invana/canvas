# Interface: CanvasInteractionSnapshot

JSON-safe projection of [CanvasView.interaction](CanvasView.md#interaction) — every `Set` is
flattened to an array (and rehydrated on import). Camera is a plain
`{ x, y, zoom }` already.

## Properties

### camera

> **camera**: [`CameraTransformValue`](CameraTransformValue.md)

***

### focus

> **focus**: `object`

#### dim

> **dim**: `boolean`

#### ids

> **ids**: `string`[]

***

### hover

> **hover**: `string`

***

### selection

> **selection**: `string`[]

***

### states

> **states**: `Record`\<`string`, `string`[]\>

***

### transientPins

> **transientPins**: `string`[]

***

### viewMode

> **viewMode**: `string`
