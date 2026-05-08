# Type Alias: IconRef

> **IconRef** = \{ `char`: `string`; `fontFamily?`: `string`; `provider`: `"unicode"`; \} \| \{ `name`: `string`; `provider`: `"fontawesome"`; `style?`: `"solid"` \| `"regular"` \| `"brands"`; \} \| \{ `name`: `string`; `provider`: `"lucide"`; `strokeWidth?`: `number`; \} \| \{ `pathD`: `string`; `provider`: `"svg"`; \}

Defined in: packages/canvas/src/primitives/types.ts:82

Discriminated reference to an icon, resolvable via `IIconRegistry`.
