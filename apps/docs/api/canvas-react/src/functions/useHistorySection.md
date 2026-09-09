# Function: useHistorySection()

> **useHistorySection**(`options?`): `ToolbarItem`[]

**History** toolbar section — undo / redo ToolbarItems built off
[useHistory](useHistory.md), with live `disabled` state (`!canUndo` / `!canRedo`).
Compose the result with other sections and render via `ToolbarItems`. Requires
a `<GraphHistoryProvider>` ancestor.

## Parameters

### options?

[`UseHistorySectionOptions`](../interfaces/UseHistorySectionOptions.md) = `{}`

## Returns

`ToolbarItem`[]
