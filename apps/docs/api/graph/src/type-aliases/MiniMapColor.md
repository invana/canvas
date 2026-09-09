# Type Alias: MiniMapColor

> **MiniMapColor** = `number` \| \{ `dark`: `number`; `light`: `number`; \}

A minimap-chrome colour. Pass a single `0xRRGGBB` for a fixed colour, or a
`{ light, dark }` pair to swap based on the layer's `mode` — so the minimap
can track the canvas theme the same way BackgroundLayer does.
