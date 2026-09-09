# Variable: nodeResizeFields

> `const` **nodeResizeFields**: `FieldConfig`[]

`@invana/forms` field schema for the NodeResizeBehaviour editor. Field `name`s
match the keys of `NodeResizeFields` 1:1 so the generator's `options.<name>`
paths line up with `mapping.ts`. The engine's `dashArray` tuple is exposed as
two number fields; colours are `color` swatches.
