# Variable: hoverElementPreviewFields

> `const` **hoverElementPreviewFields**: `FieldConfig`[]

`@invana/forms` field schema for the HoverElementPreviewBehaviour editor.
Field `name`s match the keys of `HoverElementPreviewFields` 1:1 so the
generator's `options.<name>` paths line up with `mapping.ts`. Only the scalar
timing / placement / interactivity knobs are exposed; the `card` / `cards`
templates are authored separately.
