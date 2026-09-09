# Function: labelCollisionFormToOptions()

> **labelCollisionFormToOptions**(`f`): [`LabelCollisionOptions`](../interfaces/LabelCollisionOptions.md)

Inverse of [optionsToForm](labelCollisionOptionsToForm.md): fold the flat fields back to a serialisable
[LabelCollisionOptions](../interfaces/LabelCollisionOptions.md) patch. Only fields the form actually set are
included (no `undefined` / empty-string keys), so the result is safe to spread
over the behaviour's current options on `setOptions`. The nested `groups`
object is reassembled only when at least one side is set.

## Parameters

### f

[`LabelCollisionFields`](../interfaces/LabelCollisionFields.md)

## Returns

[`LabelCollisionOptions`](../interfaces/LabelCollisionOptions.md)
