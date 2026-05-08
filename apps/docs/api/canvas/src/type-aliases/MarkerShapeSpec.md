# Type Alias: MarkerShapeSpec

> **MarkerShapeSpec** = `Omit`\<[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md), `"x"` \| `"y"`\> & `object`

Defined in: packages/canvas/src/primitives/types.ts:233

A marker spec is any registered shape spec **without** `x` / `y` — the
connector positions and orients the marker at the polyline endpoint.
Reuses the shape registry: there is no separate marker registry. The
shape's class must expose a static `paintInto` (see `ShapeCtor`).

## Type Declaration

### kind

> `readonly` **kind**: `string`
