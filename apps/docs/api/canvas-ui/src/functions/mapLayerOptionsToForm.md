# Function: mapLayerOptionsToForm()

> **mapLayerOptionsToForm**(`o?`): [`MapLayerFields`](../interfaces/MapLayerFields.md)

Map a `MapLayerOptions`-shaped patch to the flat [MapLayerFields](../interfaces/MapLayerFields.md). The
engine's `center: [lng, lat]` tuple is split into `centerLng` / `centerLat`
scalars; `styleUrl` passes through (a non-string StyleSpecification object is
out of scope — mirror it in the options type as `string` only).

## Parameters

### o?

[`MapLayerOptions`](../interfaces/MapLayerOptions.md) = `{}`

## Returns

[`MapLayerFields`](../interfaces/MapLayerFields.md)
