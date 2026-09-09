# Function: d3HierarchyLayoutOptionsToForm()

> **d3HierarchyLayoutOptionsToForm**(`o?`): [`D3HierarchyLayoutFields`](../interfaces/D3HierarchyLayoutFields.md)

Map a `D3HierarchyLayoutOptions`-shaped patch to the flat
[D3HierarchyLayoutFields](../interfaces/D3HierarchyLayoutFields.md). The `size` / `nodeSize` tuples are split into
their scalar components and `center: { x, y }` into `centerX` / `centerY`.

## Parameters

### o?

[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md) = `{}`

## Returns

[`D3HierarchyLayoutFields`](../interfaces/D3HierarchyLayoutFields.md)
