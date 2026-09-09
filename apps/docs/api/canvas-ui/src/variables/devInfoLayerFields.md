# Variable: devInfoLayerFields

> `const` **devInfoLayerFields**: `FieldConfig`[]

`@invana/forms` field schema for the DevInfoLayer editor. Field `name`s match
the keys of `DevInfoLayerFields` 1:1 so the generator's `options.<name>` paths
line up with `mapping.ts`. The engine's `margin` union is surfaced as the
`marginX` / `marginY` pair.
