# Function: useCanvasImageExport()

> **useCanvasImageExport**(`canvas?`): [`UseCanvasImageExportResult`](../interfaces/UseCanvasImageExportResult.md)

Export the current canvas view to an image and optionally download it.

Thin binding over the engine's [Canvas.export](../../../graph/src/classes/GraphCanvas.md#export): `toBlob` returns the
raw `Blob` (for previews / uploads / custom handling); `download` saves it as
a file. Both take the engine ExportImageOptions — `format`
(`'png' | 'jpeg' | 'webp' | 'svg'`), `area` (`'viewport' | 'content'`),
`background`, `scale`, `quality`. Multi-canvas-safe via the optional
`canvas` argument (falls back to the `<Canvas>` context).

## Parameters

### canvas?

`Canvas`

## Returns

[`UseCanvasImageExportResult`](../interfaces/UseCanvasImageExportResult.md)

## Example

```ts
const { download } = useCanvasImageExport();
<button onClick={() => download({ format: 'png', area: 'content' })}>Save PNG</button>
```
