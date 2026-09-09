# Function: bubbleSetsLayerFormToOptions()

> **bubbleSetsLayerFormToOptions**(`f`): [`BubbleSetsLayerOptions`](../interfaces/BubbleSetsLayerOptions.md)

Inverse of [optionsToForm](bubbleSetsLayerOptionsToForm.md): fold the flat fields back to a serialisable
[BubbleSetsLayerOptions](../interfaces/BubbleSetsLayerOptions.md) patch. Only fields the form set are included
(no `undefined` keys), so the result is safe to spread over the layer's
current options. The `style` group is reassembled (with `#rrggbb → 0xRRGGBB`
colours) only when at least one style field is set.

## Parameters

### f

[`BubbleSetsLayerFields`](../interfaces/BubbleSetsLayerFields.md)

## Returns

[`BubbleSetsLayerOptions`](../interfaces/BubbleSetsLayerOptions.md)
