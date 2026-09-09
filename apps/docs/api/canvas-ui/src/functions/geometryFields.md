# Function: geometryFields()

> **geometryFields**(`kind`): `FieldConfig`[]

Geometry-tab fields for the current shape kind. Dynamic: the per-kind
numerics (radius / width-height / sides / points…) change with the watched
`shapeKind`, which is how the form-generator handles the discriminated
union. Falls back to no geometry numerics until a kind is chosen.

## Parameters

### kind

`"circle"` \| `"rect"` \| `"tabbed-rect"` \| `"polygon"` \| `"regular-polygon"` \| `"arc"` \| `"star"` \| `"composite"` \| `string` & `object`

## Returns

`FieldConfig`[]
