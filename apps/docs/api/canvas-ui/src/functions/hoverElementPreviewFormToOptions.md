# Function: hoverElementPreviewFormToOptions()

> **hoverElementPreviewFormToOptions**(`f`): [`HoverElementPreviewOptions`](../interfaces/HoverElementPreviewOptions.md)

Inverse of [optionsToForm](hoverElementPreviewOptionsToForm.md): fold the flat fields back to a serialisable
[HoverElementPreviewOptions](../interfaces/HoverElementPreviewOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`.

## Parameters

### f

[`HoverElementPreviewFields`](../interfaces/HoverElementPreviewFields.md)

## Returns

[`HoverElementPreviewOptions`](../interfaces/HoverElementPreviewOptions.md)
