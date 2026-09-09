# Function: defaultShapeFor()

> **defaultShapeFor**(`kind`): `NonNullable`\<`NodeShapeOptions`\>

Construct a fresh shape spec with sane defaults for a given kind. Used when
the user switches `shapeKind` and there's no seeded geometry to preserve.

## Parameters

### kind

`"circle"` \| `"rect"` \| `"tabbed-rect"` \| `"polygon"` \| `"regular-polygon"` \| `"arc"` \| `"star"` \| `"composite"` \| `string` & `object`

## Returns

`NonNullable`\<`NodeShapeOptions`\>
