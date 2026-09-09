# Function: geometricLayoutOptionsToForm()

> **geometricLayoutOptionsToForm**(`o?`): [`GeometricLayoutFields`](../interfaces/GeometricLayoutFields.md)

Map a `GeometricLayoutOptions`-shaped patch to the flat
[GeometricLayoutFields](../interfaces/GeometricLayoutFields.md). The `center: { x, y }` object is split into
`centerX` / `centerY`; everything else passes through.

## Parameters

### o?

[`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md) = `{}`

## Returns

[`GeometricLayoutFields`](../interfaces/GeometricLayoutFields.md)
