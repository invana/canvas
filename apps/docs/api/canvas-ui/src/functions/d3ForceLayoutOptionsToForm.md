# Function: d3ForceLayoutOptionsToForm()

> **d3ForceLayoutOptionsToForm**(`o?`): [`D3ForceLayoutFields`](../interfaces/D3ForceLayoutFields.md)

Map a `D3ForceLayoutOptions`-shaped patch to the flat
[D3ForceLayoutFields](../interfaces/D3ForceLayoutFields.md). The nested force groups (`link` / `charge` /
`center` / `collide`) are read out into prefixed scalar fields;
`collide.radius` is only surfaced when it's a constant (function radii are
out of scope).

## Parameters

### o?

[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md) = `{}`

## Returns

[`D3ForceLayoutFields`](../interfaces/D3ForceLayoutFields.md)
