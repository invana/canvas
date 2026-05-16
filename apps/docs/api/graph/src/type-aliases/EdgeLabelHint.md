# Type Alias: EdgeLabelHint

> **EdgeLabelHint** = `string` \| [`ConnectorLabelStyle`](../../../canvas/src/interfaces/ConnectorLabelStyle.md)

Defined in: [graph/src/layer/types.ts:32](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L32)

Edge-label hint — string shorthand or a full `ConnectorLabelStyle`. The
graph layer translates this to a `'label-connector'` decoration on the
edge's connector via `setDecoration`.

## See

`@invana/canvas#ConnectorLabelStyle` for the full option surface.
