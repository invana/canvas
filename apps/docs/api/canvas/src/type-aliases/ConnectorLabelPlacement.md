# Type Alias: ConnectorLabelPlacement

> **ConnectorLabelPlacement** = `"start"` \| `"center"` \| `"end"` \| `number`

Defined in: [canvas/src/primitives/types.ts:1178](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1178)

Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
