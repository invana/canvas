# Type Alias: AnchorSpec

> **AnchorSpec** = `string` \| \{ `name`: `string`; `opts?`: `Readonly`\<`Record`\<`string`, `unknown`\>\>; \}

Defined in: [packages/canvas/src/primitives/types.ts:386](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L386)

Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
shape id to a concrete world-space `(x, y)` point on the shape — center of
the bounding box (`'center'`, default), perimeter intersection toward the
other endpoint (`'boundary'`), or any registered custom anchor.

String shorthand picks an anchor by name with default opts; the object
form passes opts to the anchor function.
