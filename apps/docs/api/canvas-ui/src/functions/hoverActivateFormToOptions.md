# Function: hoverActivateFormToOptions()

> **hoverActivateFormToOptions**(`f`): [`HoverActivateOptions`](../interfaces/HoverActivateOptions.md)

Inverse of [optionsToForm](hoverActivateOptionsToForm.md): fold the flat fields back to a serialisable
[HoverActivateOptions](../interfaces/HoverActivateOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`.

## Parameters

### f

[`HoverActivateFields`](../interfaces/HoverActivateFields.md)

## Returns

[`HoverActivateOptions`](../interfaces/HoverActivateOptions.md)
