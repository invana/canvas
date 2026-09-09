# Function: keyboardCameraFormToOptions()

> **keyboardCameraFormToOptions**(`f`): [`KeyboardCameraOptions`](../interfaces/KeyboardCameraOptions.md)

Inverse of [optionsToForm](keyboardCameraOptionsToForm.md): fold the flat fields back to a serialisable
[KeyboardCameraOptions](../interfaces/KeyboardCameraOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`.

## Parameters

### f

[`KeyboardCameraFields`](../interfaces/KeyboardCameraFields.md)

## Returns

[`KeyboardCameraOptions`](../interfaces/KeyboardCameraOptions.md)
