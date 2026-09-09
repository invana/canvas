# Function: collapsedTabbedRect()

> **collapsedTabbedRect**(`_spec`): `Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

The folder, closed: body gone, tab kept. `width` is deliberately left alone —
[tabbedRectBounds](tabbedRectBounds.md) already reports the tab as the footprint once the
body is gone, so rewriting it would double-apply.

## Parameters

### \_spec

[`TabbedRectGeometrySpec`](../type-aliases/TabbedRectGeometrySpec.md)

## Returns

`Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>
