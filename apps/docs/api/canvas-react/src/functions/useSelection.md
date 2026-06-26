# Function: useSelection()

> **useSelection**(`options?`, `canvas?`): [`UseSelectionResult`](../interfaces/UseSelectionResult.md)

Defined in: [canvas-react/src/hooks/useSelection.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelection.ts#L31)

Reactive view of the current graph selection, driven by a
`ClickSelectBehaviour`'s `selection:change` event (brush/lasso flow through it
by delegation, so all three selection modes are covered by this one hook).

Requires a registered `ClickSelectBehaviour`; if absent, the selection is
empty and `clear` is a no-op.

## Parameters

### options?

[`UseSelectionOptions`](../interfaces/UseSelectionOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseSelectionResult`](../interfaces/UseSelectionResult.md)
