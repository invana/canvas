# Variable: themeFields

> `const` **themeFields**: `FieldConfig`[]

`@invana/forms` field schema for the ThemeBehaviour editor. The `mode` enum
(`'system' | 'light' | 'dark'`) renders as a select; `active`, `fallback`, and
`accentVar` as text inputs. Field `name`s match
import('./types').ThemeFields 1:1 so `options.<name>` lines up with
`mapping.ts`. The `themes` registry and `light` / `dark` shorthand records have
no fields here — they aren't flat scalars.
