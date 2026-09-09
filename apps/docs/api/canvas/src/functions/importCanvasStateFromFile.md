# Function: importCanvasStateFromFile()

> **importCanvasStateFromFile**(`canvas`, `source`, `opts?`): `Promise`\<`void`\>

Restore the canvas from a snapshot, a JSON string, or a picked `File` / `Blob`
(e.g. from an `<input type="file">`) — the file counterpart to
[importCanvasState](importCanvasState.md). Parses `source` then delegates to
[importCanvasState](importCanvasState.md) (same registered-instances requirement).

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### source

[`CanvasStateSource`](../type-aliases/CanvasStateSource.md)

### opts?

[`ImportCanvasStateOptions`](../interfaces/ImportCanvasStateOptions.md)

## Returns

`Promise`\<`void`\>
