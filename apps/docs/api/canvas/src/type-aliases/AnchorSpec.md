# Type Alias: AnchorSpec

> **AnchorSpec** = `string` \| \{ `name`: `string`; `opts?`: `Readonly`\<`Record`\<`string`, `unknown`\>\>; \}

Defined in: [canvas/src/primitives/types.ts:502](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L502)

Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
shape id to a concrete world-space `(x, y)` point on the shape — center of
the bounding box (`'center'`, default), perimeter intersection toward the
other endpoint (`'boundary'`), or any registered custom anchor.

String shorthand picks an anchor by name with default opts; the object
form passes opts to the anchor function.
