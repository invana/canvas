# Type Alias: NodeLabelHint

> **NodeLabelHint** = `string` \| [`ShapeLabelStyle`](../../../canvas/src/interfaces/ShapeLabelStyle.md)

Defined in: [graph/src/layer/types.ts:23](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L23)

Node-label hint — either a bare string (shorthand for plain text with
defaults) or a full `ShapeLabelStyle` payload (background pill, wrap,
placement, etc.). The graph layer translates this to a `'label'`
decoration on the node's shape via `setDecoration`.

## See

`@invana/canvas#ShapeLabelStyle` for the full option surface.
