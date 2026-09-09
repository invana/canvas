# Function: lassoSelectFormToOptions()

> **lassoSelectFormToOptions**(`f`): [`LassoSelectOptions`](../interfaces/LassoSelectOptions.md)

Inverse of [optionsToForm](lassoSelectOptionsToForm.md): fold the flat fields back to a serialisable
[LassoSelectOptions](../interfaces/LassoSelectOptions.md) patch. Only fields the form set are included (no
`undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`. `enableElements` and the `style` group are
reassembled only when a member is set; colour strings become `0xRRGGBB`
numbers.

## Parameters

### f

[`LassoSelectFields`](../interfaces/LassoSelectFields.md)

## Returns

[`LassoSelectOptions`](../interfaces/LassoSelectOptions.md)
