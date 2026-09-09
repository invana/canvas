# Function: geometricLayoutFormToOptions()

> **geometricLayoutFormToOptions**(`f`): [`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md)

Inverse of [optionsToForm](geometricLayoutOptionsToForm.md): fold the flat fields back to a serialisable
[GeometricLayoutOptions](../interfaces/GeometricLayoutOptions.md) patch. Only fields the form set are included
(no `undefined` keys), so the result is safe to spread over the layout's
current options. `centerX` / `centerY` are re-fused into a `center` object
only if at least one was set.

## Parameters

### f

[`GeometricLayoutFields`](../interfaces/GeometricLayoutFields.md)

## Returns

[`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md)
