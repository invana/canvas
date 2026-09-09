# Variable: DEFAULT\_CANVAS\_SETTINGS\_SCHEMAS

> `const` **DEFAULT\_CANVAS\_SETTINGS\_SCHEMAS**: `Record`\<`string`, [`SettingsSchemaEntry`](../interfaces/SettingsSchemaEntry.md)\>

The built-in schema registry keyed by `kind`. Covers every Behaviour / Layer /
Layout that ships an editor in `@invana/canvas-ui` — the same coverage the
live `ALL_SETTINGS_EDITORS` descriptor list carries. Hosts can pass a superset
/ subset via `CanvasSettingsEditorPanel`'s `schemas` prop.
