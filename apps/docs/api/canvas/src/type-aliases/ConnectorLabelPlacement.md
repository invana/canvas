# Type Alias: ConnectorLabelPlacement

> **ConnectorLabelPlacement** = `"start"` \| `"center"` \| `"end"` \| `number`

Defined in: [canvas/src/primitives/types.ts:1308](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1308)

Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
