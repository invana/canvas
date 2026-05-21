# Type Alias: SelectionFrameBorderStyle

> **SelectionFrameBorderStyle** = `"solid"` \| `"dashed"` \| `"dotted"`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L44)

Border line style. `'solid'` paints a continuous outline; `'dashed'` and
`'dotted'` paint a regular gap pattern via Pixi's dashed stroke. Both
dash variants pick sensible default dash/gap lengths — supply
[SelectionFrameDecorationStyle.dashArray](../interfaces/SelectionFrameDecorationStyle.md#dasharray) to override them
verbatim.
