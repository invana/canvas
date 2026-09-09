# Function: miniMapLayerOptionsToForm()

> **miniMapLayerOptionsToForm**(`o?`): [`MiniMapLayerFields`](../interfaces/MiniMapLayerFields.md)

Map a `MiniMapLayerOptions`-shaped patch to the flat [MiniMapLayerFields](../interfaces/MiniMapLayerFields.md)
the `@invana/forms` generator renders. Colours are normalised to hex strings;
`margin` to a scalar number; everything else passes through.

## Parameters

### o?

[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md) = `{}`

## Returns

[`MiniMapLayerFields`](../interfaces/MiniMapLayerFields.md)
