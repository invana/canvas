# Type Alias: ConnectorEndpointSpec

> **ConnectorEndpointSpec** = \{ `kind`: `"point"`; `tangent?`: [`Vec2`](../interfaces/Vec2.md); `x`: `number`; `y`: `number`; \} \| \{ `anchor?`: [`AnchorSpec`](AnchorSpec.md); `kind`: `"shape"`; `padding?`: `number`; `shapeId`: `string`; \}

Defined in: [canvas/src/primitives/types.ts:441](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L441)

## Union Members

### Type Literal

\{ `kind`: `"point"`; `tangent?`: [`Vec2`](../interfaces/Vec2.md); `x`: `number`; `y`: `number`; \}

***

### Type Literal

\{ `anchor?`: [`AnchorSpec`](AnchorSpec.md); `kind`: `"shape"`; `padding?`: `number`; `shapeId`: `string`; \}

#### anchor?

> `readonly` `optional` **anchor?**: [`AnchorSpec`](AnchorSpec.md)

#### kind

> `readonly` **kind**: `"shape"`

#### padding?

> `readonly` `optional` **padding?**: `number`

Outward offset applied AFTER the anchor resolves. The anchor's
returned `tangent` is treated as the outward direction; the endpoint
moves by `tangent * padding` world units before reaching the router.

Use cases:
- Halo / glow decoration extends beyond the silhouette → set
  `padding` to the halo's outer radius so the connector visibly
  starts at the halo's edge, not at the shape's tight boundary.
- Visual breathing room around tightly packed shapes.

No-op when the chosen anchor returns no tangent (e.g. `center`).
Negative values pull the endpoint INWARD; default `0`.

#### shapeId

> `readonly` **shapeId**: `string`
