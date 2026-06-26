# Interface: UseLayoutOptions

Defined in: [canvas-react/src/hooks/useLayout.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L16)

## Properties

### applyInitial?

> `optional` **applyInitial?**: `boolean`

Defined in: [canvas-react/src/hooks/useLayout.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L26)

Apply the initial layout once the target layer is mounted. Default `true`.

***

### fitPadding?

> `optional` **fitPadding?**: `number`

Defined in: [canvas-react/src/hooks/useLayout.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L20)

Padding for the post-layout `camera.fitContent`. Default `80`.

***

### initial?

> `optional` **initial?**: `string`

Defined in: [canvas-react/src/hooks/useLayout.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L22)

Initially-selected key. Default: first key of `layouts`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useLayout.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L24)

Optional key → human label map for the picker. Default: identity.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useLayout.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLayout.ts#L18)

Target `GraphLayer` id. Default `'graph'`.
