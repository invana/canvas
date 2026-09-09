# Function: exportImage()

> **exportImage**(`canvas`, `opts?`): `Promise`\<`Blob`\>

Export the canvas as an image `Blob`. See [ExportImageOptions](../interfaces/ExportImageOptions.md).
Rejects when no GPU renderer is available or the region is empty.

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### opts?

[`ExportImageOptions`](../interfaces/ExportImageOptions.md) = `{}`

## Returns

`Promise`\<`Blob`\>
