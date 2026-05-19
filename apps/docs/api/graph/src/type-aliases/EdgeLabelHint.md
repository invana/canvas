# Type Alias: EdgeLabelHint

> **EdgeLabelHint** = `string` \| [`ConnectorLabelStyle`](../../../canvas/src/interfaces/ConnectorLabelStyle.md)

Defined in: [graph/src/layer/types.ts:32](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L32)

Edge-label hint — string shorthand or a full `ConnectorLabelStyle`. The
graph layer translates this to a `'label-connector'` decoration on the
edge's connector via `setDecoration`.

## See

`@invana/canvas#ConnectorLabelStyle` for the full option surface.
