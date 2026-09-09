# Function: clickInspectFormToOptions()

> **clickInspectFormToOptions**(`f`): [`ClickInspectOptions`](../interfaces/ClickInspectOptions.md)

Inverse of [optionsToForm](clickInspectOptionsToForm.md): fold the flat fields back to a serialisable
[ClickInspectOptions](../interfaces/ClickInspectOptions.md) patch. Only fields the form set are included, so
the result is safe to spread over the behaviour's current options on
`setOptions`.

## Parameters

### f

[`ClickInspectFields`](../interfaces/ClickInspectFields.md)

## Returns

[`ClickInspectOptions`](../interfaces/ClickInspectOptions.md)
