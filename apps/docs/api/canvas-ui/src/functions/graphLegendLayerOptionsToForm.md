# Function: graphLegendLayerOptionsToForm()

> **graphLegendLayerOptionsToForm**(`o?`): [`GraphLegendLayerFields`](../interfaces/GraphLegendLayerFields.md)

Map a `GraphLegendLayerOptions`-shaped patch to the flat [GraphLegendLayerFields](../interfaces/GraphLegendLayerFields.md)
the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
union is split into `marginX` / `marginY`; chrome colours are CSS strings on
the engine (the overlay is DOM) so they pass through unchanged; only
`fallbackColor` — a graph-swatch colour, `0xRRGGBB` on the engine — converts
to `#rrggbb`.

## Parameters

### o?

[`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md) = `{}`

## Returns

[`GraphLegendLayerFields`](../interfaces/GraphLegendLayerFields.md)
