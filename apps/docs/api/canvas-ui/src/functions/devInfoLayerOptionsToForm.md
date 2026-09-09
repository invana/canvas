# Function: devInfoLayerOptionsToForm()

> **devInfoLayerOptionsToForm**(`o?`): [`DevInfoLayerFields`](../interfaces/DevInfoLayerFields.md)

Map a `DevInfoLayerOptions`-shaped patch to the flat [DevInfoLayerFields](../interfaces/DevInfoLayerFields.md)
the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
union is split into `marginX` / `marginY`. Colours are CSS strings on the
engine (`textColor` / `accentColor` are `#rrggbb`, `backgroundColor` may be
`rgba(...)`), so they pass through unchanged — no number conversion.

## Parameters

### o?

[`DevInfoLayerOptions`](../interfaces/DevInfoLayerOptions.md) = `{}`

## Returns

[`DevInfoLayerFields`](../interfaces/DevInfoLayerFields.md)
