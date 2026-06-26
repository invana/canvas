# Interface: UseFitContentResult

Defined in: [canvas-react/src/hooks/useFitContent.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useFitContent.ts#L18)

## Properties

### fitContent

> **fitContent**: (`padding?`) => `void`

Defined in: [canvas-react/src/hooks/useFitContent.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useFitContent.ts#L20)

Fit the viewport to the target layer's content bounds. No-op until the layer exists.

#### Parameters

##### padding?

`number`

#### Returns

`void`

***

### hasContent

> **hasContent**: `boolean`

Defined in: [canvas-react/src/hooks/useFitContent.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useFitContent.ts#L22)

Whether the target layer is currently mounted (drives e.g. button disabled state).
