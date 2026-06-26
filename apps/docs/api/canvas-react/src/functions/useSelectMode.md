# Function: useSelectMode()

> **useSelectMode**(`behaviourIds`, `options?`, `canvas?`): [`UseSelectModeResult`](../interfaces/UseSelectModeResult.md)

Defined in: [canvas-react/src/hooks/useSelectMode.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelectMode.ts#L31)

Mutually-exclusive selection-mode switch. Maps mode keys to behaviour ids
(e.g. `{ click: 'click-select', brush: 'brush-select', lasso: 'lasso-select' }`)
and toggles their `enabled` so exactly one is active. The consumer must have
registered those behaviours; this hook can't be turnkey.

The initial mode is enabled on mount. Memoize `behaviourIds` (module scope or
`useMemo`) so `setMode` stays stable.

## Parameters

### behaviourIds

`Record`\<`string`, `string`\>

### options?

[`UseSelectModeOptions`](../interfaces/UseSelectModeOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseSelectModeResult`](../interfaces/UseSelectModeResult.md)
