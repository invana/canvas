# Function: elkLayoutFormToOptions()

> **elkLayoutFormToOptions**(`f`): [`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)

Inverse of [optionsToForm](elkLayoutOptionsToForm.md): fold the flat fields back to a serialisable
[ElkLayoutOptions](../interfaces/ElkLayoutOptions.md) patch. Only fields the form set are included, and
`defaultNodeSize` is reassembled only when a member is set — so the result is
safe to spread over the layout's current options.

## Parameters

### f

[`ElkLayoutFields`](../interfaces/ElkLayoutFields.md)

## Returns

[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)
