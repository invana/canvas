# Type Alias: EdgeLabelHint

> **EdgeLabelHint** = `string` \| [`ConnectorLabelStyle`](../../../canvas/src/interfaces/ConnectorLabelStyle.md)

Defined in: [graph/src/layer/types.ts:32](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L32)

Edge-label hint — string shorthand or a full `ConnectorLabelStyle`. The
graph layer translates this to a `'label-connector'` decoration on the
edge's connector via `setDecoration`.

## See

`@invana/canvas#ConnectorLabelStyle` for the full option surface.
