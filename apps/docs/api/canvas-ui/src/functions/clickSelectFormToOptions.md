# Function: clickSelectFormToOptions()

> **clickSelectFormToOptions**(`f`): [`ClickSelectOptions`](../interfaces/ClickSelectOptions.md)

Inverse of [optionsToForm](clickSelectOptionsToForm.md): fold the flat fields back to a serialisable
[ClickSelectOptions](../interfaces/ClickSelectOptions.md) patch. Only fields the form set are included (no
`undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`. `trigger` re-expands to an array (`'none'` →
`[]`).

## Parameters

### f

[`ClickSelectFields`](../interfaces/ClickSelectFields.md)

## Returns

[`ClickSelectOptions`](../interfaces/ClickSelectOptions.md)
