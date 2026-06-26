# Function: useHistorySection()

> **useHistorySection**(`options?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/hooks/useHistorySection.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistorySection.ts#L22)

**History** toolbar section — undo / redo [ToolbarItem](../type-aliases/ToolbarItem.md)s built off
[useHistory](useHistory.md), with live `disabled` state (`!canUndo` / `!canRedo`).
Compose the result with other sections and render via `ToolbarItems`. Requires
a `<GraphHistoryProvider>` ancestor.

## Parameters

### options?

[`UseHistorySectionOptions`](../interfaces/UseHistorySectionOptions.md) = `{}`

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
