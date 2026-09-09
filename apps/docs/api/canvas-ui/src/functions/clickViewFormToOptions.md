# Function: clickViewFormToOptions()

> **clickViewFormToOptions**(`f`): [`ClickViewOptions`](../interfaces/ClickViewOptions.md)

Inverse of [optionsToForm](clickViewOptionsToForm.md): fold the flat fields back to a serialisable
[ClickViewOptions](../interfaces/ClickViewOptions.md) patch. Only fields the form set are included, so the
result is safe to spread over the behaviour's current options on `setOptions`.

## Parameters

### f

[`ClickViewFields`](../interfaces/ClickViewFields.md)

## Returns

[`ClickViewOptions`](../interfaces/ClickViewOptions.md)
