# Type Alias: AnchorSpec

> **AnchorSpec** = `string` \| \{ `name`: `string`; `opts?`: `Readonly`\<`Record`\<`string`, `unknown`\>\>; \}

Defined in: [packages/canvas/src/primitives/types.ts:443](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L443)

Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
shape id to a concrete world-space `(x, y)` point on the shape — center of
the bounding box (`'center'`, default), perimeter intersection toward the
other endpoint (`'boundary'`), or any registered custom anchor.

String shorthand picks an anchor by name with default opts; the object
form passes opts to the anchor function.
