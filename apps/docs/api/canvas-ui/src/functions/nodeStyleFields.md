# Function: nodeStyleFields()

> **nodeStyleFields**(`values?`): `FieldConfig`[]

Defined in: [canvas-ui/src/editors/node-style/fields.ts:166](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/fields.ts#L166)

The full NodeStyle field set as one grouped `FieldConfig[]` — the default
`fields` for `<NodeStyleEditor>`. `@invana/forms` renders each `group` as an
accordion section. Geometry numerics vary with the current `shapeKind`
(the discriminated union), so this is a function of the live values.

## Parameters

### values?

[`NodeStyleFields`](../type-aliases/NodeStyleFields.md) = `{}`

## Returns

`FieldConfig`[]
