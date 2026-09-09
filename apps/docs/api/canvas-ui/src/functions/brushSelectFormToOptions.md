# Function: brushSelectFormToOptions()

> **brushSelectFormToOptions**(`f`): [`BrushSelectOptions`](../interfaces/BrushSelectOptions.md)

Inverse of [optionsToForm](brushSelectOptionsToForm.md): fold the flat fields back to a serialisable
[BrushSelectOptions](../interfaces/BrushSelectOptions.md) patch. Only fields the form set are included (no
`undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`. `enableElements` and the `style` group are
reassembled only when a member is set; colour strings become `0xRRGGBB`
numbers.

## Parameters

### f

[`BrushSelectFields`](../interfaces/BrushSelectFields.md)

## Returns

[`BrushSelectOptions`](../interfaces/BrushSelectOptions.md)
