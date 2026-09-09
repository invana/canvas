# Function: exportImageDataURL()

> **exportImageDataURL**(`canvas`, `opts?`): `string`

Export the canvas as a `data:` URL. Synchronous counterpart to
[exportImage](exportImage.md) — handy for `<img src>` / quick previews. Prefer
[exportImage](exportImage.md) for downloads (a `Blob` URL avoids a large base64 string).

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### opts?

[`ExportImageOptions`](../interfaces/ExportImageOptions.md) = `{}`

## Returns

`string`
