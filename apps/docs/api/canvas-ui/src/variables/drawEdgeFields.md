# Variable: drawEdgeFields

> `const` **drawEdgeFields**: `FieldConfig`[]

`@invana/forms` field schema for the DrawEdgeBehaviour editor. Field `name`s
match the keys of import('./types').DrawEdgeFields 1:1 so the
generator's `options.<name>` paths line up with `mapping.ts`. The nested
`draftStyle` group is rendered as flat `draft`-prefixed scalars; its dash
tuple is two number inputs.
