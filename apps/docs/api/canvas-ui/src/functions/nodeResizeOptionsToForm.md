# Function: nodeResizeOptionsToForm()

> **nodeResizeOptionsToForm**(`o?`): [`NodeResizeFields`](../interfaces/NodeResizeFields.md)

Map a `NodeResizeBehaviourOptions`-shaped patch to the flat
[NodeResizeFields](../interfaces/NodeResizeFields.md) the `@invana/forms` generator renders. Engine number
colours (`0xRRGGBB`) become `#rrggbb` swatch strings; the `dashArray` tuple is
split into `dashLength` / `dashGap` number fields.

## Parameters

### o?

[`NodeResizeOptions`](../interfaces/NodeResizeOptions.md) = `{}`

## Returns

[`NodeResizeFields`](../interfaces/NodeResizeFields.md)
