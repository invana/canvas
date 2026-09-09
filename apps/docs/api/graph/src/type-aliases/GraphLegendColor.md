# Type Alias: GraphLegendColor

> **GraphLegendColor** = `string` \| \{ `dark`: `string`; `light`: `string`; \}

A legend-chrome colour. Pass a single CSS colour string for a fixed colour, or
a `{ light, dark }` pair to swap based on the resolved [GraphLegendMode](GraphLegendMode.md) — so
the legend can track the canvas theme the way `BackgroundLayer` and
`MiniMapLayer` do.
