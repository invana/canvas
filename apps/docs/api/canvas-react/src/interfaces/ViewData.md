# Interface: ViewData

Defined in: [canvas-react/src/hooks/useViewData.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L15)

The single viewed node/edge resolved to its display fields. Read-only.

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Defined in: [canvas-react/src/hooks/useViewData.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L27)

Current `data` as a flat map. Values keep their original type (number,
string, array, object, …) so a viewer can render each property by kind —
`null` / `undefined` entries are dropped. See `PropertyDetailView`.

***

### id

> **id**: `string`

Defined in: [canvas-react/src/hooks/useViewData.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L17)

***

### kind

> **kind**: `"node"` \| `"edge"`

Defined in: [canvas-react/src/hooks/useViewData.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L16)

***

### label

> **label**: `string`

Defined in: [canvas-react/src/hooks/useViewData.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L19)

Effective (resolved) label text. Empty for edges (they have no label field).

***

### source?

> `optional` **source?**: `string`

Defined in: [canvas-react/src/hooks/useViewData.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L29)

Source node id — edges only.

***

### target?

> `optional` **target?**: `string`

Defined in: [canvas-react/src/hooks/useViewData.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L31)

Target node id — edges only.

***

### type?

> `optional` **type?**: `string`

Defined in: [canvas-react/src/hooks/useViewData.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L21)

The element's free-form `type` tag, when set.
