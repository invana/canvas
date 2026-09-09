# Interface: SettingsSchemaEntry

One registry entry: everything `CanvasSettingsEditorPanel` needs to render + wire
one instance's settings form. Bundles the display label, the `@invana/forms`
field schema (static array or a `(values) => FieldConfig[]` function for the
conditional schemas), and the two pure mappers that bridge the engine's option
encoding and the flat scalar fields the form edits.

`settings` is left untyped (`any`) here on purpose — each entry pairs a schema
with its own `Options`/`Fields` shapes, and the panel treats them opaquely.

## Properties

### fields

> **fields**: `FieldConfig`[] \| ((`values`) => `FieldConfig`[])

`@invana/forms` schema — a static array or a function of the live form values.

***

### section

> **section**: [`SettingsSection`](../type-aliases/SettingsSection.md)

Which config section this kind lives under (`layers` / `behaviours` / `layouts`).

***

### toForm

> **toForm**: (`options`) => `any`

Seed the flat form values from an instance's engine-shaped options.

#### Parameters

##### options

`any`

#### Returns

`any`

***

### toOptions

> **toOptions**: (`fields`) => `any`

Map the flat form values back to an engine-shaped options patch.

#### Parameters

##### fields

`any`

#### Returns

`any`

***

### typeLabel

> **typeLabel**: `string`

Human label for the kind, shown next to the instance id (e.g. `'Background Layer'`).
