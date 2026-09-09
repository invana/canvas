# Function: backgroundLayerFormToOptions()

> **backgroundLayerFormToOptions**(`f`): [`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

Inverse of [optionsToForm](backgroundLayerOptionsToForm.md): fold the flat fields back to a serialisable
[BackgroundLayerOptions](../interfaces/BackgroundLayerOptions.md) patch. Only fields the form set are included
(no `undefined` / empty-string keys), so the result is safe to spread over
the layer's current options on `setOptions`. Colour strings pass straight
through — `BackgroundColor` accepts hex/CSS strings verbatim.

## Parameters

### f

[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)

## Returns

[`BackgroundLayerOptions`](../interfaces/BackgroundLayerOptions.md)
