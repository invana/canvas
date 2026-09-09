# Function: applyIconOverrides()

> **applyIconOverrides**(`items`, `icons?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Swap the `icon` of `button` / `toggle` items whose [ToolbarItemBase.key](../interfaces/ToolbarButtonItem.md#key)
matches a key in `icons`. Partial — unlisted items keep their baked icon. This
is how the turnkey `*Toolbar` components honour their optional `icons` prop
without the section hooks ever taking icons: build items (with baked defaults),
then `applyIconOverrides(items, props.icons)` before rendering.

Note: only the primary `icon` is overridden (not a toggle's `activeIcon`, nor a
`select`'s per-option `icons`).

## Parameters

### items

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

### icons?

`Partial`\<`Record`\<`string`, [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)\>\>

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
