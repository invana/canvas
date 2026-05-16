# Type Alias: NodeLabelHint

> **NodeLabelHint** = `string` \| [`ShapeLabelStyle`](../../../canvas/src/interfaces/ShapeLabelStyle.md)

Defined in: [graph/src/layer/types.ts:23](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L23)

Node-label hint — either a bare string (shorthand for plain text with
defaults) or a full `ShapeLabelStyle` payload (background pill, wrap,
placement, etc.). The graph layer translates this to a `'label'`
decoration on the node's shape via `setDecoration`.

## See

`@invana/canvas#ShapeLabelStyle` for the full option surface.
