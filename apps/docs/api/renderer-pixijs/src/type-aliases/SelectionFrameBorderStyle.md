# Type Alias: SelectionFrameBorderStyle

> **SelectionFrameBorderStyle** = `"solid"` \| `"dashed"` \| `"dotted"`

Border line style. `'solid'` paints a continuous outline; `'dashed'` and
`'dotted'` paint a regular gap pattern via Pixi's dashed stroke. Both
dash variants pick sensible default dash/gap lengths — supply
[SelectionFrameDecorationStyle.dashArray](../interfaces/SelectionFrameDecorationStyle.md#dasharray) to override them
verbatim.
