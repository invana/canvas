# Type Alias: BackgroundColor

> **BackgroundColor** = `number` \| `string` \| \{ `dark`: `number` \| `string`; `light`: `number` \| `string`; \}

Defined in: [canvas/src/layers/BackgroundLayer.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L55)

A colour input. Pass a `number` / CSS string for a single colour, or a
`{ light, dark }` pair to swap based on the layer's `mode`.
