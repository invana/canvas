# Type Alias: IAnchor

> **IAnchor** = (`endpoint`, `fromPoint`, `ctx`) => [`Endpoint`](../interfaces/Endpoint.md)

Defined in: [packages/canvas/src/primitives/types.ts:458](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L458)

Anchor: a pure function that resolves a `kind: 'shape'` endpoint to a
concrete world-space point on the referenced shape.

- `endpoint` carries the shape id and any per-call opts.
- `fromPoint` is the OTHER endpoint's first-pass world point — used by
  `boundary` to project a ray toward it. Anchors that don't need it
  (`center`) ignore it.
- The returned `Endpoint` may include an outward `tangent` hint; routers
  that respect it (`orthogonal`, `er`, …) prefer it over heuristics.

## Parameters

### endpoint

#### opts?

`Readonly`\<`Record`\<`string`, `unknown`\>\>

#### shapeId

`string`

### fromPoint

[`Point`](../interfaces/Point.md)

### ctx

[`AnchorCtx`](../interfaces/AnchorCtx.md)

## Returns

[`Endpoint`](../interfaces/Endpoint.md)
