# Function: formToStyle()

> **formToStyle**(`f`): `Partial`\<`NodeStyle`\>

Defined in: [canvas-ui/src/editors/node-style/mapping.ts:122](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/mapping.ts#L122)

Map the flat [NodeStyleFields](../type-aliases/NodeStyleFields.md) the form holds back to an engine
`Partial<NodeStyle>` — inverse of [styleToForm](styleToForm.md). Only fields the form
actually set are included (no `undefined` keys), so the result is safe to
spread over an existing style on commit:
`store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formToStyle(fields) } })`.

## Parameters

### f

[`NodeStyleFields`](../type-aliases/NodeStyleFields.md)

## Returns

`Partial`\<`NodeStyle`\>
