# Type Alias: MarkerShapeSpec

> **MarkerShapeSpec** = `Omit`\<[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md), `"x"` \| `"y"`\> & `object`

Defined in: [packages/canvas/src/primitives/types.ts:375](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L375)

A marker spec is any registered shape spec **without** `x` / `y` — the
connector positions and orients the marker at the polyline endpoint.
Reuses the shape registry: there is no separate marker registry. The
shape's class must expose a static `paintInto` (see `ShapeCtor`).

## Type Declaration

### kind

> `readonly` **kind**: `string`
