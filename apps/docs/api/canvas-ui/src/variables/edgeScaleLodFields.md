# Variable: edgeScaleLodFields

> `const` **edgeScaleLodFields**: `FieldConfig`[]

`@invana/forms` field schema for the EdgeScaleLODBehaviour editor. Field
`name`s match the keys of `EdgeScaleLODFields` 1:1 so the generator's
`options.<name>` paths line up with `mapping.ts`.

The per-layer `layers[]` config array (target layer + `strokeWidthPx`) is
intentionally not represented — it's a structural, identity-bearing array
with no `FieldType`, edited elsewhere and left untouched by this form.
