# Function: styleToForm()

> **styleToForm**(`style`): [`NodeStyleFields`](../type-aliases/NodeStyleFields.md)

Defined in: [canvas-ui/src/editors/node-style/mapping.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/mapping.ts#L48)

Map an engine `Partial<NodeStyle>` (e.g. the result of
`layer.resolveNodeStyle(node)`) to the flat, string-colour
[NodeStyleFields](../type-aliases/NodeStyleFields.md) the `@invana/forms` generator renders.

Extracts only the literal fields the editor handles, guarding non-scalar
values (image / glyph fills, string font weights) so they round-trip as
`undefined` rather than corrupting a field. The `shape` discriminated union
is flattened to `shapeKind` + the geometry numbers of that kind; the dash
tuple is split; colours become hex strings.

## Parameters

### style

`Partial`\<`NodeStyle`\>

## Returns

[`NodeStyleFields`](../type-aliases/NodeStyleFields.md)
