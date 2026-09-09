# Interface: CanvasSettingsInstance

One editable instance in the definition — a registered Layer / Behaviour /
Layout. `kind` keys into the schema registry to resolve its form; `settings`
are the instance's current **engine-shaped** options (the panel maps them to
flat form values internally via the registry entry's `toForm`).

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Enable state for layers / behaviours — drives the row's toggle. `undefined`
(the norm for layouts) hides the toggle.

***

### id

> **id**: `string`

The instance's registry id — the key its config lives under.

***

### kind

> **kind**: `string`

Registry key (e.g. `'background-layer'`); resolves the field schema + mappers.

***

### settings?

> `optional` **settings?**: `Record`\<`string`, `unknown`\>

The instance's current options, in the engine's shape (pre-mapping).

***

### typeLabel?

> `optional` **typeLabel?**: `string`

Overrides the registry's display label for this instance.
