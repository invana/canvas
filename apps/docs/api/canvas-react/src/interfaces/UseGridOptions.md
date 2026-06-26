# Interface: UseGridOptions

Defined in: [canvas-react/src/hooks/useGrid.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGrid.ts#L8)

## Properties

### backgroundLayerId?

> `optional` **backgroundLayerId?**: `string`

Defined in: [canvas-react/src/hooks/useGrid.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGrid.ts#L10)

Id of the `BackgroundLayer` to toggle. Default `'background'`.

***

### patternType?

> `optional` **patternType?**: `PatternType`

Defined in: [canvas-react/src/hooks/useGrid.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGrid.ts#L15)

Pattern to switch to when the grid is shown. When omitted, the layer's
existing `patternType` is preserved (only `type` is toggled).
