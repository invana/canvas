# Function: d3SankeyLayoutOptionsToForm()

> **d3SankeyLayoutOptionsToForm**(`o?`): [`D3SankeyLayoutFields`](../interfaces/D3SankeyLayoutFields.md)

Map a `D3SankeyLayoutOptions`-shaped patch to the flat
[D3SankeyLayoutFields](../interfaces/D3SankeyLayoutFields.md). The `size` tuple is split into `sizeWidth` /
`sizeHeight` and `center: { x, y }` into `centerX` / `centerY`.

## Parameters

### o?

[`D3SankeyLayoutOptions`](../interfaces/D3SankeyLayoutOptions.md) = `{}`

## Returns

[`D3SankeyLayoutFields`](../interfaces/D3SankeyLayoutFields.md)
