# Type Alias: ConnectorLabelPlacement

> **ConnectorLabelPlacement** = `"start"` \| `"center"` \| `"end"` \| `number`

Defined in: [canvas/src/primitives/types.ts:1306](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1306)

Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
