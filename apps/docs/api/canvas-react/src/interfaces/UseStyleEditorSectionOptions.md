# Interface: UseStyleEditorSectionOptions

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L18)

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L30)

Menu alignment.

***

### canvas?

> `optional` **canvas?**: `Canvas`

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L32)

Explicit canvas instance; defaults to the context canvas.

***

### initial?

> `optional` **initial?**: `EdgePathType`

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L24)

Initially-selected path type. Default: the layer's current edge default.

***

### label?

> `optional` **label?**: `string`

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L22)

Trigger label. Default `'Edge'`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L28)

Optional key → human label map. Default: the built-in path-type labels.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L20)

Target `GraphLayer` id. Default `'graph'`.

***

### types?

> `optional` **types?**: readonly `EdgePathType`[]

Defined in: [canvas-react/src/hooks/useStyleEditorSection.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useStyleEditorSection.ts#L26)

Path types to expose, in order. Default: straight / orth / bezier / rounded / smooth.
