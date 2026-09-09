# Function: canvasStateToJSON()

> **canvasStateToJSON**(`canvas`, `space?`): `string`

The current canvas state as a JSON string (pretty-printed by default). Sugar
over `JSON.stringify(exportCanvasState(canvas), null, space)`.

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### space?

`string` \| `number`

## Returns

`string`
