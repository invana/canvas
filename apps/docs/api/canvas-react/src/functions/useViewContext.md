# Function: useViewContext()

> **useViewContext**(`options?`, `canvas?`): [`ViewContext`](../interfaces/ViewContext.md)

Defined in: [canvas-react/src/hooks/useViewContext.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L60)

Resolves the single clicked node/edge to a full [ViewContext](../interfaces/ViewContext.md) — the
read-only display fields ([useViewData](useViewData.md)) plus the raw entity and engine
handles — or `null` when nothing is targeted. This is what a custom viewer UI
receives; see `<ClickViewBehaviour panel={…}>`.

## Parameters

### options?

[`UseViewDataOptions`](../interfaces/UseViewDataOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`ViewContext`](../interfaces/ViewContext.md)
