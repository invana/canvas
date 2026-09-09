# Function: fitSpecToContent()

> **fitSpecToContent**(`spec`, `content`): `Record`\<`string`, `unknown`\>

Size the spec's geometry to a measured block of content (a title, a label).
The caller measures — text metrics belong to the backend — and the kind turns
that size into geometry. `undefined` when the kind doesn't size to content.

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

### content

#### height

`number`

#### width

`number`

## Returns

`Record`\<`string`, `unknown`\>
