# Type Alias: MiniMapColor

> **MiniMapColor** = `number` \| \{ `dark`: `number`; `light`: `number`; \}

Defined in: [graph/src/layer/MiniMapLayer.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L42)

A minimap-chrome colour. Pass a single `0xRRGGBB` for a fixed colour, or a
`{ light, dark }` pair to swap based on the layer's `mode` — so the minimap
can track the canvas theme the same way BackgroundLayer does.
