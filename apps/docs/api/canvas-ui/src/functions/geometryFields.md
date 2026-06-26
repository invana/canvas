# Function: geometryFields()

> **geometryFields**(`kind`): `FieldConfig`[]

Defined in: [canvas-ui/src/editors/node-style/fields.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/fields.ts#L63)

Geometry-tab fields for the current shape kind. Dynamic: the per-kind
numerics (radius / width-height / sides / points…) change with the watched
`shapeKind`, which is how the form-generator handles the discriminated
union. Falls back to no geometry numerics until a kind is chosen.

## Parameters

### kind

`"circle"` \| `"rect"` \| `"polygon"` \| `"regular-polygon"` \| `"star"` \| `"arc"` \| `"composite"` \| `string` & `object`

## Returns

`FieldConfig`[]
