# Type Alias: MarkerShapeSpec

> **MarkerShapeSpec** = `Omit`\<[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md), `"x"` \| `"y"`\> & `object`

Defined in: [packages/canvas/src/primitives/types.ts:375](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L375)

A marker spec is any registered shape spec **without** `x` / `y` — the
connector positions and orients the marker at the polyline endpoint.
Reuses the shape registry: there is no separate marker registry. The
shape's class must expose a static `paintInto` (see `ShapeCtor`).

## Type Declaration

### kind

> `readonly` **kind**: `string`
