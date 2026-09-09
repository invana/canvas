# Variable: nodeScaleLodFields

> `const` **nodeScaleLodFields**: `FieldConfig`[]

`@invana/forms` field schema for the NodeScaleLODBehaviour editor. Field
`name`s match the keys of `NodeScaleLODFields` 1:1 so the generator's
`options.<name>` paths line up with `mapping.ts`.

The per-layer `layers[]` config array (target layer + `sizePx` /
`strokeWidthPx`) is intentionally not represented — it's a structural,
identity-bearing array with no `FieldType`, edited elsewhere and left
untouched by this form.
