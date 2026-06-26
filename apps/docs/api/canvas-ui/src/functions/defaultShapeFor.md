# Function: defaultShapeFor()

> **defaultShapeFor**(`kind`): `NonNullable`\<`NodeShapeOptions`\>

Defined in: [canvas-ui/src/editors/node-style/mapping.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/mapping.ts#L10)

Construct a fresh shape spec with sane defaults for a given kind. Used when
the user switches `shapeKind` and there's no seeded geometry to preserve.

## Parameters

### kind

`"circle"` \| `"rect"` \| `"polygon"` \| `"regular-polygon"` \| `"star"` \| `"arc"` \| `"composite"` \| `string` & `object`

## Returns

`NonNullable`\<`NodeShapeOptions`\>
