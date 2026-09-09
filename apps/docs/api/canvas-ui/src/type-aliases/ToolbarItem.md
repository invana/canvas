# Type Alias: ToolbarItem

> **ToolbarItem** = [`ToolbarButtonItem`](../interfaces/ToolbarButtonItem.md) \| [`ToolbarToggleItem`](../interfaces/ToolbarToggleItem.md) \| [`ToolbarSelectItem`](../interfaces/ToolbarSelectItem.md) \| [`ToolbarDividerItem`](../interfaces/ToolbarDividerItem.md) \| [`ToolbarCustomItem`](../interfaces/ToolbarCustomItem.md)

A single declarative toolbar control. Build arrays of these with the builder
hooks (or by hand) and render them with [ToolbarItems](../../../canvas/src/variables/SpecStore.md); concatenate
arrays with `divider` items between groups to assemble a full toolbar.
