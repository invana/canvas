# Function: themeOptionsToForm()

> **themeOptionsToForm**(`o?`): [`ThemeFields`](../interfaces/ThemeFields.md)

Map a `ThemeBehaviourOptions`-shaped patch to the flat [ThemeFields](../interfaces/ThemeFields.md) the
`@invana/forms` generator renders. A direct pass-through — every field is a
scalar with no encoding to bridge (no colours: `accentVar` is a CSS-variable
name, not a colour value).

## Parameters

### o?

[`ThemeOptions`](../interfaces/ThemeOptions.md) = `{}`

## Returns

[`ThemeFields`](../interfaces/ThemeFields.md)
