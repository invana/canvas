# Type Alias: MarkerShapeSpec

> **MarkerShapeSpec** = `Omit`\<[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md), `"x"` \| `"y"`\> & `object`

Defined in: [packages/canvas/src/renderers/types.ts:78](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L78)

A marker spec is any registered shape spec **without** `x`/`y` — the
connector positions and orients the marker at the polyline endpoint.
Reuses the shape registry (`registerShape`) — there is no separate marker
registry. The shape's constructor must expose a static `paintInto` for
the connector to paint it into the connector's Graphics.

## Type Declaration

### kind

> `readonly` **kind**: `string`
