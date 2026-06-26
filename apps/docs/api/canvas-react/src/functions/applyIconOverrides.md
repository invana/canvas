# Function: applyIconOverrides()

> **applyIconOverrides**(`items`, `icons?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/components/ToolbarItem.ts:135](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L135)

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
