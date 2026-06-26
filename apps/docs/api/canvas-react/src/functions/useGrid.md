# Function: useGrid()

> **useGrid**(`options?`, `canvas?`): [`UseGridResult`](../interfaces/UseGridResult.md)

Defined in: [canvas-react/src/hooks/useGrid.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGrid.ts#L36)

Toggle a `BackgroundLayer`'s pattern on/off. "Grid shown" maps to
`type: 'pattern'`, "hidden" to `type: 'solid'`. Pass `patternType` to force a
specific pattern (e.g. `'grid'`) when turning it on; otherwise the layer's
configured pattern is kept.

State is owned by the hook (the background layer emits no option-change event)
and seeded from `getOptions()` on mount.

## Parameters

### options?

[`UseGridOptions`](../interfaces/UseGridOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseGridResult`](../interfaces/UseGridResult.md)
