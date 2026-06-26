# Type Alias: ToolbarItem

> **ToolbarItem** = [`ToolbarButtonItem`](../interfaces/ToolbarButtonItem.md) \| [`ToolbarToggleItem`](../interfaces/ToolbarToggleItem.md) \| [`ToolbarSelectItem`](../interfaces/ToolbarSelectItem.md) \| [`ToolbarDividerItem`](../interfaces/ToolbarDividerItem.md) \| [`ToolbarCustomItem`](../interfaces/ToolbarCustomItem.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L118)

A single declarative toolbar control. Build arrays of these with the builder
hooks (or by hand) and render them with [ToolbarItems](../variables/Canvas.md); concatenate
arrays with `divider` items between groups to assemble a full toolbar.
