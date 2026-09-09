# Variable: textResolutionLodFields

> `const` **textResolutionLodFields**: `FieldConfig`[]

`@invana/forms` field schema for the TextResolutionLODBehaviour editor.
Field `name`s match the keys of `TextResolutionLODFields` 1:1 so the
generator's `options.<name>` paths line up with `mapping.ts`.

The discrete `levels[]` tier array is intentionally not represented here —
it's a structural array with no `FieldType`, so it's edited elsewhere and
left untouched by this form.
