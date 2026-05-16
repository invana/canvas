# Type Alias: AnchorSpec

> **AnchorSpec** = `string` \| \{ `name`: `string`; `opts?`: `Readonly`\<`Record`\<`string`, `unknown`\>\>; \}

Defined in: [canvas/src/primitives/types.ts:437](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L437)

Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
shape id to a concrete world-space `(x, y)` point on the shape — center of
the bounding box (`'center'`, default), perimeter intersection toward the
other endpoint (`'boundary'`), or any registered custom anchor.

String shorthand picks an anchor by name with default opts; the object
form passes opts to the anchor function.
