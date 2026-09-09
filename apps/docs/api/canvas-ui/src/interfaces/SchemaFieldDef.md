# Interface: SchemaFieldDef

One field of a schema: a display name + a data-type token. Extra keys are
allowed and preserved verbatim, so consumers who add their own row controls
(via SchemaEditorPanelProps.fieldRowFields — e.g. `nullable`, `description`)
get those values back on the emitted schema.

## Indexable

> \[`key`: `string`\]: `unknown`

Extra per-field attributes from custom row controls, preserved as-is.

## Properties

### name

> **name**: `string`

***

### type

> **type**: `string`

Data-type token — one of [SCHEMA\_TYPES](../variables/SCHEMA_TYPES.md) (`string` / `integer` / …).
