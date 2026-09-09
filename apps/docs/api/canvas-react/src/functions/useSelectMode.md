# Function: useSelectMode()

> **useSelectMode**(`behaviourIds`, `options?`, `canvas?`): [`UseSelectModeResult`](../interfaces/UseSelectModeResult.md)

Mutually-exclusive selection-mode switch. Maps mode keys to behaviour ids
(e.g. `{ click: 'click-select', brush: 'brush-select', lasso: 'lasso-select' }`)
and toggles their `enabled` so exactly one is active. The consumer must have
registered those behaviours; this hook can't be turnkey.

**Store-driven (single source of truth).** `mode` is *derived* from
`store.view.definition.behaviours[id].enabled` read reactively, and `setMode`
*writes* through `canvas.update({ behaviours })`. So the mode reflects — and
drives — the same state any other UI (e.g. a settings panel) reads/writes:
flip a tool in the panel and this picker follows, and vice-versa, with no
event wiring. The initial mode is enforced on mount. Memoize `behaviourIds`
(module scope or `useMemo`) so `setMode` stays stable.

## Parameters

### behaviourIds

`Record`\<`string`, `string`\>

### options?

[`UseSelectModeOptions`](../interfaces/UseSelectModeOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseSelectModeResult`](../interfaces/UseSelectModeResult.md)
