# Interface: UseCanvasImageExportResult

## Methods

### download()

> **download**(`opts?`): `Promise`\<`void`\>

Export, then trigger a browser download of the resulting file.

#### Parameters

##### opts?

[`DownloadImageExportOptions`](DownloadImageExportOptions.md)

#### Returns

`Promise`\<`void`\>

***

### toBlob()

> **toBlob**(`opts?`): `Promise`\<`Blob`\>

Export the current view as an image `Blob` (PNG / JPEG / WebP / SVG).

#### Parameters

##### opts?

`ExportImageOptions`

#### Returns

`Promise`\<`Blob`\>
