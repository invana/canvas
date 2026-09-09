# Interface: ThemeOptions

The serialisable subset of `ThemeBehaviourOptions` this editor produces.

Out of scope: the `themes` **registry** (`ThemeRegistry` — a record of palette
objects), the `light` / `dark` single-layer **shorthand patch records**
(`Record<string, unknown>`), and the `accent` union (`'css-var' | number` —
whose source is really a mode, not a scalar); plus the base
`targetLayerId` / `enabled` / `shortcuts`. Only the scalar knobs round-trip:
`mode`, `active`, `fallback`, and the `accentVar` CSS-custom-property name.

## Properties

### accentVar?

> `optional` **accentVar?**: `string`

CSS custom property read when the accent is sourced from a variable.

***

### active?

> `optional` **active?**: `string`

Active theme name. Matched to the host theme family.

***

### fallback?

> `optional` **fallback?**: `string`

Theme used when `active` isn't found.

***

### mode?

> `optional` **mode?**: `ThemeMode`
