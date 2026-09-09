# Function: downloadCanvasState()

> **downloadCanvasState**(`canvas`, `filename?`): `void`

Serialise the canvas's full state and trigger a browser download of the
`.json` file. Framework-agnostic (no React) — the file counterpart to
[exportCanvasState](exportCanvasState.md). No-op outside a DOM environment.

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### filename?

`string` = `'canvas-state.json'`

## Returns

`void`
