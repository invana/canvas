# Function: projectLngLat()

> **projectLngLat**(`lngLat`): [`WorldPoint`](../interfaces/WorldPoint.md)

Project a geographic coordinate to canvas world coordinates (mercator pixels
at zoom 0). Stable across map zoom — pin nodes once at setup and let the
camera handle the rest.

## Parameters

### lngLat

[`LngLat`](../type-aliases/LngLat.md)

## Returns

[`WorldPoint`](../interfaces/WorldPoint.md)

## Example

```ts
const { x, y } = projectLngLat([airport.lng, airport.lat]);
  nodes.push({ id, position: { x, y }, data: { … } });
```
