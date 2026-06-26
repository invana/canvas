# Interface: UseLayoutsSectionOptions

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:6](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L6)

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L20)

Menu alignment.

***

### canvas?

> `optional` **canvas?**: `Canvas`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L22)

Explicit canvas instance; defaults to the context canvas.

***

### fitPadding?

> `optional` **fitPadding?**: `number`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L14)

Padding for the post-layout fit. Default `80`.

***

### initial?

> `optional` **initial?**: `string`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L16)

Initially-selected key. Default: first key.

***

### label?

> `optional` **label?**: `string`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L10)

Trigger label. Default `'Layout'`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L18)

Optional key → human label map. Default: identity.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L12)

Target `GraphLayer` id. Default `'graph'`.

***

### layouts

> **layouts**: `Record`\<`string`, [`LayoutFactory`](../type-aliases/LayoutFactory.md)\>

Defined in: [canvas-react/src/hooks/useLayoutsSection.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayoutsSection.ts#L8)

Map of layout key → factory producing a fresh layout instance. Memoize it.
