# Function: themeFormToOptions()

> **themeFormToOptions**(`f`): [`ThemeOptions`](../interfaces/ThemeOptions.md)

Inverse of [optionsToForm](themeOptionsToForm.md): fold the flat fields back to a serialisable
[ThemeOptions](../interfaces/ThemeOptions.md) patch. Only fields the form actually set are included, so
the result is safe to spread on `setOptions`.

## Parameters

### f

[`ThemeFields`](../interfaces/ThemeFields.md)

## Returns

[`ThemeOptions`](../interfaces/ThemeOptions.md)
